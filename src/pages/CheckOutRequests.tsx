import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clock, CheckCircle, XCircle, Eye, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { parseSupabaseError, logError, getUserFriendlyMessage } from '@/utils/errorLogging';

interface CheckOutRequest {
  id: string;
  request_number: string;
  status: string;
  requested_items: any;
  notes: string | null;
  created_at: string;
  company_id: string;
  requested_by: string;
  request_type?: string;
  customer_id?: string;
  delivery_date?: string;
  reviewed_at?: string | null;
  rejection_reason?: string | null;
  companies?: {
    name: string;
    client_code: string;
  };
  b2b_customers?: {
    customer_name: string;
  };
}

export const CheckOutRequests: React.FC = () => {
  const { toast } = useToast();
  const [requests, setRequests] = useState<CheckOutRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<CheckOutRequest | null>(null);
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [isExportMethodDialogOpen, setIsExportMethodDialogOpen] = useState(false);
  const [exportStartDate, setExportStartDate] = useState<Date>();
  const [exportEndDate, setExportEndDate] = useState<Date>();
  const [isExporting, setIsExporting] = useState(false);
  const [selectedRequestsForExport, setSelectedRequestsForExport] = useState<string[]>([]);
  const [selectionModeActive, setSelectionModeActive] = useState(false);
  const [customersMap, setCustomersMap] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchRequests();
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const { data } = await supabase.from('b2b_customers').select('id, customer_name');
      if (data) {
        const map: Record<string, string> = {};
        data.forEach(c => { map[c.id] = c.customer_name; });
        setCustomersMap(map);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const fetchRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('check_out_requests')
        .select(`
          *,
          companies (
            name,
            client_code
          ),
          b2b_customers (
            customer_name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error('Error fetching check-out requests:', error);
      toast({
        title: "Error",
        description: "Failed to load check-out requests",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to deduct quantity from nested variants in client_products.variants
  const deductFromVariants = (
    variants: any[],
    variantAttr: string,
    variantVal: string,
    subVariantAttr?: string,
    subVariantVal?: string,
    quantityToDeduct: number = 0
  ): any[] => {
    if (!variants || !Array.isArray(variants)) return [];

    const norm = (v: any) => String(v ?? '').trim();
    const normAttr = (v: any) => norm(v).toLowerCase();

    return variants.map((variant) => {
      if (normAttr(variant.attribute) !== normAttr(variantAttr)) return variant;

      return {
        ...variant,
        values: variant.values?.map((val: any) => {
          if (norm(val.value) !== norm(variantVal)) return val;

          // If we have sub-variants to deduct from
          if (subVariantAttr && subVariantVal && val.subVariants && val.subVariants.length > 0) {
            return {
              ...val,
              subVariants: val.subVariants.map((subVar: any) => {
                if (normAttr(subVar.attribute) !== normAttr(subVariantAttr)) return subVar;

                return {
                  ...subVar,
                  values: subVar.values?.map((subVal: any) => {
                    if (norm(subVal.value) !== norm(subVariantVal)) return subVal;
                    return {
                      ...subVal,
                      quantity: Math.max(0, (subVal.quantity || 0) - quantityToDeduct),
                    };
                  }),
                };
              }),
            };
          }

          // No sub-variants, deduct from this variant value directly
          return {
            ...val,
            quantity: Math.max(0, (val.quantity || 0) - quantityToDeduct),
          };
        }),
      };
    });
  };

  const handleApprove = async (request: CheckOutRequest) => {
    setIsProcessing(true);
    let currentStep = 'initialization';
    
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        const parsedError = parseSupabaseError(userError, { operation: 'get user' });
        logError(parsedError);
        throw new Error(getUserFriendlyMessage(parsedError));
      }

      console.log(`[CHECK-OUT APPROVAL] Starting approval for request ${request.request_number} by user ${user?.id}`);
      
      // Deduct inventory for each requested item
      const items = Array.isArray(request.requested_items) ? request.requested_items : [];
      
      // Group items by product_id to batch updates to client_products.variants
      const productUpdates: Record<string, { 
        deductions: Array<{
          variantAttr?: string;
          variantVal?: string;
          subVariantAttr?: string;
          subVariantVal?: string;
          quantity: number;
        }>;
        totalDeduction: number;
      }> = {};
      
      for (const item of items) {
        const productId = item.product_id;
        const quantityToDeduct = item.quantity || 0;
        
        if (!productId || quantityToDeduct <= 0) continue;
        
        if (!productUpdates[productId]) {
          productUpdates[productId] = { deductions: [], totalDeduction: 0 };
        }
        
        productUpdates[productId].totalDeduction += quantityToDeduct;
        
        // Track variant-level deduction info
        if (item.variant_attribute && item.variant_value) {
          productUpdates[productId].deductions.push({
            variantAttr: item.variant_attribute,
            variantVal: item.variant_value,
            subVariantAttr: item.sub_variant_attribute,
            subVariantVal: item.sub_variant_value,
            quantity: quantityToDeduct
          });
        }
      }
      
      // Helper function to calculate total quantity from variants
      const calculateVariantTotal = (variants: any[]): number => {
        if (!variants || !Array.isArray(variants)) return 0;
        let total = 0;
        for (const variant of variants) {
          for (const val of variant.values || []) {
            if (val.subVariants && val.subVariants.length > 0) {
              total += calculateVariantTotal(val.subVariants);
            } else {
              total += val.quantity || 0;
            }
          }
        }
        return total;
      };

      console.log(`[CHECK-OUT APPROVAL] Processing ${Object.keys(productUpdates).length} products`);

      // Process each product
      for (const [productId, updateInfo] of Object.entries(productUpdates)) {
        currentStep = `fetching product ${productId}`;
        console.log(`[CHECK-OUT APPROVAL] ${currentStep}`);
        
        // 1. Fetch current product state
        const { data: product, error: productError } = await supabase
          .from('client_products')
          .select('variants, is_active')
          .eq('id', productId)
          .maybeSingle();

        if (productError) {
          const parsedError = parseSupabaseError(productError, { table: 'client_products', operation: 'SELECT', userId: user?.id });
          logError(parsedError);
          throw new Error(`Failed to fetch product: ${getUserFriendlyMessage(parsedError)}`);
        }
        
        // 2. Update variant quantities in client_products.variants JSON
        currentStep = `updating variants for product ${productId}`;
        let updatedVariants: any[] = product?.variants && Array.isArray(product.variants) 
          ? [...product.variants] 
          : [];
        
        if (updateInfo.deductions.length > 0 && updatedVariants.length > 0) {
          for (const deduction of updateInfo.deductions) {
            if (deduction.variantAttr && deduction.variantVal) {
              updatedVariants = deductFromVariants(
                updatedVariants,
                deduction.variantAttr,
                deduction.variantVal,
                deduction.subVariantAttr,
                deduction.subVariantVal,
                deduction.quantity
              );
            }
          }
          
          const { error: updateProductError } = await supabase
            .from('client_products')
            .update({ variants: updatedVariants, updated_at: new Date().toISOString() })
            .eq('id', productId);

          if (updateProductError) {
            const parsedError = parseSupabaseError(updateProductError, { table: 'client_products', operation: 'UPDATE variants', userId: user?.id });
            logError(parsedError);
            throw new Error(`Failed to update product variants: ${getUserFriendlyMessage(parsedError)}`);
          }
          console.log(`[CHECK-OUT APPROVAL] Updated variants for product ${productId}`);
        }
        
        // 3. Deduct from base inventory_items record
        currentStep = `updating inventory for product ${productId}`;
        console.log(`[CHECK-OUT APPROVAL] ${currentStep}`);
        
        const { data: baseInventory, error: baseInvError } = await supabase
          .from('inventory_items')
          .select('id, quantity')
          .eq('product_id', productId)
          .eq('company_id', request.company_id)
          .is('variant_attribute', null)
          .is('variant_value', null)
          .maybeSingle();
        
        if (baseInvError) {
          const parsedError = parseSupabaseError(baseInvError, { table: 'inventory_items', operation: 'SELECT', userId: user?.id });
          logError(parsedError);
          // Non-fatal, continue
          console.warn(`[CHECK-OUT APPROVAL] Could not check base inventory: ${parsedError.message}`);
        }
        
        let inventoryUpdated = false;
        let finalInventoryQuantity = 0;
        
        if (baseInventory) {
          finalInventoryQuantity = Math.max(0, baseInventory.quantity - updateInfo.totalDeduction);
          const { error: invError } = await supabase
            .from('inventory_items')
            .update({ 
              quantity: finalInventoryQuantity,
              last_updated: new Date().toISOString()
            })
            .eq('id', baseInventory.id);
          
          if (invError) {
            const parsedError = parseSupabaseError(invError, { table: 'inventory_items', operation: 'UPDATE', userId: user?.id });
            logError(parsedError);
            throw new Error(`Failed to update inventory: ${getUserFriendlyMessage(parsedError)}`);
          }
          inventoryUpdated = true;
          console.log(`[CHECK-OUT APPROVAL] Updated base inventory for product ${productId}: ${baseInventory.quantity} -> ${finalInventoryQuantity}`);
        } else {
          // Fallback: find any inventory record for this product
          const { data: anyInventory } = await supabase
            .from('inventory_items')
            .select('id, quantity')
            .eq('product_id', productId)
            .eq('company_id', request.company_id)
            .order('quantity', { ascending: false })
            .limit(1)
            .maybeSingle();
          
          if (anyInventory) {
            finalInventoryQuantity = Math.max(0, anyInventory.quantity - updateInfo.totalDeduction);
            const { error: invError } = await supabase
              .from('inventory_items')
              .update({ 
                quantity: finalInventoryQuantity,
                last_updated: new Date().toISOString()
              })
              .eq('id', anyInventory.id);
            
            if (invError) {
              const parsedError = parseSupabaseError(invError, { table: 'inventory_items', operation: 'UPDATE fallback', userId: user?.id });
              logError(parsedError);
              throw new Error(`Failed to update inventory: ${getUserFriendlyMessage(parsedError)}`);
            }
            inventoryUpdated = true;
            console.log(`[CHECK-OUT APPROVAL] Updated fallback inventory for product ${productId}: ${anyInventory.quantity} -> ${finalInventoryQuantity}`);
          }
        }

        // 4. Check if product quantity is now 0 and mark inactive if so
        const totalVariantQuantity = calculateVariantTotal(updatedVariants);
        const effectiveQuantity = updatedVariants.length > 0 ? totalVariantQuantity : finalInventoryQuantity;
        
        console.log(`[CHECK-OUT APPROVAL] Product ${productId} - Variant qty: ${totalVariantQuantity}, Inventory qty: ${finalInventoryQuantity}, Effective: ${effectiveQuantity}`);
        
        if (effectiveQuantity === 0 && (updatedVariants.length > 0 || inventoryUpdated)) {
          currentStep = `marking product ${productId} inactive`;
          const { error: inactiveError } = await supabase
            .from('client_products')
            .update({ is_active: false, updated_at: new Date().toISOString() })
            .eq('id', productId);
          
          if (inactiveError) {
            const parsedError = parseSupabaseError(inactiveError, { table: 'client_products', operation: 'UPDATE is_active', userId: user?.id });
            logError(parsedError);
            // Non-fatal, continue
            console.warn(`[CHECK-OUT APPROVAL] Could not mark product inactive: ${parsedError.message}`);
          } else {
            console.log(`[CHECK-OUT APPROVAL] Product ${productId} marked inactive due to zero quantity after checkout`);
          }
        }
      }
      
      // Update request status
      currentStep = 'updating request status';
      console.log(`[CHECK-OUT APPROVAL] ${currentStep}`);
      
      const { error } = await supabase
        .from('check_out_requests')
        .update({
          status: 'approved',
          reviewed_at: new Date().toISOString(),
          reviewed_by: user?.id,
        })
        .eq('id', request.id);

      if (error) {
        const parsedError = parseSupabaseError(error, { table: 'check_out_requests', operation: 'UPDATE status', userId: user?.id });
        logError(parsedError);
        throw new Error(`Failed to update request status: ${getUserFriendlyMessage(parsedError)}`);
      }

      console.log(`[CHECK-OUT APPROVAL] Successfully approved request ${request.request_number}`);

      toast({
        title: "Success",
        description: "Check-out request approved and inventory updated",
      });

      fetchRequests();
      setIsReviewDialogOpen(false);
      setSelectedRequest(null);
    } catch (error) {
      console.error(`[CHECK-OUT APPROVAL] Error at step "${currentStep}":`, error);
      
      const parsedError = parseSupabaseError(error, { 
        operation: `approve check-out (${currentStep})`,
        context: { requestId: request.id, requestNumber: request.request_number }
      });
      logError(parsedError);
      
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : getUserFriendlyMessage(parsedError),
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async (request: CheckOutRequest) => {
    if (!rejectionReason.trim()) {
      toast({
        title: "Error",
        description: "Please provide a reason for rejection",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        const parsedError = parseSupabaseError(userError, { operation: 'get user' });
        logError(parsedError);
        throw new Error(getUserFriendlyMessage(parsedError));
      }

      console.log(`[CHECK-OUT REJECTION] Rejecting request ${request.request_number} by user ${user?.id}`);
      
      const { error } = await supabase
        .from('check_out_requests')
        .update({
          status: 'rejected',
          reviewed_at: new Date().toISOString(),
          reviewed_by: user?.id,
          rejection_reason: rejectionReason,
        })
        .eq('id', request.id);

      if (error) {
        const parsedError = parseSupabaseError(error, { table: 'check_out_requests', operation: 'UPDATE status to rejected', userId: user?.id });
        logError(parsedError);
        throw new Error(getUserFriendlyMessage(parsedError));
      }

      console.log(`[CHECK-OUT REJECTION] Successfully rejected request ${request.request_number}`);

      toast({
        title: "Success",
        description: "Check-out request rejected",
      });

      fetchRequests();
      setIsReviewDialogOpen(false);
      setSelectedRequest(null);
      setRejectionReason('');
    } catch (error) {
      console.error('[CHECK-OUT REJECTION] Error rejecting request:', error);
      
      const parsedError = parseSupabaseError(error, { 
        table: 'check_out_requests', 
        operation: 'reject request',
        context: { requestId: request.id, requestNumber: request.request_number }
      });
      logError(parsedError);
      
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : getUserFriendlyMessage(parsedError),
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const openReviewDialog = (request: CheckOutRequest) => {
    setSelectedRequest(request);
    setRejectionReason('');
    setIsReviewDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge className="bg-yellow-100 text-yellow-800">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      case 'approved':
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Approved
          </Badge>
        );
      case 'rejected':
        return (
          <Badge className="bg-red-100 text-red-800">
            <XCircle className="h-3 w-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const approvedRequests = requests.filter(r => r.status === 'approved');
  const rejectedRequests = requests.filter(r => r.status === 'rejected');

  const handleSelectAll = (requestsList: CheckOutRequest[], checked: boolean) => {
    if (checked) {
      const requestIds = requestsList.map(r => r.id);
      setSelectedRequestsForExport(prev => [...new Set([...prev, ...requestIds])]);
    } else {
      const requestIds = new Set(requestsList.map(r => r.id));
      setSelectedRequestsForExport(prev => prev.filter(id => !requestIds.has(id)));
    }
  };

  const handleSelectRequest = (requestId: string, checked: boolean) => {
    if (checked) {
      setSelectedRequestsForExport(prev => [...prev, requestId]);
    } else {
      setSelectedRequestsForExport(prev => prev.filter(id => id !== requestId));
    }
  };

  const handleExportButtonClick = () => {
    if (selectionModeActive && selectedRequestsForExport.length > 0) {
      setIsExportDialogOpen(true);
    } else if (selectionModeActive && selectedRequestsForExport.length === 0) {
      toast({
        title: "No Requests Selected",
        description: "Please select at least one request to export",
        variant: "destructive",
      });
    } else {
      setIsExportMethodDialogOpen(true);
    }
  };

  const enableSelectionMode = () => {
    setSelectionModeActive(true);
    setSelectedRequestsForExport([]);
    setIsExportMethodDialogOpen(false);
    toast({
      title: "Selection Mode Enabled",
      description: "Select the requests you want to export, then click Export Report again",
    });
  };

  const cancelSelectionMode = () => {
    setSelectionModeActive(false);
    setSelectedRequestsForExport([]);
  };

  const generatePDF = async (requestsToExport: CheckOutRequest[]) => {
    try {
      setIsExporting(true);
      await new Promise(resolve => setTimeout(resolve, 100));

      const doc = new jsPDF();
      
      doc.setFontSize(18);
      doc.text('Check-Out Requests Report', 14, 20);
      
      if (exportStartDate || exportEndDate) {
        doc.setFontSize(10);
        const dateRangeText = `Date Range: ${exportStartDate ? format(exportStartDate, 'PP') : 'All'} - ${exportEndDate ? format(exportEndDate, 'PP') : 'All'}`;
        doc.text(dateRangeText, 14, 28);
      }
      
      let yPosition = exportStartDate || exportEndDate ? 35 : 30;
      
      for (let i = 0; i < requestsToExport.length; i++) {
        const request = requestsToExport[i];
        
        if (i > 0) {
          doc.addPage();
          yPosition = 20;
        }
        
        doc.setFontSize(14);
        doc.text(`Request #${request.request_number}`, 14, yPosition);
        yPosition += 7;
        
        doc.setFontSize(10);
        doc.text(`Client: ${request.companies?.name || 'N/A'}`, 14, yPosition);
        yPosition += 5;
        doc.text(`Client Code: ${request.companies?.client_code || 'N/A'}`, 14, yPosition);
        yPosition += 5;
        doc.text(`Status: ${request.status.toUpperCase()}`, 14, yPosition);
        yPosition += 5;
        doc.text(`Submitted: ${new Date(request.created_at).toLocaleDateString()}`, 14, yPosition);
        yPosition += 10;
        
        doc.setFontSize(12);
        doc.text('Requested Items:', 14, yPosition);
        yPosition += 5;
        
        const items = Array.isArray(request.requested_items) ? request.requested_items : [];
        const tableData = items.map((item: any) => {
          const variantInfo = item.variant_attribute && item.variant_value 
            ? `${item.variant_attribute}: ${item.variant_value}`
            : 'N/A';
          return [
            item.product_name || 'Unnamed Item',
            variantInfo,
            (item.quantity || 0).toString()
          ];
        });
        
        autoTable(doc, {
          startY: yPosition,
          head: [['Product', 'Variant', 'Quantity']],
          body: tableData,
          theme: 'grid',
          headStyles: { fillColor: [59, 130, 246] },
        });
        
        yPosition = (doc as any).lastAutoTable?.finalY + 10 || yPosition + 40;
        
        if (request.notes) {
          doc.setFontSize(10);
          doc.text('Notes:', 14, yPosition);
          yPosition += 5;
          const splitNotes = doc.splitTextToSize(request.notes, 180);
          doc.text(splitNotes, 14, yPosition);
          yPosition += splitNotes.length * 5 + 5;
        }
        
        if (request.status === 'rejected' && request.rejection_reason) {
          doc.setFontSize(10);
          doc.setTextColor(220, 38, 38);
          doc.text('Rejection Reason:', 14, yPosition);
          yPosition += 5;
          const splitReason = doc.splitTextToSize(request.rejection_reason, 180);
          doc.text(splitReason, 14, yPosition);
          doc.setTextColor(0, 0, 0);
        }
      }
      
      const fileName = `checkout-requests-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
      doc.save(fileName);

      toast({
        title: "Export Successful",
        description: `Exported ${requestsToExport.length} check-out request(s)`,
      });

      setIsExportDialogOpen(false);
      setExportStartDate(undefined);
      setExportEndDate(undefined);
      setSelectedRequestsForExport([]);
      setSelectionModeActive(false);
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Error",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportByDateRange = async () => {
    let requestsToExport = [...requests];
    
    if (exportStartDate || exportEndDate) {
      requestsToExport = requestsToExport.filter(request => {
        const requestDate = new Date(request.created_at);
        
        if (exportStartDate && requestDate < exportStartDate) {
          return false;
        }
        
        if (exportEndDate) {
          const endOfDay = new Date(exportEndDate);
          endOfDay.setHours(23, 59, 59, 999);
          if (requestDate > endOfDay) {
            return false;
          }
        }
        
        return true;
      });
    }
    
    if (requestsToExport.length === 0) {
      toast({
        title: "No requests to export",
        description: "No check-out requests found in the selected date range",
        variant: "destructive",
      });
      return;
    }
    
    await generatePDF(requestsToExport);
  };

  const handleExportBySelection = async () => {
    if (selectedRequestsForExport.length === 0) {
      toast({
        title: "No Requests Selected",
        description: "Please select at least one request to export",
        variant: "destructive",
      });
      return;
    }

    const requestsToExport = requests.filter(req => selectedRequestsForExport.includes(req.id));
    await generatePDF(requestsToExport);
  };

  const renderRequestsTable = (requestsList: CheckOutRequest[], showActions: boolean = true) => {
    const allSelected = requestsList.length > 0 && requestsList.every(r => selectedRequestsForExport.includes(r.id));
    
    return (
      requestsList.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              {selectionModeActive && (
                <TableHead className="w-12">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={(checked) => handleSelectAll(requestsList, checked as boolean)}
                    aria-label="Select all"
                  />
                </TableHead>
              )}
              <TableHead>Request #</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Submitted</TableHead>
              {showActions && <TableHead>Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {requestsList.map((request) => (
              <TableRow key={request.id}>
                {selectionModeActive && (
                  <TableCell>
                    <Checkbox
                      checked={selectedRequestsForExport.includes(request.id)}
                      onCheckedChange={(checked) => handleSelectRequest(request.id, checked as boolean)}
                      aria-label={`Select ${request.request_number}`}
                    />
                  </TableCell>
                )}
                <TableCell className="font-mono text-sm">
                  {request.request_number}
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">{request.companies?.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {request.companies?.client_code}
                    </div>
                  </div>
                </TableCell>
                <TableCell>{getStatusBadge(request.status)}</TableCell>
                <TableCell>
                  {Array.isArray(request.requested_items)
                    ? `${request.requested_items.length} item(s)`
                    : 'N/A'}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {new Date(request.created_at).toLocaleDateString()}
                </TableCell>
                {showActions && (
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openReviewDialog(request)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      {request.status === 'pending' ? 'Review' : 'View Details'}
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No requests found</p>
        </div>
      )
    );
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Check-Out Requests</h1>
          <p className="text-muted-foreground">Review and approve client product check-out requests</p>
        </div>
        <div className="flex items-center gap-3">
          {selectionModeActive && (
            <>
              {selectedRequestsForExport.length > 0 && (
                <span className="text-sm text-muted-foreground">
                  {selectedRequestsForExport.length} selected
                </span>
              )}
              <Button 
                onClick={cancelSelectionMode} 
                variant="ghost"
                size="sm"
              >
                Cancel Selection
              </Button>
            </>
          )}
          <Button onClick={handleExportButtonClick} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pending">
            Pending ({pendingRequests.length})
          </TabsTrigger>
          <TabsTrigger value="approved">
            Approved ({approvedRequests.length})
          </TabsTrigger>
          <TabsTrigger value="rejected">
            Rejected ({rejectedRequests.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Pending Requests</CardTitle>
              <CardDescription>Requests awaiting review</CardDescription>
            </CardHeader>
            <CardContent>
              {renderRequestsTable(pendingRequests)}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="approved" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Approved Requests</CardTitle>
              <CardDescription>Previously approved check-out requests</CardDescription>
            </CardHeader>
            <CardContent>
              {renderRequestsTable(approvedRequests)}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rejected" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Rejected Requests</CardTitle>
              <CardDescription>Previously rejected check-out requests</CardDescription>
            </CardHeader>
            <CardContent>
              {renderRequestsTable(rejectedRequests)}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Review/View Dialog */}
      <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedRequest?.status === 'pending' ? 'Review' : 'View'} Check-Out Request
            </DialogTitle>
            <DialogDescription>
              {selectedRequest?.request_number} - {selectedRequest?.companies?.name}
            </DialogDescription>
          </DialogHeader>
          
          {selectedRequest && (
            <div className="space-y-6">
              {/* Request Info */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                <div>
                  <div className="text-sm text-muted-foreground">Status</div>
                  <div className="mt-1">{getStatusBadge(selectedRequest.status)}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Submitted</div>
                  <div className="mt-1">{new Date(selectedRequest.created_at).toLocaleString()}</div>
                </div>
                {selectedRequest.reviewed_at && (
                  <div>
                    <div className="text-sm text-muted-foreground">Reviewed</div>
                    <div className="mt-1">{new Date(selectedRequest.reviewed_at).toLocaleString()}</div>
                  </div>
                )}
                {selectedRequest.request_type === 'ship_to_client' && selectedRequest.b2b_customers && (
                  <div>
                    <div className="text-sm text-muted-foreground">Customer</div>
                    <div className="mt-1">{selectedRequest.b2b_customers.customer_name}</div>
                  </div>
                )}
                {selectedRequest.delivery_date && (
                  <div>
                    <div className="text-sm text-muted-foreground">Delivery Date</div>
                    <div className="mt-1">{new Date(selectedRequest.delivery_date).toLocaleDateString()}</div>
                  </div>
                )}
              </div>

              {/* Requested Items */}
              <div>
                <h3 className="font-semibold mb-3 text-lg">Requested Items</h3>
                <div className="space-y-2">
                  {Array.isArray(selectedRequest.requested_items) &&
                    selectedRequest.requested_items.map((item: any, index: number) => (
                      <Card key={index} className="p-4">
                        <div className="flex justify-between">
                          <div>
                            <div className="font-medium">{item.product_name}</div>
                            {item.variant_attribute && item.variant_value && (
                              <div className="text-sm text-muted-foreground">
                                {item.variant_attribute}: {item.variant_value}
                              </div>
                            )}
                            {item.customerId && customersMap[item.customerId] && (
                              <Badge variant="outline" className="text-xs mt-1">
                                Customer: {customersMap[item.customerId]}
                              </Badge>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="font-semibold">Qty: {item.quantity}</div>
                          </div>
                        </div>
                      </Card>
                    ))}
                </div>
              </div>

              {/* Notes */}
              {selectedRequest.notes && (
                <div>
                  <h3 className="font-semibold mb-2">Notes</h3>
                  <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                    {selectedRequest.notes}
                  </p>
                </div>
              )}

              {/* Rejection Reason (for rejected requests) */}
              {selectedRequest.status === 'rejected' && selectedRequest.rejection_reason && (
                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-2 text-destructive">Rejection Reason</h3>
                  <p className="text-sm text-destructive/80 bg-destructive/10 p-3 rounded-lg">
                    {selectedRequest.rejection_reason}
                  </p>
                </div>
              )}

              {/* Actions for pending requests */}
              {selectedRequest.status === 'pending' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="rejectionReason">Rejection Reason (if rejecting)</Label>
                    <Textarea
                      id="rejectionReason"
                      placeholder="Provide a reason for rejection..."
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      rows={3}
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsReviewDialogOpen(false);
                        setSelectedRequest(null);
                        setRejectionReason('');
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => handleReject(selectedRequest)}
                      disabled={isProcessing}
                    >
                      Reject
                    </Button>
                    <Button
                      onClick={() => handleApprove(selectedRequest)}
                      disabled={isProcessing}
                    >
                      {isProcessing ? 'Processing...' : 'Approve'}
                    </Button>
                  </div>
                </>
              )}

              {/* Close button for non-pending requests */}
              {selectedRequest.status !== 'pending' && (
                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsReviewDialogOpen(false);
                      setSelectedRequest(null);
                    }}
                  >
                    Close
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Export Method Selection Dialog */}
      <Dialog open={isExportMethodDialogOpen} onOpenChange={setIsExportMethodDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Choose Export Method</DialogTitle>
            <DialogDescription>
              How would you like to select requests to export?
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3">
            <Button
              variant="outline"
              className="w-full h-auto py-4 flex-col items-start"
              onClick={() => {
                setIsExportMethodDialogOpen(false);
                setIsExportDialogOpen(true);
              }}
            >
              <div className="font-semibold text-base mb-1">Export by Date Range</div>
              <div className="text-sm text-muted-foreground font-normal">
                Export all requests within a specific date range
              </div>
            </Button>
            
            <Button
              variant="outline"
              className="w-full h-auto py-4 flex-col items-start"
              onClick={enableSelectionMode}
            >
              <div className="font-semibold text-base mb-1">Export Selected Requests</div>
              <div className="text-sm text-muted-foreground font-normal">
                Manually pick which requests to export
              </div>
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Export Dialog */}
      <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectionModeActive ? 'Export Selected Requests' : 'Export by Date Range'}
            </DialogTitle>
            <DialogDescription>
              {selectionModeActive 
                ? `Exporting ${selectedRequestsForExport.length} selected request(s)` 
                : 'Select a date range to filter requests (optional)'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {!selectionModeActive && (
              <>
                <div className="space-y-2">
                  <Label>Start Date (Optional)</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !exportStartDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {exportStartDate ? format(exportStartDate, "PPP") : "Pick a start date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={exportStartDate}
                        onSelect={setExportStartDate}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label>End Date (Optional)</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !exportEndDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {exportEndDate ? format(exportEndDate, "PPP") : "Pick an end date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={exportEndDate}
                        onSelect={setExportEndDate}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </>
            )}

            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setIsExportDialogOpen(false);
                  setExportStartDate(undefined);
                  setExportEndDate(undefined);
                }}
              >
                Cancel
              </Button>
              <Button 
                onClick={selectionModeActive ? handleExportBySelection : handleExportByDateRange} 
                disabled={isExporting}
              >
                {isExporting ? "Generating PDF..." : "Export PDF"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Clock, CheckCircle, XCircle, Eye, FileText, Plus, Trash2, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { calculateNestedVariantQuantity, getVariantBreakdown, hasNestedVariants, Variant, VariantValue } from '@/types/variants';
import { NestedVariantEditor } from '@/components/NestedVariantEditor';

// Helper function to merge new variants into existing variants
// Adds new variant types or new values to existing types, accumulating quantities
const mergeVariants = (existingVariants: any[], newVariants: any[]): any[] => {
  if (!newVariants || newVariants.length === 0) return existingVariants || [];
  if (!existingVariants || existingVariants.length === 0) return newVariants;

  const merged = JSON.parse(JSON.stringify(existingVariants));

  for (const newVariant of newVariants) {
    const existingVariant = merged.find(
      (v: any) => v.attribute?.toLowerCase().trim() === newVariant.attribute?.toLowerCase().trim()
    );

    if (existingVariant) {
      // Merge values into existing variant
      for (const newValue of newVariant.values || []) {
        const existingValue = existingVariant.values?.find(
          (v: any) => v.value?.toLowerCase().trim() === newValue.value?.toLowerCase().trim()
        );

        if (existingValue) {
          // Add quantity to existing value
          existingValue.quantity = (existingValue.quantity || 0) + (newValue.quantity || 0);
          // Recursively merge sub-variants if they exist
          if (newValue.subVariants && newValue.subVariants.length > 0) {
            existingValue.subVariants = mergeVariants(existingValue.subVariants || [], newValue.subVariants);
          }
        } else {
          // Add new value to existing variant
          existingVariant.values = existingVariant.values || [];
          existingVariant.values.push(JSON.parse(JSON.stringify(newValue)));
        }
      }
    } else {
      // Add completely new variant type
      merged.push(JSON.parse(JSON.stringify(newVariant)));
    }
  }

  return merged;
};

// Recursive component to display nested variants
const VariantDisplay: React.FC<{ variant: any; depth: number; isPrimary?: boolean }> = ({ 
  variant, 
  depth, 
  isPrimary = false 
}) => {
  const borderClass = isPrimary ? 'border-primary/30' : 'border-muted';
  const textClass = isPrimary ? 'text-primary' : '';
  
  return (
    <div className={`ml-4 border-l-2 ${borderClass} pl-3`}>
      <div className="font-medium text-sm">{variant.attribute}:</div>
      <div className="ml-3 mt-1 space-y-1">
        {variant.values?.map((val: any, valIndex: number) => (
          <div key={valIndex}>
            <div className="text-sm flex items-center gap-2">
              <span className="text-muted-foreground">{val.value}:</span>
              {(!val.subVariants || val.subVariants.length === 0) && (
                <span className={`font-semibold ${textClass}`}>{val.quantity}</span>
              )}
            </div>
            {/* Recursively render subVariants */}
            {val.subVariants && val.subVariants.length > 0 && (
              <div className="mt-1">
                {val.subVariants.map((subVariant: any, svIndex: number) => (
                  <VariantDisplay 
                    key={svIndex} 
                    variant={subVariant} 
                    depth={depth + 1} 
                    isPrimary={isPrimary}
                  />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

interface CheckInRequest {
  id: string;
  request_number: string;
  status: string;
  requested_products: any;
  notes: string | null;
  created_at: string;
  company_id: string;
  requested_by: string;
  amended_products?: any;
  amendment_notes?: string | null;
  was_amended?: boolean;
  rejection_reason?: string | null;
  reviewed_at?: string | null;
  request_type?: string;
  supplier_id?: string;
  required_date?: string;
  companies?: {
    name: string;
    client_code: string;
  };
  b2b_suppliers?: {
    supplier_name: string;
  };
}

export const CheckInRequests: React.FC = () => {
  const { toast } = useToast();
  const [requests, setRequests] = useState<CheckInRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<CheckInRequest | null>(null);
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const [isAmendDialogOpen, setIsAmendDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [amendedProducts, setAmendedProducts] = useState<any[]>([]);
  const [amendmentNotes, setAmendmentNotes] = useState('');
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [isExportMethodDialogOpen, setIsExportMethodDialogOpen] = useState(false);
  const [exportStartDate, setExportStartDate] = useState<Date | undefined>(undefined);
  const [exportEndDate, setExportEndDate] = useState<Date | undefined>(undefined);
  const [selectedRequestsForExport, setSelectedRequestsForExport] = useState<string[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [selectionModeActive, setSelectionModeActive] = useState(false);
  const [suppliersMap, setSuppliersMap] = useState<Record<string, string>>({});
  const [customersMap, setCustomersMap] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchRequests();
    fetchSuppliersAndCustomers();
  }, []);

  const fetchSuppliersAndCustomers = async () => {
    try {
      const [suppliersRes, customersRes] = await Promise.all([
        supabase.from('b2b_suppliers').select('id, supplier_name'),
        supabase.from('b2b_customers').select('id, customer_name')
      ]);

      if (suppliersRes.data) {
        const map: Record<string, string> = {};
        suppliersRes.data.forEach(s => { map[s.id] = s.supplier_name; });
        setSuppliersMap(map);
      }

      if (customersRes.data) {
        const map: Record<string, string> = {};
        customersRes.data.forEach(c => { map[c.id] = c.customer_name; });
        setCustomersMap(map);
      }
    } catch (error) {
      console.error('Error fetching suppliers/customers:', error);
    }
  };

  const fetchRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('check_in_requests')
        .select(`
          *,
          companies (
            name,
            client_code
          ),
          b2b_suppliers (
            supplier_name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error('Error fetching check-in requests:', error);
      toast({
        title: "Error",
        description: "Failed to load check-in requests",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (request: CheckInRequest) => {
    setIsProcessing(true);
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      // Get or create products and update inventory
      const productsToProcess = request.was_amended && request.amended_products 
        ? request.amended_products 
        : request.requested_products;

      for (const product of productsToProcess) {
        let productId: string;
        let existingProduct: { id: string } | null = null;

        // First, check if we have an existing product ID from the check-in request
        if (product.existingProductId) {
          const { data: productById } = await supabase
            .from('client_products')
            .select('id')
            .eq('id', product.existingProductId)
            .maybeSingle();
          existingProduct = productById;
        }
        
        // Fallback to name search if no existing product ID
        if (!existingProduct) {
          const { data: productByName } = await supabase
            .from('client_products')
            .select('id')
            .eq('company_id', request.company_id)
            .eq('name', product.name)
            .maybeSingle();
          existingProduct = productByName;
        }

        if (existingProduct) {
          // Use existing product
          productId = existingProduct.id;
          
          // Merge new variants into existing product variants
          if (product.variants && product.variants.length > 0) {
            const { data: productData } = await supabase
              .from('client_products')
              .select('variants')
              .eq('id', productId)
              .single();
            
            const existingVariants = productData?.variants || [];
            const mergedVariants = mergeVariants(existingVariants as any[], product.variants);
            
            console.log('Merging variants for product:', productId);
            console.log('Existing variants:', existingVariants);
            console.log('New variants from check-in:', product.variants);
            console.log('Merged result:', mergedVariants);
            
            const { error: updateError } = await supabase
              .from('client_products')
              .update({ variants: mergedVariants })
              .eq('id', productId);
            
            if (updateError) {
              console.error('Error updating variants:', updateError);
            }
          }
        } else {
          // Create new product
          const { data: newProduct, error: insertError } = await supabase
            .from('client_products')
            .insert({
              company_id: request.company_id,
              name: product.name,
              variants: product.variants || [],
              is_active: true,
            })
            .select('id')
            .single();

          if (insertError) throw insertError;
          productId = newProduct.id;
        }

        // Calculate total quantity for products with variants (supports nested)
        let totalQuantity = product.quantity || 0;
        if (product.variants && product.variants.length > 0) {
          totalQuantity = calculateNestedVariantQuantity(product.variants);
        }

        // Check if inventory item exists for this product
        const { data: existingInventory } = await supabase
          .from('inventory_items')
          .select('id, quantity')
          .eq('product_id', productId)
          .eq('company_id', request.company_id)
          .is('location_id', null)
          .is('variant_attribute', null)
          .maybeSingle();

        if (existingInventory) {
          // Update existing inventory by ADDING to current quantity
          const { error: updateError } = await supabase
            .from('inventory_items')
            .update({ 
              quantity: existingInventory.quantity + totalQuantity,
              last_updated: new Date().toISOString()
            })
            .eq('id', existingInventory.id);

          if (updateError) throw updateError;
        } else {
          // No inventory_items record exists - check if product has existing variant quantities
          const { data: existingProduct } = await supabase
            .from('client_products')
            .select('variants')
            .eq('id', productId)
            .single();
          
          // Calculate existing quantity from product variants (if any)
          let existingVariantQuantity = 0;
          if (existingProduct?.variants && Array.isArray(existingProduct.variants) && existingProduct.variants.length > 0) {
            existingVariantQuantity = calculateNestedVariantQuantity(existingProduct.variants as unknown as Variant[]);
          }
          
          // Create new inventory item with existing + new quantity
          const { error: insertError } = await supabase
            .from('inventory_items')
            .insert({
              product_id: productId,
              company_id: request.company_id,
              quantity: existingVariantQuantity + totalQuantity,
              received_date: new Date().toISOString()
            });

          if (insertError) throw insertError;
        }
      }

      // Update request status
      const { error: updateError } = await supabase
        .from('check_in_requests')
        .update({
          status: 'approved',
          reviewed_at: new Date().toISOString(),
          reviewed_by: user?.id,
        })
        .eq('id', request.id);

      if (updateError) throw updateError;

      toast({
        title: "Success",
        description: "Check-in request approved and products added to inventory",
      });

      fetchRequests();
      setIsReviewDialogOpen(false);
      setSelectedRequest(null);
    } catch (error) {
      console.error('Error approving request:', error);
      toast({
        title: "Error",
        description: "Failed to approve check-in request",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async (request: CheckInRequest) => {
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
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('check_in_requests')
        .update({
          status: 'rejected',
          reviewed_at: new Date().toISOString(),
          reviewed_by: user?.id,
          rejection_reason: rejectionReason,
        })
        .eq('id', request.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Check-in request rejected",
      });

      fetchRequests();
      setIsReviewDialogOpen(false);
      setSelectedRequest(null);
      setRejectionReason('');
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast({
        title: "Error",
        description: "Failed to reject check-in request",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const openReviewDialog = (request: CheckInRequest) => {
    setSelectedRequest(request);
    setRejectionReason('');
    setIsReviewDialogOpen(true);
  };

  const openAmendDialog = (request: CheckInRequest) => {
    setSelectedRequest(request);
    setAmendedProducts(JSON.parse(JSON.stringify(request.requested_products)));
    setAmendmentNotes('');
    setIsAmendDialogOpen(true);
  };

  const updateAmendedProduct = (index: number, field: string, value: any) => {
    const updated = [...amendedProducts];
    updated[index] = { ...updated[index], [field]: value };
    setAmendedProducts(updated);
  };

  const updateAmendedVariantValue = (
    productIndex: number,
    variantIndex: number,
    valueIndex: number,
    field: string,
    value: any
  ) => {
    const updated = [...amendedProducts];
    if (!updated[productIndex].variants) updated[productIndex].variants = [];
    if (!updated[productIndex].variants[variantIndex].values)
      updated[productIndex].variants[variantIndex].values = [];

    updated[productIndex].variants[variantIndex].values[valueIndex] = {
      ...updated[productIndex].variants[variantIndex].values[valueIndex],
      [field]: value,
    };

    // Auto-update total quantity when variants exist
    if (
      updated[productIndex].variants &&
      updated[productIndex].variants.length > 0
    ) {
      const totalQty = updated[productIndex].variants.reduce(
        (sum: number, variant: any) =>
          sum +
          variant.values.reduce(
            (vSum: number, val: any) => vSum + (val.quantity || 0),
            0
          ),
        0
      );
      updated[productIndex].quantity = totalQty;
    }

    setAmendedProducts(updated);
  };

  const addVariantToProduct = (productIndex: number) => {
    const updated = [...amendedProducts];
    if (!updated[productIndex].variants) {
      updated[productIndex].variants = [];
    }
    updated[productIndex].variants.push({
      attribute: '',
      values: [{ value: '', quantity: 0 }]
    });
    setAmendedProducts(updated);
  };

  const addVariantValue = (productIndex: number, variantIndex: number) => {
    const updated = [...amendedProducts];
    updated[productIndex].variants[variantIndex].values.push({
      value: '',
      quantity: 0
    });
    setAmendedProducts(updated);
  };

  const updateVariantAttribute = (productIndex: number, variantIndex: number, attribute: string) => {
    const updated = [...amendedProducts];
    updated[productIndex].variants[variantIndex].attribute = attribute;
    setAmendedProducts(updated);
  };

  const removeVariant = (productIndex: number, variantIndex: number) => {
    const updated = [...amendedProducts];
    updated[productIndex].variants.splice(variantIndex, 1);
    
    // Recalculate total quantity
    if (updated[productIndex].variants.length > 0) {
      const totalQty = updated[productIndex].variants.reduce(
        (sum: number, variant: any) =>
          sum +
          variant.values.reduce(
            (vSum: number, val: any) => vSum + (val.quantity || 0),
            0
          ),
        0
      );
      updated[productIndex].quantity = totalQty;
    } else {
      // If no variants remain, set quantity to 0
      updated[productIndex].quantity = 0;
    }
    
    setAmendedProducts(updated);
  };

  const removeVariantValue = (productIndex: number, variantIndex: number, valueIndex: number) => {
    const updated = [...amendedProducts];
    updated[productIndex].variants[variantIndex].values.splice(valueIndex, 1);
    
    // Recalculate total quantity
    const totalQty = updated[productIndex].variants.reduce(
      (sum: number, variant: any) =>
        sum +
        variant.values.reduce(
          (vSum: number, val: any) => vSum + (val.quantity || 0),
          0
        ),
      0
    );
    updated[productIndex].quantity = totalQty;
    
    setAmendedProducts(updated);
  };

  const handleAmendAndApprove = async () => {
    if (!selectedRequest) return;

    try {
      setIsProcessing(true);
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();

      // Create/update inventory with amended quantities
      for (const product of amendedProducts) {
        let productId: string;
        let existingProduct: { id: string } | null = null;

        // First, check if we have an existing product ID from the check-in request
        if (product.existingProductId) {
          const { data: productById } = await supabase
            .from('client_products')
            .select('id')
            .eq('id', product.existingProductId)
            .maybeSingle();
          existingProduct = productById;
        }
        
        // Fallback to name search if no existing product ID
        if (!existingProduct) {
          const { data: productByName } = await supabase
            .from('client_products')
            .select('id')
            .eq('company_id', selectedRequest.company_id)
            .eq('name', product.name)
            .maybeSingle();
          existingProduct = productByName;
        }

        if (existingProduct) {
          // Use existing product
          productId = existingProduct.id;
          
          // Merge new variants into existing product variants
          if (product.variants && product.variants.length > 0) {
            const { data: productData } = await supabase
              .from('client_products')
              .select('variants')
              .eq('id', productId)
              .single();
            
            const existingVariants = productData?.variants || [];
            const mergedVariants = mergeVariants(existingVariants as any[], product.variants);
            
            console.log('Amend - Merging variants for product:', productId);
            console.log('Amend - Existing variants:', existingVariants);
            console.log('Amend - New variants from check-in:', product.variants);
            console.log('Amend - Merged result:', mergedVariants);
            
            const { error: updateError } = await supabase
              .from('client_products')
              .update({ variants: mergedVariants })
              .eq('id', productId);
            
            if (updateError) {
              console.error('Error updating variants:', updateError);
            }
          }
        } else {
          // Create new product
          const { data: newProduct, error: insertError } = await supabase
            .from('client_products')
            .insert({
              company_id: selectedRequest.company_id,
              name: product.name,
              variants: product.variants || [],
              is_active: true,
            })
            .select('id')
            .single();

          if (insertError) throw insertError;
          productId = newProduct.id;
        }

        // Calculate total quantity for products with variants (supports nested)
        let totalQuantity = product.quantity || 0;
        if (product.variants && product.variants.length > 0) {
          totalQuantity = calculateNestedVariantQuantity(product.variants);
        }

        // Check if inventory item exists for this product
        const { data: existingInventory } = await supabase
          .from('inventory_items')
          .select('id, quantity')
          .eq('product_id', productId)
          .eq('company_id', selectedRequest.company_id)
          .is('location_id', null)
          .is('variant_attribute', null)
          .maybeSingle();

        if (existingInventory) {
          // Update existing inventory by ADDING to current quantity
          const { error: updateError } = await supabase
            .from('inventory_items')
            .update({ 
              quantity: existingInventory.quantity + totalQuantity,
              last_updated: new Date().toISOString()
            })
            .eq('id', existingInventory.id);

          if (updateError) throw updateError;
        } else {
          // No inventory_items record exists - check if product has existing variant quantities
          const { data: existingProductData } = await supabase
            .from('client_products')
            .select('variants')
            .eq('id', productId)
            .single();
          
          // Calculate existing quantity from product variants (if any)
          let existingVariantQuantity = 0;
          if (existingProductData?.variants && Array.isArray(existingProductData.variants) && existingProductData.variants.length > 0) {
            existingVariantQuantity = calculateNestedVariantQuantity(existingProductData.variants as unknown as Variant[]);
          }
          
          // Create new inventory item with existing + new quantity
          const { error: insertError } = await supabase
            .from('inventory_items')
            .insert({
              product_id: productId,
              company_id: selectedRequest.company_id,
              quantity: existingVariantQuantity + totalQuantity,
              received_date: new Date().toISOString()
            });

          if (insertError) throw insertError;
        }
      }

      // Update request with amended information
      const { error: updateError } = await supabase
        .from('check_in_requests')
        .update({
          status: 'approved',
          reviewed_at: new Date().toISOString(),
          reviewed_by: user?.id,
          amended_products: amendedProducts,
          amendment_notes: amendmentNotes,
          was_amended: true,
        })
        .eq('id', selectedRequest.id);

      if (updateError) throw updateError;

      toast({
        title: 'Success',
        description: 'Request amended and approved - inventory updated with amended quantities',
      });

      setIsAmendDialogOpen(false);
      setIsReviewDialogOpen(false);
      fetchRequests();
    } catch (error) {
      console.error('Error amending request:', error);
      toast({
        title: 'Error',
        description: 'Failed to amend and approve request',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
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

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const approvedRequests = requests.filter(r => r.status === 'approved');
  const rejectedRequests = requests.filter(r => r.status === 'rejected');

  const handleSelectAll = (requestsList: CheckInRequest[], checked: boolean) => {
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

  const renderRequestsTable = (requestsList: CheckInRequest[], showActions: boolean = true) => {
    const allSelected = requestsList.length > 0 && requestsList.every(r => selectedRequestsForExport.includes(r.id));
    const someSelected = requestsList.some(r => selectedRequestsForExport.includes(r.id));
    
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
              <TableHead>Products</TableHead>
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
              <TableCell>
                <div className="flex flex-col gap-1">
                  {getStatusBadge(request.status)}
                  {request.was_amended && (
                    <Badge variant="outline" className="text-xs">
                      <FileText className="h-3 w-3 mr-1" />
                      Amended
                    </Badge>
                  )}
                </div>
              </TableCell>
              <TableCell>
                {Array.isArray(request.requested_products)
                  ? `${request.requested_products.length} product(s)`
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

  const generatePDF = async (requestsToExport: CheckInRequest[]) => {
    try {
      setIsExporting(true);
      
      // Small delay to ensure loading state shows
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const doc = new jsPDF();
      
      // Title
      doc.setFontSize(18);
      doc.text('Check-In Requests Report', 14, 20);
      
      // Date range
      doc.setFontSize(10);
      if (exportStartDate && exportEndDate) {
        doc.text(
          `Period: ${format(exportStartDate, 'PPP')} - ${format(exportEndDate, 'PPP')}`,
          14,
          28
        );
      }
      doc.text(`Generated: ${format(new Date(), 'PPP HH:mm')}`, 14, 34);
      doc.text(`Total Requests: ${requestsToExport.length}`, 14, 40);
      
      let yPosition = 50;
      
      // Process each request
      requestsToExport.forEach((request, index) => {
        // Check if we need a new page
        if (yPosition > 250) {
          doc.addPage();
          yPosition = 20;
        }
        
        // Request header
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(`Request #${request.request_number}`, 14, yPosition);
        yPosition += 6;
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Client: ${request.companies?.name || 'N/A'}`, 14, yPosition);
        doc.text(`Status: ${request.status.toUpperCase()}`, 120, yPosition);
        yPosition += 6;
        
        doc.text(`Submitted: ${format(new Date(request.created_at), 'PPP')}`, 14, yPosition);
        if (request.reviewed_at) {
          doc.text(`Reviewed: ${format(new Date(request.reviewed_at), 'PPP')}`, 120, yPosition);
        }
        yPosition += 8;
        
        // Products table
        const productsToShow = request.was_amended && request.amended_products 
          ? request.amended_products 
          : request.requested_products;
        
        const tableData = productsToShow.map((product: any) => {
          let quantity = product.quantity || 0;
          if (product.variants && Array.isArray(product.variants) && product.variants.length > 0) {
            quantity = product.variants.reduce((sum: number, variant: any) => {
              if (variant && variant.values && Array.isArray(variant.values)) {
                return sum + variant.values.reduce((vSum: number, val: any) => 
                  vSum + (val?.quantity || 0), 0
                );
              }
              return sum;
            }, 0);
          }
          return [product.name || 'Unnamed Product', quantity.toString()];
        });
        
        autoTable(doc, {
          startY: yPosition,
          head: [['Product Name', 'Quantity']],
          body: tableData,
          theme: 'grid',
          headStyles: { fillColor: [59, 130, 246] },
          margin: { left: 14 },
        });
        
        yPosition = (doc as any).lastAutoTable.finalY + 6;
        
        // Amendment info
        if (request.was_amended && request.amendment_notes) {
          doc.setFont('helvetica', 'bold');
          doc.text('Amendment Notes:', 14, yPosition);
          yPosition += 5;
          doc.setFont('helvetica', 'normal');
          const splitNotes = doc.splitTextToSize(request.amendment_notes, 180);
          doc.text(splitNotes, 14, yPosition);
          yPosition += splitNotes.length * 5 + 4;
        }
        
        // Rejection reason
        if (request.status === 'rejected' && request.rejection_reason) {
          doc.setFont('helvetica', 'bold');
          doc.text('Rejection Reason:', 14, yPosition);
          yPosition += 5;
          doc.setFont('helvetica', 'normal');
          const splitReason = doc.splitTextToSize(request.rejection_reason, 180);
          doc.text(splitReason, 14, yPosition);
          yPosition += splitReason.length * 5 + 4;
        }
        
        // Notes
        if (request.notes) {
          doc.setFont('helvetica', 'bold');
          doc.text('Notes:', 14, yPosition);
          yPosition += 5;
          doc.setFont('helvetica', 'normal');
          const splitText = doc.splitTextToSize(request.notes, 180);
          doc.text(splitText, 14, yPosition);
          yPosition += splitText.length * 5 + 4;
        }
        
        // Separator line
        if (index < requestsToExport.length - 1) {
          doc.setDrawColor(200, 200, 200);
          doc.line(14, yPosition, 196, yPosition);
          yPosition += 10;
        }
      });
      
      // Save the PDF
      const fileName = `check-in-requests-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
      doc.save(fileName);
      
      toast({
        title: "Export Successful",
        description: `Exported ${requestsToExport.length} check-in request(s)`,
      });
      
      setIsExportDialogOpen(false);
      setExportStartDate(undefined);
      setExportEndDate(undefined);
      setSelectedRequestsForExport([]);
      setSelectionModeActive(false);
    } catch (error) {
      console.error('PDF generation error:', error);
      toast({
        title: "Export Failed",
        description: "Failed to generate PDF. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportButtonClick = () => {
    // If selection mode is active and requests are selected, proceed to export
    if (selectionModeActive && selectedRequestsForExport.length > 0) {
      setIsExportDialogOpen(true);
    } else if (selectionModeActive && selectedRequestsForExport.length === 0) {
      toast({
        title: "No Requests Selected",
        description: "Please select at least one request to export",
        variant: "destructive",
      });
    } else {
      // Show method selection dialog
      setIsExportMethodDialogOpen(true);
    }
  };

  const handleExportByDateRange = async () => {
    let filteredRequests = requests;
    
    // Filter by date range if provided
    if (exportStartDate && exportEndDate) {
      filteredRequests = requests.filter((req) => {
        const reqDate = new Date(req.created_at);
        return reqDate >= exportStartDate && reqDate <= exportEndDate;
      });
    }
    
    if (filteredRequests.length === 0) {
      toast({
        title: "No Data",
        description: "No check-in requests found for the selected date range",
        variant: "destructive",
      });
      return;
    }
    
    await generatePDF(filteredRequests);
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

    // Get only selected requests
    const filteredRequests = requests.filter(req => selectedRequestsForExport.includes(req.id));
    
    await generatePDF(filteredRequests);
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Check-In Requests</h1>
          <p className="text-muted-foreground">Review and approve client product check-in requests</p>
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
          <Button 
            onClick={handleExportButtonClick} 
            variant="outline"
          >
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
              <CardDescription>Previously approved check-in requests</CardDescription>
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
              <CardDescription>Previously rejected check-in requests</CardDescription>
            </CardHeader>
            <CardContent>
              {renderRequestsTable(rejectedRequests)}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Review Dialog */}
      <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedRequest?.status === 'pending' ? 'Review' : 'View'} Check-In Request
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
                  <>
                    <div>
                      <div className="text-sm text-muted-foreground">Reviewed</div>
                      <div className="mt-1">{new Date(selectedRequest.reviewed_at).toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Was Amended</div>
                      <div className="mt-1">{selectedRequest.was_amended ? 'Yes' : 'No'}</div>
                    </div>
                  </>
                )}
              </div>

              {/* Original Products */}
              <div>
                <h3 className="font-semibold mb-3 text-lg">
                  {selectedRequest.was_amended ? 'Original Requested Products' : 'Requested Products'}
                </h3>
                <div className="space-y-2">
                  {Array.isArray(selectedRequest.requested_products) &&
                    selectedRequest.requested_products.map((product: any, index: number) => (
                      <Card key={index} className="p-4">
                        <div className="font-medium text-lg">{product.name}</div>
                        {/* B2B Supplier/Customer info */}
                        {(product.supplierId || product.customerId) && (
                          <div className="mt-2 flex flex-wrap gap-3 text-sm">
                            {product.supplierId && suppliersMap[product.supplierId] && (
                              <div className="flex items-center gap-1.5 text-muted-foreground">
                                <Badge variant="outline" className="text-xs">
                                  Supplier: {suppliersMap[product.supplierId]}
                                </Badge>
                              </div>
                            )}
                            {product.customerId && customersMap[product.customerId] && (
                              <div className="flex items-center gap-1.5 text-muted-foreground">
                                <Badge variant="outline" className="text-xs">
                                  Customer: {customersMap[product.customerId]}
                                </Badge>
                              </div>
                            )}
                          </div>
                        )}
                        {product.quantity && !product.variants?.length && (
                          <div className="text-sm text-muted-foreground mt-1">
                            Quantity: <span className="font-semibold">{product.quantity}</span>
                          </div>
                        )}
                        {product.variants && Array.isArray(product.variants) && product.variants.length > 0 && (
                          <div className="mt-3 space-y-2">
                            <div className="font-medium text-sm">Variants:</div>
                            {product.variants.map((variant: any, vIndex: number) => (
                              <VariantDisplay key={vIndex} variant={variant} depth={0} />
                            ))}
                          </div>
                        )}
                      </Card>
                    ))}
                </div>
              </div>

              {/* Amended Products */}
              {selectedRequest.was_amended && selectedRequest.amended_products && (
                <div className="border-t pt-6">
                  <h3 className="font-semibold mb-3 text-lg text-primary flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Amended Products (Actually Checked In)
                  </h3>
                  <div className="space-y-2">
                    {Array.isArray(selectedRequest.amended_products) &&
                      selectedRequest.amended_products.map((product: any, index: number) => (
                        <Card key={index} className="p-4 border-primary/50 bg-primary/5">
                          <div className="font-medium text-lg">{product.name}</div>
                          {/* B2B Supplier/Customer info for amended products */}
                          {(product.supplierId || product.customerId) && (
                            <div className="mt-2 flex flex-wrap gap-3 text-sm">
                              {product.supplierId && suppliersMap[product.supplierId] && (
                                <div className="flex items-center gap-1.5 text-muted-foreground">
                                  <Badge variant="outline" className="text-xs">
                                    Supplier: {suppliersMap[product.supplierId]}
                                  </Badge>
                                </div>
                              )}
                              {product.customerId && customersMap[product.customerId] && (
                                <div className="flex items-center gap-1.5 text-muted-foreground">
                                  <Badge variant="outline" className="text-xs">
                                    Customer: {customersMap[product.customerId]}
                                  </Badge>
                                </div>
                              )}
                            </div>
                          )}
                          {product.quantity && !product.variants?.length && (
                            <div className="text-sm text-muted-foreground mt-1">
                              Quantity: <span className="font-semibold text-primary">{product.quantity}</span>
                            </div>
                          )}
                          {product.variants && Array.isArray(product.variants) && product.variants.length > 0 && (
                            <div className="mt-3 space-y-2">
                              <div className="font-medium text-sm">Variants:</div>
                              {product.variants.map((variant: any, vIndex: number) => (
                                <VariantDisplay key={vIndex} variant={variant} depth={0} isPrimary />
                              ))}
                            </div>
                          )}
                        </Card>
                      ))}
                  </div>
                  {selectedRequest.amendment_notes && (
                    <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                      <div className="text-sm font-medium mb-1">Amendment Notes:</div>
                      <div className="text-sm text-muted-foreground">{selectedRequest.amendment_notes}</div>
                    </div>
                  )}
                </div>
              )}

              {/* Rejection Reason */}
              {selectedRequest.status === 'rejected' && selectedRequest.rejection_reason && (
                <div className="border-t pt-6">
                  <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                    <div className="text-sm font-medium text-destructive mb-2">Rejection Reason:</div>
                    <div className="text-sm">{selectedRequest.rejection_reason}</div>
                  </div>
                </div>
              )}

              {/* Notes */}
              {selectedRequest.notes && (
                <div>
                  <h3 className="font-semibold mb-2">Client Notes:</h3>
                  <div className="p-3 bg-muted/50 rounded-lg text-sm">
                    {selectedRequest.notes}
                  </div>
                </div>
              )}

              {/* Action Buttons - Only for Pending */}
              {selectedRequest.status === 'pending' && (
                <div className="border-t pt-6">
                  <div className="space-y-4">
                    <div className="flex gap-3">
                      <Button
                        onClick={() => handleApprove(selectedRequest)}
                        disabled={isProcessing}
                        className="flex-1"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Approve
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => openAmendDialog(selectedRequest)}
                        disabled={isProcessing}
                        className="flex-1"
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Amend
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="rejection-reason">Rejection Reason</Label>
                      <Textarea
                        id="rejection-reason"
                        placeholder="Enter reason for rejection..."
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        rows={3}
                      />
                      <Button
                        variant="destructive"
                        onClick={() => handleReject(selectedRequest)}
                        disabled={isProcessing || !rejectionReason.trim()}
                        className="w-full"
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Reject Request
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Amend Dialog */}
      <Dialog open={isAmendDialogOpen} onOpenChange={setIsAmendDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Amend Check-In Request</DialogTitle>
            <DialogDescription>
              Edit products, variants, and quantities before approving
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-4">
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm">
                  <strong>Request:</strong> {selectedRequest.request_number}
                </p>
                <p className="text-sm">
                  <strong>Client:</strong> {selectedRequest.companies?.name}
                </p>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold">Products to Check In:</h3>
                {amendedProducts.map((product, productIdx) => (
                  <Card key={productIdx} className="p-4">
                    <div className="space-y-3">
                      <div>
                        <Label>Product Name</Label>
                        <Input
                          value={product.name}
                          onChange={(e) =>
                            updateAmendedProduct(productIdx, 'name', e.target.value)
                          }
                          placeholder="Product name"
                        />
                      </div>

                      {(!product.variants || product.variants.length === 0) && (
                        <div>
                          <Label>Quantity</Label>
                          <Input
                            type="number"
                            value={product.quantity || 0}
                            onChange={(e) =>
                              updateAmendedProduct(
                                productIdx,
                                'quantity',
                                parseInt(e.target.value) || 0
                              )
                            }
                            placeholder="Enter quantity"
                          />
                        </div>
                      )}

                      {product.variants && product.variants.length > 0 && (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <Label>Variants</Label>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => addVariantToProduct(productIdx)}
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              Add Variant
                            </Button>
                          </div>
                          {product.variants.map((variant: any, variantIdx: number) => (
                            <div
                              key={variantIdx}
                              className="pl-4 space-y-2 border-l-2 border-primary/20"
                            >
                              <div className="flex items-center gap-2">
                                <Input
                                  value={variant.attribute}
                                  onChange={(e) =>
                                    updateVariantAttribute(productIdx, variantIdx, e.target.value)
                                  }
                                  placeholder="Variant name (e.g., Size, Color)"
                                  className="flex-1"
                                />
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => removeVariant(productIdx, variantIdx)}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                              {variant.values.map((value: any, valueIdx: number) => (
                                <div key={valueIdx} className="flex gap-2 items-center ml-4">
                                  <Input
                                    value={value.value}
                                    onChange={(e) =>
                                      updateAmendedVariantValue(
                                        productIdx,
                                        variantIdx,
                                        valueIdx,
                                        'value',
                                        e.target.value
                                      )
                                    }
                                    placeholder="Variant value"
                                    className="flex-1"
                                  />
                                  <Input
                                    type="number"
                                    value={value.quantity || 0}
                                    onChange={(e) =>
                                      updateAmendedVariantValue(
                                        productIdx,
                                        variantIdx,
                                        valueIdx,
                                        'quantity',
                                        parseInt(e.target.value) || 0
                                      )
                                    }
                                    placeholder="Qty"
                                    className="w-24"
                                  />
                                  {variant.values.length > 1 && (
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => removeVariantValue(productIdx, variantIdx, valueIdx)}
                                    >
                                      <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                  )}
                                </div>
                              ))}
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                onClick={() => addVariantValue(productIdx, variantIdx)}
                                className="ml-4"
                              >
                                <Plus className="h-4 w-4 mr-1" />
                                Add Value
                              </Button>
                            </div>
                          ))}
                          <div className="mt-2 p-2 bg-accent rounded">
                            <p className="text-sm">
                              <strong>Total Quantity:</strong> {product.quantity || 0}{' '}
                              units
                            </p>
                          </div>
                        </div>
                      )}

                      {(!product.variants || product.variants.length === 0) && (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => addVariantToProduct(productIdx)}
                          className="w-full"
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add Variants
                        </Button>
                      )}
                    </div>
                  </Card>
                ))}
              </div>

              <div className="space-y-2">
                <Label>Amendment Notes</Label>
                <Textarea
                  value={amendmentNotes}
                  onChange={(e) => setAmendmentNotes(e.target.value)}
                  placeholder="Explain what changes were made and why..."
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsAmendDialogOpen(false);
                    setIsReviewDialogOpen(true);
                  }}
                  disabled={isProcessing}
                >
                  Back
                </Button>
                <Button onClick={handleAmendAndApprove} disabled={isProcessing}>
                  {isProcessing ? 'Processing...' : 'Approve with Amendments'}
                </Button>
              </div>
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

      {/* Export Dialog (for date range or selected) */}
      <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
        <DialogContent className="max-w-md">
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
                        {exportStartDate ? format(exportStartDate, "PPP") : "Pick a date"}
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
                        {exportEndDate ? format(exportEndDate, "PPP") : "Pick a date"}
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
                disabled={isExporting}
              >
                Cancel
              </Button>
              <Button 
                onClick={selectionModeActive ? handleExportBySelection : handleExportByDateRange} 
                disabled={isExporting}
              >
                <Download className="h-4 w-4 mr-2" />
                {isExporting ? 'Generating PDF...' : 'Export PDF'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
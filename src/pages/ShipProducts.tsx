import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Trash2, Package, TruckIcon, ChevronDown, Printer, Edit } from 'lucide-react';
import { calculateNestedVariantQuantity, getVariantBreakdown, Variant } from '@/types/variants';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ShipmentStatsOverview } from '@/components/shipments/ShipmentStatsOverview';
import { ShipmentStatusDialog } from '@/components/shipments/ShipmentStatusDialog';
import { ShipmentFilters } from '@/components/shipments/ShipmentFilters';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Company {
  id: string;
  name: string;
  address: string;
  client_code: string;
}

interface Product {
  id: string;
  name: string;
  sku: string;
  variants: any;
  available_quantity: number;
}

interface ShipmentItem {
  product_id: string;
  product_name: string;
  variant_attribute?: string;
  variant_value?: string;
  quantity: number;
  available: number;
}

interface Shipment {
  id: string;
  shipment_number: string;
  company_id: string;
  company_name: string;
  shipment_date: string;
  tracking_number: string;
  carrier: string;
  status: string;
  destination_address: string;
  items_count: number;
}

interface ShipmentStats {
  inTransit: number;
  delivered: number;
  returned: number;
  pending: number;
  today: number;
  thisWeek: number;
  thisMonth: number;
}

export const ShipProducts: React.FC = () => {
  const { profile } = useAuth();
  const { toast } = useToast();

  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
  const [products, setProducts] = useState<Product[]>([]);
  const [shipmentItems, setShipmentItems] = useState<ShipmentItem[]>([]);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [clientFilter, setClientFilter] = useState('all');
  
  // Stats
  const [stats, setStats] = useState<ShipmentStats>({
    inTransit: 0,
    delivered: 0,
    returned: 0,
    pending: 0,
    today: 0,
    thisWeek: 0,
    thisMonth: 0,
  });

  // Status dialog
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Form fields
  const [destinationAddress, setDestinationAddress] = useState('');
  const [destinationContact, setDestinationContact] = useState('');
  const [destinationPhone, setDestinationPhone] = useState('');
  const [carrier, setCarrier] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    fetchCompanies();
    fetchAllShipments();
  }, []);

  useEffect(() => {
    if (selectedCompanyId) {
      fetchProducts();
      const selectedCompany = companies.find(c => c.id === selectedCompanyId);
      if (selectedCompany?.address) {
        setDestinationAddress(selectedCompany.address);
      }
    }
  }, [selectedCompanyId]);

  // Real-time subscriptions for inventory updates
  useEffect(() => {
    if (!selectedCompanyId) return;

    // Subscribe to client_products changes (variants are source of truth)
    const productsChannel = supabase
      .channel(`products-${selectedCompanyId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'client_products',
          filter: `company_id=eq.${selectedCompanyId}`
        },
        () => {
          console.log('Real-time: client_products changed, refetching...');
          fetchProducts();
        }
      )
      .subscribe();

    // Subscribe to inventory_items changes (for products without variants)
    const inventoryChannel = supabase
      .channel(`inventory-${selectedCompanyId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'inventory_items',
          filter: `company_id=eq.${selectedCompanyId}`
        },
        () => {
          console.log('Real-time: inventory_items changed, refetching...');
          fetchProducts();
        }
      )
      .subscribe();

    // Subscribe to check_in_requests changes (approvals affect inventory)
    const checkInChannel = supabase
      .channel(`checkin-${selectedCompanyId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'check_in_requests',
          filter: `company_id=eq.${selectedCompanyId}`
        },
        () => {
          console.log('Real-time: check_in_requests updated, refetching...');
          fetchProducts();
        }
      )
      .subscribe();

    // Subscribe to check_out_requests changes (approvals affect inventory)
    const checkOutChannel = supabase
      .channel(`checkout-${selectedCompanyId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'check_out_requests',
          filter: `company_id=eq.${selectedCompanyId}`
        },
        () => {
          console.log('Real-time: check_out_requests updated, refetching...');
          fetchProducts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(productsChannel);
      supabase.removeChannel(inventoryChannel);
      supabase.removeChannel(checkInChannel);
      supabase.removeChannel(checkOutChannel);
    };
  }, [selectedCompanyId]);

  const fetchCompanies = async () => {
    const { data, error } = await supabase
      .from('companies')
      .select('id, name, address, client_code')
      .eq('is_active', true)
      .order('name');

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to load companies',
        variant: 'destructive',
      });
      return;
    }

    setCompanies(data || []);
  };

  const fetchProducts = async () => {
    if (!selectedCompanyId) return;

    const { data: productsData, error: productsError } = await supabase
      .from('client_products')
      .select('id, name, sku, variants')
      .eq('company_id', selectedCompanyId)
      .eq('is_active', true);

    if (productsError) {
      toast({
        title: 'Error',
        description: 'Failed to load products',
        variant: 'destructive',
      });
      return;
    }

    const productsWithInventory = await Promise.all(
      (productsData || []).map(async (product) => {
        // For products WITH variants, use client_products.variants as source of truth
        // This ensures we read the correct deducted quantities after checkouts/shipments
        const hasVariants = product.variants && Array.isArray(product.variants) && product.variants.length > 0;
        
        let totalQuantity = 0;
        
        if (hasVariants) {
          // Variants are the source of truth - sum all variant quantities
          totalQuantity = calculateNestedVariantQuantity(product.variants as unknown as Variant[]);
        } else {
          // No variants - use inventory_items as fallback
          const { data: inventoryData } = await supabase
            .from('inventory_items')
            .select('quantity')
            .eq('product_id', product.id)
            .eq('company_id', selectedCompanyId);

          totalQuantity = inventoryData?.reduce((sum, item) => sum + item.quantity, 0) || 0;
        }

        return {
          ...product,
          available_quantity: totalQuantity,
        };
      })
    );

    setProducts(productsWithInventory);
  };

  const fetchAllShipments = async () => {
    const { data, error } = await supabase
      .from('shipments')
      .select(`
        id,
        shipment_number,
        company_id,
        shipment_date,
        tracking_number,
        carrier,
        status,
        destination_address,
        companies!inner(name),
        shipment_items(id)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching shipments:', error);
      return;
    }

    const formattedShipments = data?.map((shipment: any) => ({
      id: shipment.id,
      shipment_number: shipment.shipment_number,
      company_id: shipment.company_id,
      company_name: shipment.companies?.name || 'Unknown',
      shipment_date: shipment.shipment_date,
      tracking_number: shipment.tracking_number,
      carrier: shipment.carrier,
      status: shipment.status,
      destination_address: shipment.destination_address,
      items_count: shipment.shipment_items?.length || 0,
    })) || [];

    setShipments(formattedShipments);
    calculateStats(formattedShipments);
  };

  const calculateStats = (allShipments: Shipment[]) => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const newStats: ShipmentStats = {
      inTransit: 0,
      delivered: 0,
      returned: 0,
      pending: 0,
      today: 0,
      thisWeek: 0,
      thisMonth: 0,
    };

    allShipments.forEach(shipment => {
      // Status counts
      switch (shipment.status) {
        case 'in_transit': newStats.inTransit++; break;
        case 'delivered': newStats.delivered++; break;
        case 'returned': newStats.returned++; break;
        case 'pending': newStats.pending++; break;
      }

      // Time-based counts
      const shipmentDate = new Date(shipment.shipment_date);
      if (shipmentDate >= todayStart) newStats.today++;
      if (shipmentDate >= weekStart) newStats.thisWeek++;
      if (shipmentDate >= monthStart) newStats.thisMonth++;
    });

    setStats(newStats);
  };

  const addShipmentItem = (productId: string, variantAttribute?: string, variantValue?: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const existingItem = shipmentItems.find(
      item => item.product_id === productId &&
        item.variant_attribute === variantAttribute &&
        item.variant_value === variantValue
    );

    if (existingItem) {
      toast({
        title: 'Item Already Added',
        description: 'This product is already in the shipment list',
        variant: 'destructive',
      });
      return;
    }

    setShipmentItems([...shipmentItems, {
      product_id: productId,
      product_name: product.name,
      variant_attribute: variantAttribute,
      variant_value: variantValue,
      quantity: 1,
      available: product.available_quantity,
    }]);
  };

  const updateItemQuantity = (index: number, quantity: number) => {
    const updatedItems = [...shipmentItems];
    updatedItems[index].quantity = Math.max(1, Math.min(quantity, updatedItems[index].available));
    setShipmentItems(updatedItems);
  };

  const removeItem = (index: number) => {
    setShipmentItems(shipmentItems.filter((_, i) => i !== index));
  };

  // Keep client_products.variants in sync with shipments (Client Products page uses variants as source of truth)
  const parseShipmentVariant = (variantAttr?: string, variantPath?: string) => {
    const norm = (v: any) => String(v ?? '').trim();

    const rawAttr = norm(variantAttr);
    const rawPath = norm(variantPath);

    // Example variantPath formats we store in shipment_items/inventory_items:
    // - "Size: Large"
    // - "Size: Large → Color / Red"
    // We only store a single (attribute, value) pair in shipment_items, so we treat the FIRST pair as the selected variant.
    const firstSegment = rawPath ? rawPath.split('→')[0].trim() : '';

    const attrFromPath = firstSegment.includes(':') ? firstSegment.split(':')[0].trim() : '';
    const valueFromPath = firstSegment.includes(':') ? firstSegment.split(':').slice(1).join(':').trim() : '';

    return {
      attr: rawAttr || attrFromPath,
      // IMPORTANT: client_products.variants stores value WITHOUT the "Attr: " prefix
      value: valueFromPath || (rawPath && !rawPath.includes(':') ? rawPath : ''),
    };
  };

  const deductFromVariants = (
    variants: any[],
    variantAttr: string,
    variantVal: string,
    quantityToDeduct: number
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
          return {
            ...val,
            quantity: Math.max(0, (val.quantity || 0) - quantityToDeduct),
          };
        }),
      };
    });
  };

  const createShipment = async () => {
    if (!selectedCompanyId || shipmentItems.length === 0 || !destinationAddress) {
      toast({
        title: 'Validation Error',
        description: 'Please select a client, add products, and provide a destination address',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data: shipmentNumberData, error: shipmentNumberError } = await supabase
        .rpc('generate_shipment_number');

      if (shipmentNumberError) throw shipmentNumberError;

      const { data: shipmentData, error: shipmentError } = await supabase
        .from('shipments')
        .insert({
          shipment_number: shipmentNumberData,
          company_id: selectedCompanyId,
          shipment_date: new Date().toISOString(),
          tracking_number: trackingNumber || null,
          carrier: carrier || null,
          destination_address: destinationAddress,
          destination_contact: destinationContact || null,
          destination_phone: destinationPhone || null,
          notes: notes || null,
          shipped_by: profile?.id,
          status: 'pending',
        })
        .select()
        .single();

      if (shipmentError) throw shipmentError;

      for (const item of shipmentItems) {
        const { error: itemError } = await supabase
          .from('shipment_items')
          .insert({
            shipment_id: shipmentData.id,
            product_id: item.product_id,
            variant_attribute: item.variant_attribute || null,
            variant_value: item.variant_value || null,
            quantity: item.quantity,
          });

        if (itemError) throw itemError;

        // Reduce inventory_items
        let query = supabase
          .from('inventory_items')
          .select('id, quantity, variant_attribute, variant_value')
          .eq('product_id', item.product_id)
          .eq('company_id', selectedCompanyId)
          .gt('quantity', 0);

        if (item.variant_attribute && item.variant_value) {
          query = query
            .eq('variant_attribute', item.variant_attribute)
            .eq('variant_value', item.variant_value);
        }

        const { data: inventoryItems, error: fetchError } = await query.order('received_date', { ascending: true });

        if (fetchError) throw fetchError;

        let remainingToShip = item.quantity;
        
        for (const invItem of inventoryItems || []) {
          if (remainingToShip <= 0) break;

          const deductAmount = Math.min(invItem.quantity, remainingToShip);
          const newQuantity = invItem.quantity - deductAmount;

          if (newQuantity > 0) {
            await supabase
              .from('inventory_items')
              .update({ quantity: newQuantity, last_updated: new Date().toISOString() })
              .eq('id', invItem.id);
          } else {
            await supabase
              .from('inventory_items')
              .delete()
              .eq('id', invItem.id);
          }

          remainingToShip -= deductAmount;
        }

        if (remainingToShip > 0 && item.variant_attribute && item.variant_value) {
          const { data: baseInventory } = await supabase
            .from('inventory_items')
            .select('id, quantity')
            .eq('product_id', item.product_id)
            .eq('company_id', selectedCompanyId)
            .is('variant_attribute', null)
            .gt('quantity', 0)
            .order('received_date', { ascending: true });

          for (const invItem of baseInventory || []) {
            if (remainingToShip <= 0) break;

            const deductAmount = Math.min(invItem.quantity, remainingToShip);
            const newQuantity = invItem.quantity - deductAmount;

            if (newQuantity > 0) {
              await supabase
                .from('inventory_items')
                .update({ quantity: newQuantity, last_updated: new Date().toISOString() })
                .eq('id', invItem.id);
            } else {
              await supabase
                .from('inventory_items')
                .delete()
                .eq('id', invItem.id);
            }

            remainingToShip -= deductAmount;
          }
        }

        // ALSO deduct from client_products.variants (source of truth for Client Products page)
        if (item.variant_attribute && item.variant_value) {
          const parsed = parseShipmentVariant(item.variant_attribute, item.variant_value);
          
          if (parsed.attr && parsed.value) {
            const { data: product, error: productError } = await supabase
              .from('client_products')
              .select('variants')
              .eq('id', item.product_id)
              .maybeSingle();

            if (!productError && product?.variants && Array.isArray(product.variants)) {
              const updatedVariants = deductFromVariants(
                product.variants,
                parsed.attr,
                parsed.value,
                item.quantity
              );

              await supabase
                .from('client_products')
                .update({ variants: updatedVariants, updated_at: new Date().toISOString() })
                .eq('id', item.product_id);
            }
          }
        }
      }

      toast({
        title: 'Shipment Created',
        description: `Shipment ${shipmentNumberData} created successfully`,
      });

      resetForm();
      fetchAllShipments();
      fetchProducts();

    } catch (error: any) {
      console.error('Error creating shipment:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create shipment',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setShipmentItems([]);
    setDestinationAddress('');
    setDestinationContact('');
    setDestinationPhone('');
    setCarrier('');
    setTrackingNumber('');
    setNotes('');
  };

  const updateShipmentStatus = async (shipmentId: string, newStatus: string, statusNotes?: string) => {
    setIsUpdatingStatus(true);
    try {
      const updateData: any = { 
        status: newStatus,
        updated_at: new Date().toISOString(),
      };

      if (statusNotes) {
        // Append status change to existing notes
        const existingShipment = shipments.find(s => s.id === shipmentId);
        const { data: fullShipment } = await supabase
          .from('shipments')
          .select('notes')
          .eq('id', shipmentId)
          .single();
        
        const existingNotes = fullShipment?.notes || '';
        const timestamp = new Date().toLocaleString();
        updateData.notes = existingNotes 
          ? `${existingNotes}\n\n[${timestamp}] Status → ${newStatus}: ${statusNotes}`
          : `[${timestamp}] Status → ${newStatus}: ${statusNotes}`;
      }

      const { error } = await supabase
        .from('shipments')
        .update(updateData)
        .eq('id', shipmentId);

      if (error) throw error;

      toast({
        title: 'Status Updated',
        description: `Shipment status changed to ${newStatus.replace('_', ' ')}`,
      });

      fetchAllShipments();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update status',
        variant: 'destructive',
      });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setClientFilter('all');
  };

  const filteredShipments = shipments.filter(s => {
    const matchesSearch = 
      s.shipment_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.tracking_number?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
    const matchesClient = clientFilter === 'all' || s.company_id === clientFilter;

    return matchesSearch && matchesStatus && matchesClient;
  });

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'delivered': return 'default';
      case 'in_transit': return 'secondary';
      case 'returned': return 'destructive';
      case 'cancelled': return 'destructive';
      default: return 'outline';
    }
  };

  const generateShipmentPDF = async (shipmentId: string) => {
    try {
      const { data: shipment, error: shipmentError } = await supabase
        .from('shipments')
        .select(`
          *,
          companies!inner(name, client_code),
          profiles!shipments_shipped_by_fkey(full_name, email)
        `)
        .eq('id', shipmentId)
        .maybeSingle();

      if (shipmentError || !shipment) {
        toast({
          title: 'Error',
          description: 'Failed to fetch shipment details',
          variant: 'destructive',
        });
        return;
      }

      const { data: items, error: itemsError } = await supabase
        .from('shipment_items')
        .select(`
          *,
          client_products!inner(name, sku)
        `)
        .eq('shipment_id', shipmentId);

      if (itemsError) {
        toast({
          title: 'Error',
          description: 'Failed to fetch shipment items',
          variant: 'destructive',
        });
        return;
      }

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('SHIPMENT DOCUMENT', pageWidth / 2, 20, { align: 'center' });
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(`Shipment #: ${shipment.shipment_number}`, pageWidth / 2, 30, { align: 'center' });
      
      let yPos = 45;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('SHIPMENT INFORMATION', 14, yPos);
      yPos += 8;
      
      doc.setFont('helvetica', 'normal');
      doc.text(`Date: ${new Date(shipment.shipment_date).toLocaleDateString()}`, 14, yPos);
      yPos += 6;
      doc.text(`Created By: ${shipment.profiles?.full_name || shipment.profiles?.email || 'N/A'}`, 14, yPos);
      yPos += 6;
      doc.text(`Client: ${shipment.companies?.name || 'N/A'} (${shipment.companies?.client_code || ''})`, 14, yPos);
      yPos += 6;
      doc.text(`Status: ${shipment.status.replace('_', ' ').toUpperCase()}`, 14, yPos);
      yPos += 6;
      if (shipment.carrier) {
        doc.text(`Carrier: ${shipment.carrier}`, 14, yPos);
        yPos += 6;
      }
      if (shipment.tracking_number) {
        doc.text(`Tracking #: ${shipment.tracking_number}`, 14, yPos);
        yPos += 6;
      }
      
      yPos += 6;
      doc.setFont('helvetica', 'bold');
      doc.text('RECEIVER INFORMATION', 14, yPos);
      yPos += 8;
      
      doc.setFont('helvetica', 'normal');
      if (shipment.destination_contact) {
        doc.text(`Name: ${shipment.destination_contact}`, 14, yPos);
        yPos += 6;
      }
      if (shipment.destination_phone) {
        doc.text(`Phone: ${shipment.destination_phone}`, 14, yPos);
        yPos += 6;
      }
      doc.text(`Address:`, 14, yPos);
      yPos += 6;
      
      const addressLines = doc.splitTextToSize(shipment.destination_address, pageWidth - 28);
      addressLines.forEach((line: string) => {
        doc.text(line, 20, yPos);
        yPos += 5;
      });
      
      yPos += 8;
      doc.setFont('helvetica', 'bold');
      doc.text('PRODUCTS', 14, yPos);
      yPos += 4;
      
      const tableData = (items || []).map(item => {
        let variantDetails = '-';
        if (item.variant_value) {
          if (item.variant_value.includes(' → ')) {
            const parts = item.variant_value.split(' → ');
            variantDetails = parts.map(p => p.trim()).join('\n→ ');
          } else if (item.variant_value.includes(':')) {
            variantDetails = item.variant_value;
          } else if (item.variant_attribute) {
            variantDetails = `${item.variant_attribute}: ${item.variant_value}`;
          } else {
            variantDetails = item.variant_value;
          }
        }
        return [
          item.client_products?.name || 'Unknown',
          item.client_products?.sku || '-',
          variantDetails,
          item.quantity.toString()
        ];
      });
      
      autoTable(doc, {
        startY: yPos,
        head: [['Product Name', 'SKU', 'Variant', 'Qty']],
        body: tableData,
        theme: 'grid',
        headStyles: { 
          fillColor: [50, 50, 50], 
          fontSize: 10, 
          fontStyle: 'bold',
          cellPadding: 4
        },
        bodyStyles: { 
          fontSize: 10,
          cellPadding: 4
        },
        columnStyles: {
          0: { cellWidth: 50, fontStyle: 'bold' },
          1: { cellWidth: 25 },
          2: { cellWidth: 75 },
          3: { cellWidth: 20, halign: 'center', fontStyle: 'bold' }
        },
        margin: { left: 14, right: 14 },
        alternateRowStyles: { fillColor: [245, 245, 245] }
      });
      
      const finalY = (doc as any).lastAutoTable?.finalY || yPos + 40;
      
      let notesY = finalY + 10;
      if (shipment.notes) {
        doc.setFont('helvetica', 'bold');
        doc.text('NOTES:', 14, notesY);
        doc.setFont('helvetica', 'normal');
        const noteLines = doc.splitTextToSize(shipment.notes, pageWidth - 28);
        notesY += 6;
        noteLines.forEach((line: string) => {
          doc.text(line, 14, notesY);
          notesY += 5;
        });
      }
      
      const signatureY = Math.max(notesY + 20, 230);
      doc.setDrawColor(0);
      doc.setLineWidth(0.5);
      
      doc.line(14, signatureY, 90, signatureY);
      doc.setFontSize(9);
      doc.text('Sender Signature', 14, signatureY + 5);
      doc.text(`Date: _______________`, 14, signatureY + 12);
      
      doc.line(pageWidth - 90, signatureY, pageWidth - 14, signatureY);
      doc.text('Receiver Signature', pageWidth - 90, signatureY + 5);
      doc.text(`Date: _______________`, pageWidth - 90, signatureY + 12);
      
      doc.setFontSize(8);
      doc.setTextColor(128);
      doc.text(`Generated on ${new Date().toLocaleString()}`, pageWidth / 2, 285, { align: 'center' });
      
      doc.save(`Shipment_${shipment.shipment_number}.pdf`);
      
      toast({
        title: 'PDF Generated',
        description: `Shipment document downloaded successfully`,
      });
      
    } catch (error: any) {
      console.error('Error generating PDF:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate PDF',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Ship Products</h1>
          <p className="text-muted-foreground mt-1">Create and manage outbound shipments</p>
        </div>
        <TruckIcon className="h-8 w-8 text-primary" />
      </div>

      <Tabs defaultValue="ship" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="ship">
            <Package className="h-4 w-4 mr-2" />
            Ship a Product
          </TabsTrigger>
          <TabsTrigger value="requests">
            <TruckIcon className="h-4 w-4 mr-2" />
            Shipment Requests
          </TabsTrigger>
        </TabsList>

        {/* Ship a Product Tab */}
        <TabsContent value="ship">
          <Card>
            <CardHeader>
              <CardTitle>Create New Shipment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Client Selection */}
              <div className="space-y-2">
                <Label htmlFor="client">Select Client *</Label>
                <Select value={selectedCompanyId} onValueChange={setSelectedCompanyId}>
                  <SelectTrigger id="client">
                    <SelectValue placeholder="Choose a client" />
                  </SelectTrigger>
                  <SelectContent>
                    {companies.map(company => (
                      <SelectItem key={company.id} value={company.id}>
                        {company.name} ({company.client_code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedCompanyId && (
                <>
                  {/* Product Selection */}
                  <div className="space-y-2">
                    <Label>Add Products to Shipment</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {products.map(product => {
                        const variantBreakdown = product.variants && Array.isArray(product.variants) ? getVariantBreakdown(product.variants as unknown as Variant[]) : {};
                        const hasVariants = Object.keys(variantBreakdown).length > 0;

                        return (
                          <Card key={product.id} className="p-3">
                            <Collapsible>
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <p className="font-medium text-sm">{product.name}</p>
                                  <p className="text-xs text-muted-foreground">{product.sku}</p>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Total Available: <span className="font-semibold">{product.available_quantity}</span>
                                  </p>
                                </div>
                                {hasVariants ? (
                                  <CollapsibleTrigger asChild>
                                    <Button size="sm" variant="outline">
                                      <ChevronDown className="h-4 w-4" />
                                    </Button>
                                  </CollapsibleTrigger>
                                ) : (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => addShipmentItem(product.id)}
                                    disabled={product.available_quantity === 0}
                                  >
                                    <Plus className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                              
                              {hasVariants && (
                                <CollapsibleContent className="mt-3 pt-3 border-t border-border">
                                  <p className="text-xs text-muted-foreground mb-2">Select variant to ship:</p>
                                  <div className="space-y-1 max-h-40 overflow-y-auto">
                                    {Object.entries(variantBreakdown).map(([variantPath, qty]) => (
                                      <div key={variantPath} className="flex justify-between items-center p-2 rounded-md bg-muted/50 hover:bg-muted">
                                        <div>
                                          <p className="text-xs font-medium">{variantPath}</p>
                                          <p className="text-xs text-muted-foreground">Qty: {qty}</p>
                                        </div>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={() => addShipmentItem(product.id, variantPath.split(':')[0], variantPath)}
                                          disabled={qty === 0}
                                        >
                                          <Plus className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    ))}
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="w-full mt-2"
                                    onClick={() => addShipmentItem(product.id)}
                                    disabled={product.available_quantity === 0}
                                  >
                                    <Plus className="h-3 w-3 mr-1" /> Add All Variants
                                  </Button>
                                </CollapsibleContent>
                              )}
                            </Collapsible>
                          </Card>
                        );
                      })}
                    </div>
                  </div>

                  {/* Shipment Items List */}
                  {shipmentItems.length > 0 && (
                    <div className="space-y-2">
                      <Label>Items to Ship</Label>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Product</TableHead>
                            <TableHead>Available</TableHead>
                            <TableHead>Quantity</TableHead>
                            <TableHead className="w-[100px]">Action</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {shipmentItems.map((item, index) => (
                            <TableRow key={index}>
                              <TableCell>
                                <div>
                                  <p className="font-medium text-sm">{item.product_name}</p>
                                  {item.variant_value && (
                                    <p className="text-xs text-muted-foreground">
                                      {item.variant_attribute}: {item.variant_value}
                                    </p>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>{item.available}</TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  min="1"
                                  max={item.available}
                                  value={item.quantity}
                                  onChange={(e) => updateItemQuantity(index, parseInt(e.target.value) || 1)}
                                  className="w-20"
                                />
                              </TableCell>
                              <TableCell>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => removeItem(index)}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}

                  {/* Shipping Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="carrier">Carrier</Label>
                      <Select value={carrier} onValueChange={setCarrier}>
                        <SelectTrigger id="carrier">
                          <SelectValue placeholder="Select carrier" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="FedEx">FedEx</SelectItem>
                          <SelectItem value="UPS">UPS</SelectItem>
                          <SelectItem value="DHL">DHL</SelectItem>
                          <SelectItem value="USPS">USPS</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="tracking">Tracking Number</Label>
                      <Input
                        id="tracking"
                        value={trackingNumber}
                        onChange={(e) => setTrackingNumber(e.target.value)}
                        placeholder="Optional"
                      />
                    </div>
                  </div>

                  {/* Destination Details */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="address">Destination Address *</Label>
                      <Textarea
                        id="address"
                        value={destinationAddress}
                        onChange={(e) => setDestinationAddress(e.target.value)}
                        rows={3}
                        placeholder="Enter shipping address"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="contact">Contact Name</Label>
                        <Input
                          id="contact"
                          value={destinationContact}
                          onChange={(e) => setDestinationContact(e.target.value)}
                          placeholder="Optional"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="phone">Contact Phone</Label>
                        <Input
                          id="phone"
                          value={destinationPhone}
                          onChange={(e) => setDestinationPhone(e.target.value)}
                          placeholder="Optional"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                      placeholder="Additional notes or special instructions"
                    />
                  </div>

                  <Button
                    onClick={createShipment}
                    disabled={isLoading || shipmentItems.length === 0}
                    className="w-full"
                    size="lg"
                  >
                    <Package className="mr-2 h-4 w-4" />
                    {isLoading ? 'Creating Shipment...' : 'Create Shipment'}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Shipment Requests Tab */}
        <TabsContent value="requests" className="space-y-6">
          {/* Stats Overview */}
          <ShipmentStatsOverview stats={stats} />

          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>All Shipments</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ShipmentFilters
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                statusFilter={statusFilter}
                onStatusChange={setStatusFilter}
                clientFilter={clientFilter}
                onClientChange={setClientFilter}
                companies={companies}
                onClearFilters={clearFilters}
              />

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Shipment #</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Carrier</TableHead>
                    <TableHead>Tracking</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[120px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredShipments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                        No shipments found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredShipments.map(shipment => (
                      <TableRow key={shipment.id}>
                        <TableCell className="font-medium">{shipment.shipment_number}</TableCell>
                        <TableCell>{shipment.company_name}</TableCell>
                        <TableCell>{shipment.items_count}</TableCell>
                        <TableCell>{new Date(shipment.shipment_date).toLocaleDateString()}</TableCell>
                        <TableCell>{shipment.carrier || '-'}</TableCell>
                        <TableCell className="font-mono text-xs">{shipment.tracking_number || '-'}</TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadgeVariant(shipment.status)}>
                            {shipment.status.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setSelectedShipment(shipment);
                                setStatusDialogOpen(true);
                              }}
                              title="Update Status"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => generateShipmentPDF(shipment.id)}
                              title="Print Shipment"
                            >
                              <Printer className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>

              {filteredShipments.length > 0 && (
                <p className="text-sm text-muted-foreground text-center">
                  Showing {filteredShipments.length} of {shipments.length} shipments
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Status Update Dialog */}
      <ShipmentStatusDialog
        shipment={selectedShipment}
        open={statusDialogOpen}
        onOpenChange={setStatusDialogOpen}
        onUpdateStatus={updateShipmentStatus}
        isLoading={isUpdatingStatus}
      />
    </div>
  );
};

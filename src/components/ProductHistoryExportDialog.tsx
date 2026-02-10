import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Download, FileSpreadsheet, Calendar, Package, ArrowDownToLine, ArrowUpFromLine, Truck, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';
import { format, subMonths } from 'date-fns';
import { calculateNestedVariantQuantity, getVariantBreakdown } from '@/types/variants';

interface Product {
  id: string;
  name: string;
  sku?: string | null;
  company_id?: string;
  variants?: any;
  value?: number;
  minimum_quantity?: number;
  is_active?: boolean;
  companies?: {
    name: string;
    client_code?: string;
  };
}

interface ProductHistoryExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product | null;
  isAdmin?: boolean;
}

export const ProductHistoryExportDialog: React.FC<ProductHistoryExportDialogProps> = ({
  open,
  onOpenChange,
  product,
  isAdmin = false,
}) => {
  const [startDate, setStartDate] = useState(format(subMonths(new Date(), 3), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [includeCheckIns, setIncludeCheckIns] = useState(true);
  const [includeCheckOuts, setIncludeCheckOuts] = useState(true);
  const [includeShipments, setIncludeShipments] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const handleExport = async () => {
    if (!product || !product.company_id) {
      toast({
        title: "Export Failed",
        description: "Product company information is missing.",
        variant: "destructive",
      });
      return;
    }

    setIsExporting(true);
    try {
      const workbook = XLSX.utils.book_new();

      const normalizeName = (name: string) =>
        (name || '').toLowerCase().replace(/[^a-z0-9]/g, '');

      const levenshtein = (a: string, b: string) => {
        const alen = a.length;
        const blen = b.length;
        if (alen === 0) return blen;
        if (blen === 0) return alen;

        const v0 = new Array(blen + 1).fill(0);
        const v1 = new Array(blen + 1).fill(0);

        for (let i = 0; i <= blen; i++) v0[i] = i;

        for (let i = 0; i < alen; i++) {
          v1[0] = i + 1;
          for (let j = 0; j < blen; j++) {
            const cost = a[i] === b[j] ? 0 : 1;
            v1[j + 1] = Math.min(v1[j] + 1, v0[j + 1] + 1, v0[j] + cost);
          }
          for (let j = 0; j <= blen; j++) v0[j] = v1[j];
        }

        return v1[blen];
      };

      const isLikelySameProduct = (a: string, b: string) => {
        const na = normalizeName(a);
        const nb = normalizeName(b);
        if (!na || !nb) return false;

        if (na === nb) return true;
        if (na.includes(nb) || nb.includes(na)) return true;

        const dist = levenshtein(na, nb);
        const similarity = 1 - dist / Math.max(na.length, nb.length);
        return similarity >= 0.82;
      };

      // Product Info Sheet
      const variantBreakdown = product.variants && Array.isArray(product.variants) 
        ? getVariantBreakdown(product.variants) : {};
      const totalQty = product.variants && Array.isArray(product.variants) && product.variants.length > 0
        ? calculateNestedVariantQuantity(product.variants) : 0;
      const productValue = (product as any).value || 0;

      const productInfo: any[][] = [
        ['Product History Report'],
        [''],
        ['Product Name', product.name],
        ['SKU', product.sku || 'N/A'],
        ['Client', product.companies?.name || 'Unknown'],
        ['Client Code', product.companies?.client_code || 'N/A'],
        ['Unit Value', productValue ? `$${productValue.toFixed(2)}` : 'N/A'],
        ['Total Quantity', totalQty.toLocaleString()],
        ['Total Inventory Value', productValue && totalQty ? `$${(productValue * totalQty).toFixed(2)}` : 'N/A'],
        ['Minimum Quantity', (product as any).minimum_quantity || 'N/A'],
        ['Status', (product as any).is_active !== false ? 'Active' : 'Inactive'],
        ['Report Period', `${format(new Date(startDate), 'MMM dd, yyyy')} - ${format(new Date(endDate), 'MMM dd, yyyy')}`],
        ['Generated On', format(new Date(), 'MMM dd, yyyy HH:mm')],
      ];

      // Add variant breakdown to summary
      const variantEntries = Object.entries(variantBreakdown);
      if (variantEntries.length > 0) {
        productInfo.push(['']);
        productInfo.push(['Variant Breakdown']);
        variantEntries.forEach(([path, qty]) => {
          productInfo.push([path, qty.toString()]);
        });
      }
      const productSheet = XLSX.utils.aoa_to_sheet(productInfo);
      XLSX.utils.book_append_sheet(workbook, productSheet, 'Summary');

      // Check-In Requests
      if (includeCheckIns) {
        const { data: checkIns } = await supabase
          .from('check_in_requests')
          .select('*')
          .eq('company_id', product.company_id)
          .gte('created_at', startDate)
          .lte('created_at', endDate + 'T23:59:59')
          .order('created_at', { ascending: false });

        const checkInRows: any[][] = [
          ['Request #', 'Date', 'Status', 'Product Name', 'Variant', 'Quantity', 'Notes', 'Required Date']
        ];

        // Helper to normalize product name for comparison
        const normalizeProductName = (name: string) => 
          name?.toLowerCase().replace(/[^a-z0-9]/g, '') || '';

        const targetProductName = normalizeProductName(product.name);

        checkIns?.forEach(request => {
          const products = request.requested_products as any[];
          if (Array.isArray(products)) {
            products.forEach(p => {
              // Check if this product matches (by product_id or normalized name)
              const matchesById = p.product_id === product.id;
              const matchesByName = normalizeProductName(p.name).includes(targetProductName) || 
                                    targetProductName.includes(normalizeProductName(p.name));
              
              if (matchesById || matchesByName) {
                // Extract quantity from variants structure
                const variants = p.variants as any[];
                if (Array.isArray(variants) && variants.length > 0) {
                  variants.forEach((variant: any) => {
                    const variantAttr = variant.attribute || '';
                    const values = variant.values as any[];
                    if (Array.isArray(values)) {
                      values.forEach((v: any) => {
                        const qty = v.quantity || parseInt(v.value) || 0;
                        if (qty > 0) {
                          checkInRows.push([
                            request.request_number,
                            format(new Date(request.created_at), 'MMM dd, yyyy'),
                            request.status,
                            p.name || product.name,
                            variantAttr ? `${variantAttr}: ${v.value || ''}` : (v.value || ''),
                            qty,
                            request.notes || '',
                            request.required_date ? format(new Date(request.required_date), 'MMM dd, yyyy') : ''
                          ]);
                        }
                      });
                    }
                  });
                } else {
                  // Fallback if no variants structure
                  const qty = p.quantity || p.total_quantity || 0;
                  if (qty > 0) {
                    checkInRows.push([
                      request.request_number,
                      format(new Date(request.created_at), 'MMM dd, yyyy'),
                      request.status,
                      p.name || product.name,
                      '',
                      qty,
                      request.notes || '',
                      request.required_date ? format(new Date(request.required_date), 'MMM dd, yyyy') : ''
                    ]);
                  }
                }
              }
            });
          }
        });

        if (checkInRows.length > 1) {
          const checkInSheet = XLSX.utils.aoa_to_sheet(checkInRows);
          XLSX.utils.book_append_sheet(workbook, checkInSheet, 'Check-Ins');
        }
      }

      // Check-Out Requests
      if (includeCheckOuts) {
        const { data: checkOuts } = await supabase
          .from('check_out_requests')
          .select('*')
          .eq('company_id', product.company_id)
          .gte('created_at', startDate)
          .lte('created_at', endDate + 'T23:59:59')
          .order('created_at', { ascending: false });

        const checkOutRows: any[][] = [
          ['Request #', 'Date', 'Status', 'Product Name', 'Variant', 'Quantity', 'Delivery Date', 'Notes']
        ];

        // Helper to normalize product name for comparison
        const normalizeProductName = (name: string) => 
          name?.toLowerCase().replace(/[^a-z0-9]/g, '') || '';

        const targetProductName = normalizeProductName(product.name);

        checkOuts?.forEach(request => {
          const items = request.requested_items as any[];
          if (Array.isArray(items)) {
            items.forEach(item => {
              // Check if this product matches (by product_id or normalized name)
              const matchesById = item.product_id === product.id;
              const matchesByName = normalizeProductName(item.product_name).includes(targetProductName) || 
                                    targetProductName.includes(normalizeProductName(item.product_name));
              
              if (matchesById || matchesByName) {
                checkOutRows.push([
                  request.request_number,
                  format(new Date(request.created_at), 'MMM dd, yyyy'),
                  request.status,
                  item.product_name || product.name,
                  item.variant_value || item.variant_details || '',
                  item.quantity || 0,
                  request.delivery_date ? format(new Date(request.delivery_date), 'MMM dd, yyyy') : '',
                  request.notes || ''
                ]);
              }
            });
          }
        });

        if (checkOutRows.length > 1) {
          const checkOutSheet = XLSX.utils.aoa_to_sheet(checkOutRows);
          XLSX.utils.book_append_sheet(workbook, checkOutSheet, 'Check-Outs');
        }
      }

      // Shipments
      if (includeShipments) {
        const { data: shipmentItems } = await supabase
          .from('shipment_items')
          .select(`
            *,
            shipments (
              shipment_number,
              status,
              shipment_date,
              destination_address,
              tracking_number,
              carrier
            )
          `)
          .eq('product_id', product.id);

        const shipmentRows: any[][] = [
          ['Shipment #', 'Date', 'Status', 'Variant', 'Quantity', 'Carrier', 'Tracking #', 'Destination']
        ];

        shipmentItems?.forEach(item => {
          const shipment = item.shipments as any;
          if (shipment) {
            const shipmentDate = new Date(shipment.shipment_date);
            if (shipmentDate >= new Date(startDate) && shipmentDate <= new Date(endDate + 'T23:59:59')) {
              shipmentRows.push([
                shipment.shipment_number,
                format(shipmentDate, 'MMM dd, yyyy'),
                shipment.status,
                item.variant_attribute ? `${item.variant_attribute}: ${item.variant_value}` : '',
                item.quantity,
                shipment.carrier || '',
                shipment.tracking_number || '',
                shipment.destination_address || ''
              ]);
            }
          }
        });

        if (shipmentRows.length > 1) {
          const shipmentSheet = XLSX.utils.aoa_to_sheet(shipmentRows);
          XLSX.utils.book_append_sheet(workbook, shipmentSheet, 'Shipments');
        }
      }

      // Generate filename
      const filename = `${product.name.replace(/[^a-z0-9]/gi, '_')}_history_${format(new Date(), 'yyyyMMdd')}.xlsx`;
      
      // Download
      XLSX.writeFile(workbook, filename);

      toast({
        title: "Export Complete",
        description: `Product history exported to ${filename}`,
      });

      onOpenChange(false);
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export product history. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  if (!product) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md w-[calc(100%-2rem)] overflow-hidden">
        <DialogHeader className="pb-2">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <FileSpreadsheet className="h-4 w-4 text-primary" />
            </div>
            <span className="truncate">Export Product History</span>
          </DialogTitle>
          <DialogDescription className="text-sm">
            Download historical data for this product as an Excel file.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          {/* Product Info */}
          <div className="flex items-start gap-3 p-3 rounded-lg border bg-muted/30">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Package className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm break-words">{product.name}</div>
              <div className="text-xs text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-1 mt-0.5">
                <code className="bg-muted px-1.5 py-0.5 rounded text-xs break-all">{product.sku || 'No SKU'}</code>
                {isAdmin && product.companies && (
                  <>
                    <span className="text-muted-foreground/50">•</span>
                    <span className="break-words">{product.companies.name}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Date Range */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <Label className="text-sm font-medium">Date Range</Label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">From</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="h-9 text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">To</Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="h-9 text-sm"
                />
              </div>
            </div>
          </div>

          {/* Data to Include */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Include in Export</Label>
            <div className="space-y-2">
              <label 
                htmlFor="checkIns" 
                className="flex items-center gap-3 p-3 rounded-lg border bg-background hover:bg-muted/30 transition-colors cursor-pointer min-w-0"
              >
                <Checkbox
                  id="checkIns"
                  checked={includeCheckIns}
                  onCheckedChange={(checked) => setIncludeCheckIns(checked as boolean)}
                  className="shrink-0"
                />
                <div className="h-8 w-8 rounded-md bg-green-500/10 flex items-center justify-center shrink-0">
                  <ArrowDownToLine className="h-4 w-4 text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">Check-In Requests</div>
                  <div className="text-xs text-muted-foreground truncate">Inbound inventory records</div>
                </div>
              </label>
              
              <label 
                htmlFor="checkOuts" 
                className="flex items-center gap-3 p-3 rounded-lg border bg-background hover:bg-muted/30 transition-colors cursor-pointer min-w-0"
              >
                <Checkbox
                  id="checkOuts"
                  checked={includeCheckOuts}
                  onCheckedChange={(checked) => setIncludeCheckOuts(checked as boolean)}
                  className="shrink-0"
                />
                <div className="h-8 w-8 rounded-md bg-orange-500/10 flex items-center justify-center shrink-0">
                  <ArrowUpFromLine className="h-4 w-4 text-orange-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">Check-Out Requests</div>
                  <div className="text-xs text-muted-foreground truncate">Outbound inventory records</div>
                </div>
              </label>
              
              <label 
                htmlFor="shipments" 
                className="flex items-center gap-3 p-3 rounded-lg border bg-background hover:bg-muted/30 transition-colors cursor-pointer min-w-0"
              >
                <Checkbox
                  id="shipments"
                  checked={includeShipments}
                  onCheckedChange={(checked) => setIncludeShipments(checked as boolean)}
                  className="shrink-0"
                />
                <div className="h-8 w-8 rounded-md bg-blue-500/10 flex items-center justify-center shrink-0">
                  <Truck className="h-4 w-4 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">Shipments</div>
                  <div className="text-xs text-muted-foreground truncate">Delivered shipment records</div>
                </div>
              </label>
            </div>
          </div>

          {/* Export Button */}
          <div className="pt-2">
            <Button 
              onClick={handleExport} 
              className="w-full h-10"
              disabled={isExporting || (!includeCheckIns && !includeCheckOuts && !includeShipments)}
            >
              {isExporting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating Export...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Export to Excel
                </>
              )}
            </Button>
            {(!includeCheckIns && !includeCheckOuts && !includeShipments) && (
              <p className="text-xs text-muted-foreground text-center mt-2">
                Select at least one data type to export
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

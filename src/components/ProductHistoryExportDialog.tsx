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
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Download, FileSpreadsheet, Calendar, Package, ArrowDownToLine, ArrowUpFromLine, Truck, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';
import { format, subMonths } from 'date-fns';

interface Product {
  id: string;
  name: string;
  sku?: string | null;
  company_id?: string;
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
      
      // Product Info Sheet
      const productInfo = [
        ['Product History Report'],
        [''],
        ['Product Name', product.name],
        ['SKU', product.sku || 'N/A'],
        ['Client', product.companies?.name || 'Unknown'],
        ['Client Code', product.companies?.client_code || 'N/A'],
        ['Report Period', `${format(new Date(startDate), 'MMM dd, yyyy')} - ${format(new Date(endDate), 'MMM dd, yyyy')}`],
        ['Generated On', format(new Date(), 'MMM dd, yyyy HH:mm')],
      ];
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
          ['Request #', 'Date', 'Status', 'Product Name', 'Quantity', 'Notes', 'Required Date']
        ];

        checkIns?.forEach(request => {
          const products = request.requested_products as any[];
          if (Array.isArray(products)) {
            products.forEach(p => {
              // Check if this product matches
              if (p.name === product.name || p.product_id === product.id) {
                checkInRows.push([
                  request.request_number,
                  format(new Date(request.created_at), 'MMM dd, yyyy'),
                  request.status,
                  p.name || product.name,
                  p.quantity || p.total_quantity || 0,
                  request.notes || '',
                  request.required_date ? format(new Date(request.required_date), 'MMM dd, yyyy') : ''
                ]);
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

        checkOuts?.forEach(request => {
          const items = request.requested_items as any[];
          if (Array.isArray(items)) {
            items.forEach(item => {
              if (item.product_name === product.name || item.product_id === product.id) {
                checkOutRows.push([
                  request.request_number,
                  format(new Date(request.created_at), 'MMM dd, yyyy'),
                  request.status,
                  item.product_name || product.name,
                  item.variant_details || '',
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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            Export Product History
          </DialogTitle>
          <DialogDescription>
            Download historical data for this product as an Excel file.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Product Info */}
          <Card className="bg-muted/50">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Package className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{product.name}</div>
                  <div className="text-sm text-muted-foreground flex items-center gap-2">
                    <code className="text-xs">{product.sku || 'No SKU'}</code>
                    {isAdmin && product.companies && (
                      <>
                        <span>•</span>
                        <span>{product.companies.name}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Date Range */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2 text-sm font-medium">
              <Calendar className="h-4 w-4" />
              Date Range
            </Label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground">From</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">To</Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Data to Include */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Include in Export</Label>
            <div className="space-y-2">
              <div className="flex items-center gap-3 p-3 rounded-lg border bg-background hover:bg-muted/50 transition-colors">
                <Checkbox
                  id="checkIns"
                  checked={includeCheckIns}
                  onCheckedChange={(checked) => setIncludeCheckIns(checked as boolean)}
                />
                <label htmlFor="checkIns" className="flex items-center gap-2 flex-1 cursor-pointer">
                  <ArrowDownToLine className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Check-In Requests</span>
                </label>
                <Badge variant="secondary" className="text-xs">Inbound</Badge>
              </div>
              
              <div className="flex items-center gap-3 p-3 rounded-lg border bg-background hover:bg-muted/50 transition-colors">
                <Checkbox
                  id="checkOuts"
                  checked={includeCheckOuts}
                  onCheckedChange={(checked) => setIncludeCheckOuts(checked as boolean)}
                />
                <label htmlFor="checkOuts" className="flex items-center gap-2 flex-1 cursor-pointer">
                  <ArrowUpFromLine className="h-4 w-4 text-orange-600" />
                  <span className="text-sm">Check-Out Requests</span>
                </label>
                <Badge variant="secondary" className="text-xs">Outbound</Badge>
              </div>
              
              <div className="flex items-center gap-3 p-3 rounded-lg border bg-background hover:bg-muted/50 transition-colors">
                <Checkbox
                  id="shipments"
                  checked={includeShipments}
                  onCheckedChange={(checked) => setIncludeShipments(checked as boolean)}
                />
                <label htmlFor="shipments" className="flex items-center gap-2 flex-1 cursor-pointer">
                  <Truck className="h-4 w-4 text-blue-600" />
                  <span className="text-sm">Shipments</span>
                </label>
                <Badge variant="secondary" className="text-xs">Delivered</Badge>
              </div>
            </div>
          </div>

          {/* Export Button */}
          <Button 
            onClick={handleExport} 
            className="w-full"
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
        </div>
      </DialogContent>
    </Dialog>
  );
};

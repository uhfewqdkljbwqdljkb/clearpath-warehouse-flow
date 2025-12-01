import React, { useState, useEffect } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { CalendarIcon, Download, Search, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface JardeReportItem {
  product_id: string;
  product_name: string;
  variant_value?: string;
  starting_quantity: number;
  check_ins: number;
  check_outs: number;
  expected_quantity: number;
  actual_quantity: number | null;
  variance: number | null;
}

interface JardeClientReport {
  company_id: string;
  company_name: string;
  items: JardeReportItem[];
}

interface Company {
  id: string;
  name: string;
}

export const Jarde: React.FC = () => {
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('all');
  const [companies, setCompanies] = useState<Company[]>([]);
  const [report, setReport] = useState<JardeClientReport[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('id, name')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setCompanies(data || []);
    } catch (error) {
      console.error('Error fetching companies:', error);
      toast({
        title: 'Error',
        description: 'Failed to load clients',
        variant: 'destructive',
      });
    }
  };

  const generateReport = async () => {
    if (!startDate || !endDate) {
      toast({
        title: 'Missing Dates',
        description: 'Please select both start and end dates',
        variant: 'destructive',
      });
      return;
    }

    if (startDate > endDate) {
      toast({
        title: 'Invalid Date Range',
        description: 'Start date must be before end date',
        variant: 'destructive',
      });
      return;
    }

    setIsGenerating(true);

    try {
      const companyFilter = selectedCompanyId === 'all' 
        ? companies.map(c => c.id) 
        : [selectedCompanyId];

      const reportData: JardeClientReport[] = [];

      for (const companyId of companyFilter) {
        const company = companies.find(c => c.id === companyId);
        if (!company) continue;

        // Fetch products for this company
        const { data: products, error: productsError } = await supabase
          .from('client_products')
          .select('id, name, variants')
          .eq('company_id', companyId)
          .eq('is_active', true);

        if (productsError) throw productsError;

        const items: JardeReportItem[] = [];

        for (const product of products || []) {
          // Calculate starting quantity (all check-ins minus check-outs before start date)
          const startingQty = await calculateStartingQuantity(companyId, product.id, product.name, startDate);

          // Calculate check-ins within date range
          const checkIns = await calculateCheckIns(companyId, product.id, product.name, startDate, endDate);

          // Calculate check-outs within date range
          const checkOuts = await calculateCheckOuts(companyId, product.id, product.name, startDate, endDate);

          const expectedQty = startingQty + checkIns - checkOuts;

          items.push({
            product_id: product.id,
            product_name: product.name,
            starting_quantity: startingQty,
            check_ins: checkIns,
            check_outs: checkOuts,
            expected_quantity: expectedQty,
            actual_quantity: null,
            variance: null,
          });

          // If product has variants, also track them separately
          if (product.variants && Array.isArray(product.variants) && product.variants.length > 0) {
            for (const variant of product.variants as any[]) {
              if (variant.values && Array.isArray(variant.values)) {
                for (const value of variant.values) {
                  const variantStarting = await calculateStartingQuantityVariant(
                    companyId, 
                    product.id, 
                    product.name, 
                    value, 
                    startDate
                  );
                  const variantCheckIns = await calculateCheckInsVariant(
                    companyId, 
                    product.id, 
                    product.name, 
                    value, 
                    startDate, 
                    endDate
                  );
                  const variantCheckOuts = await calculateCheckOutsVariant(
                    companyId, 
                    product.id, 
                    product.name, 
                    value, 
                    startDate, 
                    endDate
                  );
                  const variantExpected = variantStarting + variantCheckIns - variantCheckOuts;

                  items.push({
                    product_id: product.id,
                    product_name: `${product.name} (${value})`,
                    variant_value: value,
                    starting_quantity: variantStarting,
                    check_ins: variantCheckIns,
                    check_outs: variantCheckOuts,
                    expected_quantity: variantExpected,
                    actual_quantity: null,
                    variance: null,
                  });
                }
              }
            }
          }
        }

        reportData.push({
          company_id: companyId,
          company_name: company.name,
          items: items.filter(item => 
            item.starting_quantity !== 0 || 
            item.check_ins !== 0 || 
            item.check_outs !== 0 || 
            item.expected_quantity !== 0
          ),
        });
      }

      setReport(reportData);
      toast({
        title: 'Report Generated',
        description: 'JARDE report has been generated successfully',
      });
    } catch (error) {
      console.error('Error generating report:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate report',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const calculateStartingQuantity = async (
    companyId: string, 
    productId: string, 
    productName: string, 
    beforeDate: Date
  ): Promise<number> => {
    let total = 0;

    // Check-ins before start date
    const { data: checkIns, error: checkInError } = await supabase
      .from('check_in_requests')
      .select('requested_products, amended_products, was_amended, reviewed_at')
      .eq('company_id', companyId)
      .eq('status', 'approved')
      .lt('reviewed_at', beforeDate.toISOString());

    if (!checkInError && checkIns) {
      for (const request of checkIns) {
        const products = request.was_amended ? request.amended_products : request.requested_products;
        if (Array.isArray(products)) {
          for (const item of products as any) {
            if (item.name === productName) {
              total += item.quantity || 0;
            }
          }
        }
      }
    }

    // Check-outs before start date
    const { data: checkOuts, error: checkOutError } = await supabase
      .from('check_out_requests')
      .select('requested_items, reviewed_at')
      .eq('company_id', companyId)
      .eq('status', 'approved')
      .lt('reviewed_at', beforeDate.toISOString());

    if (!checkOutError && checkOuts) {
      for (const request of checkOuts) {
        if (Array.isArray(request.requested_items)) {
          for (const item of request.requested_items as any) {
            if (item.product_name === productName && !item.variant_value) {
              total -= item.quantity || 0;
            }
          }
        }
      }
    }

    return total;
  };

  const calculateCheckIns = async (
    companyId: string, 
    productId: string, 
    productName: string, 
    start: Date, 
    end: Date
  ): Promise<number> => {
    let total = 0;

    const { data, error } = await supabase
      .from('check_in_requests')
      .select('requested_products, amended_products, was_amended, reviewed_at')
      .eq('company_id', companyId)
      .eq('status', 'approved')
      .gte('reviewed_at', start.toISOString())
      .lte('reviewed_at', end.toISOString());

    if (!error && data) {
      for (const request of data) {
        const products = request.was_amended ? request.amended_products : request.requested_products;
        if (Array.isArray(products)) {
          for (const item of products as any) {
            if (item.name === productName) {
              total += item.quantity || 0;
            }
          }
        }
      }
    }

    return total;
  };

  const calculateCheckOuts = async (
    companyId: string, 
    productId: string, 
    productName: string, 
    start: Date, 
    end: Date
  ): Promise<number> => {
    let total = 0;

    const { data, error } = await supabase
      .from('check_out_requests')
      .select('requested_items, reviewed_at')
      .eq('company_id', companyId)
      .eq('status', 'approved')
      .gte('reviewed_at', start.toISOString())
      .lte('reviewed_at', end.toISOString());

    if (!error && data) {
      for (const request of data) {
        if (Array.isArray(request.requested_items)) {
          for (const item of request.requested_items as any) {
            if (item.product_name === productName && !item.variant_value) {
              total += item.quantity || 0;
            }
          }
        }
      }
    }

    return total;
  };

  // Variant-specific calculations
  const calculateStartingQuantityVariant = async (
    companyId: string, 
    productId: string, 
    productName: string, 
    variantValue: string,
    beforeDate: Date
  ): Promise<number> => {
    let total = 0;

    const { data: checkIns } = await supabase
      .from('check_in_requests')
      .select('requested_products, amended_products, was_amended')
      .eq('company_id', companyId)
      .eq('status', 'approved')
      .lt('reviewed_at', beforeDate.toISOString());

    if (checkIns) {
      for (const request of checkIns) {
        const products = request.was_amended ? request.amended_products : request.requested_products;
        if (Array.isArray(products)) {
          for (const item of products as any) {
            if (item.name === productName && item.variants) {
              const variant = item.variants.find((v: any) => v.value === variantValue);
              if (variant) {
                total += variant.quantity || 0;
              }
            }
          }
        }
      }
    }

    const { data: checkOuts } = await supabase
      .from('check_out_requests')
      .select('requested_items')
      .eq('company_id', companyId)
      .eq('status', 'approved')
      .lt('reviewed_at', beforeDate.toISOString());

    if (checkOuts) {
      for (const request of checkOuts) {
        if (Array.isArray(request.requested_items)) {
          for (const item of request.requested_items as any) {
            if (item.product_name === productName && item.variant_value === variantValue) {
              total -= item.quantity || 0;
            }
          }
        }
      }
    }

    return total;
  };

  const calculateCheckInsVariant = async (
    companyId: string, 
    productId: string, 
    productName: string, 
    variantValue: string,
    start: Date, 
    end: Date
  ): Promise<number> => {
    let total = 0;

    const { data } = await supabase
      .from('check_in_requests')
      .select('requested_products, amended_products, was_amended')
      .eq('company_id', companyId)
      .eq('status', 'approved')
      .gte('reviewed_at', start.toISOString())
      .lte('reviewed_at', end.toISOString());

    if (data) {
      for (const request of data) {
        const products = request.was_amended ? request.amended_products : request.requested_products;
        if (Array.isArray(products)) {
          for (const item of products as any) {
            if (item.name === productName && item.variants) {
              const variant = item.variants.find((v: any) => v.value === variantValue);
              if (variant) {
                total += variant.quantity || 0;
              }
            }
          }
        }
      }
    }

    return total;
  };

  const calculateCheckOutsVariant = async (
    companyId: string, 
    productId: string, 
    productName: string, 
    variantValue: string,
    start: Date, 
    end: Date
  ): Promise<number> => {
    let total = 0;

    const { data } = await supabase
      .from('check_out_requests')
      .select('requested_items')
      .eq('company_id', companyId)
      .eq('status', 'approved')
      .gte('reviewed_at', start.toISOString())
      .lte('reviewed_at', end.toISOString());

    if (data) {
      for (const request of data) {
        if (Array.isArray(request.requested_items)) {
          for (const item of request.requested_items as any) {
            if (item.product_name === productName && item.variant_value === variantValue) {
              total += item.quantity || 0;
            }
          }
        }
      }
    }

    return total;
  };

  const handleActualQuantityChange = (
    companyId: string, 
    itemIndex: number, 
    value: string
  ) => {
    const numValue = value === '' ? null : parseInt(value, 10);
    
    setReport(prev => prev.map(client => {
      if (client.company_id === companyId) {
        const updatedItems = [...client.items];
        updatedItems[itemIndex] = {
          ...updatedItems[itemIndex],
          actual_quantity: numValue,
          variance: numValue !== null ? numValue - updatedItems[itemIndex].expected_quantity : null,
        };
        return { ...client, items: updatedItems };
      }
      return client;
    }));
  };

  const getVarianceColor = (variance: number | null): string => {
    if (variance === null) return '';
    if (variance === 0) return 'text-green-600';
    if (Math.abs(variance) < 5) return 'text-yellow-600';
    return 'text-red-600';
  };

  const exportToPDF = () => {
    if (report.length === 0) {
      toast({
        title: 'No Data',
        description: 'Generate a report before exporting',
        variant: 'destructive',
      });
      return;
    }

    setIsExporting(true);

    try {
      const doc = new jsPDF();
      
      // Header
      doc.setFontSize(18);
      doc.text('JARDE - Inventory Reconciliation Report', 14, 20);
      
      doc.setFontSize(11);
      doc.text(`Date Range: ${format(startDate!, 'PP')} to ${format(endDate!, 'PP')}`, 14, 30);
      doc.text(`Generated: ${format(new Date(), 'PPpp')}`, 14, 36);

      let yPosition = 46;

      report.forEach((client) => {
        // Client header
        if (yPosition > 250) {
          doc.addPage();
          yPosition = 20;
        }

        doc.setFontSize(14);
        doc.setTextColor(0, 0, 0);
        doc.text(`Client: ${client.company_name}`, 14, yPosition);
        yPosition += 10;

        // Table data
        const tableData = client.items.map(item => [
          item.product_name,
          item.starting_quantity.toString(),
          item.check_ins.toString(),
          item.check_outs.toString(),
          item.expected_quantity.toString(),
          item.actual_quantity !== null ? item.actual_quantity.toString() : '-',
          item.variance !== null ? item.variance.toString() : '-',
        ]);

        (doc as any).autoTable({
          startY: yPosition,
          head: [['Product', 'Start', 'In', 'Out', 'Expected', 'Actual', 'Variance']],
          body: tableData,
          theme: 'grid',
          headStyles: { fillColor: [59, 130, 246] },
          styles: { fontSize: 9 },
          didDrawCell: (data: any) => {
            // Highlight variance column
            if (data.column.index === 6 && data.section === 'body') {
              const variance = parseFloat(data.cell.text[0]);
              if (!isNaN(variance)) {
                if (variance === 0) {
                  doc.setTextColor(0, 128, 0);
                } else if (Math.abs(variance) < 5) {
                  doc.setTextColor(255, 165, 0);
                } else {
                  doc.setTextColor(255, 0, 0);
                }
              }
            }
          },
        });

        yPosition = (doc as any).lastAutoTable.finalY + 15;
      });

      // Save PDF
      const fileName = `JARDE_Report_${format(startDate!, 'yyyy-MM-dd')}_to_${format(endDate!, 'yyyy-MM-dd')}.pdf`;
      doc.save(fileName);

      toast({
        title: 'Export Successful',
        description: 'PDF report has been downloaded',
      });
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast({
        title: 'Export Failed',
        description: 'Failed to generate PDF',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  const totalVarianceItems = report.reduce((sum, client) => 
    sum + client.items.filter(item => item.variance !== null && item.variance !== 0).length, 0
  );

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">JARDE</h1>
        <p className="text-muted-foreground mt-1">
          Inventory Reconciliation - Compare digital records with physical warehouse counts
        </p>
      </div>

      {/* Filters Card */}
      <Card>
        <CardHeader>
          <CardTitle>Report Configuration</CardTitle>
          <CardDescription>Select date range and client to generate reconciliation report</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Start Date */}
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !startDate && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, 'PPP') : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* End Date */}
            <div className="space-y-2">
              <Label>End Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !endDate && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, 'PPP') : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Client Filter */}
            <div className="space-y-2">
              <Label>Client</Label>
              <Select value={selectedCompanyId} onValueChange={setSelectedCompanyId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select client" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Clients</SelectItem>
                  {companies.map(company => (
                    <SelectItem key={company.id} value={company.id}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <Button 
              onClick={generateReport} 
              disabled={isGenerating || !startDate || !endDate}
              className="flex-1"
            >
              <Search className="mr-2 h-4 w-4" />
              {isGenerating ? 'Generating...' : 'Generate Report'}
            </Button>
            
            {report.length > 0 && (
              <Button 
                onClick={exportToPDF}
                disabled={isExporting}
                variant="outline"
              >
                <Download className="mr-2 h-4 w-4" />
                {isExporting ? 'Exporting...' : 'Export PDF'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      {report.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Clients</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{report.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Products</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {report.reduce((sum, client) => sum + client.items.length, 0)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Variance Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{totalVarianceItems}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Counted Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {report.reduce((sum, client) => 
                  sum + client.items.filter(item => item.actual_quantity !== null).length, 0
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Report Results */}
      {report.length > 0 ? (
        <div className="space-y-4">
          {report.map((client) => (
            <Card key={client.company_id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Client: {client.company_name}</span>
                  <span className="text-sm font-normal text-muted-foreground">
                    {client.items.length} products
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {client.items.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No inventory activity for this client in the selected period
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2 font-medium">Product</th>
                          <th className="text-right p-2 font-medium">Start</th>
                          <th className="text-right p-2 font-medium">Check-Ins</th>
                          <th className="text-right p-2 font-medium">Check-Outs</th>
                          <th className="text-right p-2 font-medium">Expected</th>
                          <th className="text-right p-2 font-medium">Actual</th>
                          <th className="text-right p-2 font-medium">Variance</th>
                        </tr>
                      </thead>
                      <tbody>
                        {client.items.map((item, index) => (
                          <tr key={index} className="border-b hover:bg-muted/50">
                            <td className="p-2">{item.product_name}</td>
                            <td className="text-right p-2">{item.starting_quantity}</td>
                            <td className="text-right p-2 text-green-600">+{item.check_ins}</td>
                            <td className="text-right p-2 text-red-600">-{item.check_outs}</td>
                            <td className="text-right p-2 font-medium">{item.expected_quantity}</td>
                            <td className="text-right p-2">
                              <Input
                                type="number"
                                min="0"
                                value={item.actual_quantity ?? ''}
                                onChange={(e) => handleActualQuantityChange(
                                  client.company_id, 
                                  index, 
                                  e.target.value
                                )}
                                className="w-20 h-8 text-right ml-auto"
                                placeholder="-"
                              />
                            </td>
                            <td className={cn(
                              "text-right p-2 font-bold",
                              getVarianceColor(item.variance)
                            )}>
                              {item.variance !== null ? (
                                item.variance > 0 ? `+${item.variance}` : item.variance
                              ) : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        !isGenerating && (
          <Card>
            <CardContent className="py-12">
              <div className="text-center text-muted-foreground space-y-2">
                <AlertCircle className="h-12 w-12 mx-auto opacity-50" />
                <p className="text-lg font-medium">No Report Generated</p>
                <p className="text-sm">Select a date range and click "Generate Report" to begin</p>
              </div>
            </CardContent>
          </Card>
        )
      )}
    </div>
  );
};
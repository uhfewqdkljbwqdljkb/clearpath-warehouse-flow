import React, { useState, useEffect } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { CalendarIcon, Download, Search, AlertCircle, Save, History, Trash2, Eye } from 'lucide-react';
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

interface CheckInRequest {
  company_id: string;
  requested_products: any;
  amended_products: any;
  was_amended: boolean;
  reviewed_at: string;
}

interface CheckOutRequest {
  company_id: string;
  requested_items: any;
  reviewed_at: string;
}

interface ClientProduct {
  id: string;
  company_id: string;
  name: string;
  variants: any;
}

interface SavedReport {
  id: string;
  report_date: string;
  start_date: string;
  end_date: string;
  company_id: string | null;
  report_data: JardeClientReport[];
  total_products: number;
  items_with_variance: number;
  notes: string | null;
  created_at: string;
  companies?: { name: string } | null;
}

export const Jarde: React.FC = () => {
  const { user } = useAuth();
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('all');
  const [companies, setCompanies] = useState<Company[]>([]);
  const [report, setReport] = useState<JardeClientReport[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('generate');
  const [savedReports, setSavedReports] = useState<SavedReport[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    fetchCompanies();
    fetchSavedReports();
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

  const fetchSavedReports = async () => {
    try {
      setLoadingHistory(true);
      const { data, error } = await supabase
        .from('jarde_reports')
        .select('*, companies(name)')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setSavedReports((data || []).map(item => ({
        ...item,
        report_data: item.report_data as unknown as JardeClientReport[],
        companies: item.companies as { name: string } | null
      })));
    } catch (error) {
      console.error('Error fetching saved reports:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const saveReport = async () => {
    if (report.length === 0 || !startDate || !endDate) {
      toast({
        title: 'No Report',
        description: 'Generate a report before saving',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      const totalProducts = report.reduce((sum, c) => sum + c.items.length, 0);
      const itemsWithVariance = report.reduce((sum, c) => 
        sum + c.items.filter(i => i.variance !== null && i.variance !== 0).length, 0
      );

      const { error } = await supabase
        .from('jarde_reports')
        .insert({
          start_date: format(startDate, 'yyyy-MM-dd'),
          end_date: format(endDate, 'yyyy-MM-dd'),
          company_id: selectedCompanyId === 'all' ? null : selectedCompanyId,
          report_data: report as any,
          total_products: totalProducts,
          items_with_variance: itemsWithVariance,
          created_by: user?.id,
        });

      if (error) throw error;

      toast({
        title: 'Report Saved',
        description: 'JARDE report has been saved to history',
      });
      fetchSavedReports();
    } catch (error) {
      console.error('Error saving report:', error);
      toast({
        title: 'Save Failed',
        description: 'Failed to save report',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const loadSavedReport = (savedReport: SavedReport) => {
    setReport(savedReport.report_data);
    setStartDate(new Date(savedReport.start_date));
    setEndDate(new Date(savedReport.end_date));
    setSelectedCompanyId(savedReport.company_id || 'all');
    setActiveTab('generate');
    toast({
      title: 'Report Loaded',
      description: `Loaded report from ${format(new Date(savedReport.created_at), 'PPP')}`,
    });
  };

  const deleteSavedReport = async (id: string) => {
    try {
      const { error } = await supabase
        .from('jarde_reports')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Report Deleted',
        description: 'Report has been removed from history',
      });
      fetchSavedReports();
    } catch (error) {
      console.error('Error deleting report:', error);
      toast({
        title: 'Delete Failed',
        description: 'Failed to delete report',
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

      // Set end date to end of day for inclusive filtering
      const endOfDay = new Date(endDate);
      endOfDay.setHours(23, 59, 59, 999);

      // BATCH QUERY 1: Fetch ALL approved check-ins up to end date
      const { data: allCheckIns, error: checkInError } = await supabase
        .from('check_in_requests')
        .select('company_id, requested_products, amended_products, was_amended, reviewed_at')
        .eq('status', 'approved')
        .in('company_id', companyFilter)
        .lte('reviewed_at', endOfDay.toISOString());

      if (checkInError) throw checkInError;

      // BATCH QUERY 2: Fetch ALL approved check-outs up to end date
      const { data: allCheckOuts, error: checkOutError } = await supabase
        .from('check_out_requests')
        .select('company_id, requested_items, reviewed_at')
        .eq('status', 'approved')
        .in('company_id', companyFilter)
        .lte('reviewed_at', endOfDay.toISOString());

      if (checkOutError) throw checkOutError;

      // BATCH QUERY 3: Fetch ALL products for selected companies
      const { data: allProducts, error: productsError } = await supabase
        .from('client_products')
        .select('id, company_id, name, variants')
        .eq('is_active', true)
        .in('company_id', companyFilter);

      if (productsError) throw productsError;

      // Pre-process data into lookup maps by company
      const checkInsByCompany = new Map<string, CheckInRequest[]>();
      const checkOutsByCompany = new Map<string, CheckOutRequest[]>();
      const productsByCompany = new Map<string, ClientProduct[]>();

      (allCheckIns || []).forEach((request) => {
        const existing = checkInsByCompany.get(request.company_id) || [];
        existing.push(request as CheckInRequest);
        checkInsByCompany.set(request.company_id, existing);
      });

      (allCheckOuts || []).forEach((request) => {
        const existing = checkOutsByCompany.get(request.company_id) || [];
        existing.push(request as CheckOutRequest);
        checkOutsByCompany.set(request.company_id, existing);
      });

      (allProducts || []).forEach((product) => {
        const existing = productsByCompany.get(product.company_id) || [];
        existing.push(product as ClientProduct);
        productsByCompany.set(product.company_id, existing);
      });

      // Helper functions for in-memory calculations
      const getCheckInQuantity = (
        checkIns: CheckInRequest[],
        productName: string,
        variantValue: string | null,
        fromDate: Date | null,
        toDate: Date
      ): number => {
        let total = 0;
        for (const request of checkIns) {
          const reviewedAt = new Date(request.reviewed_at);
          if (fromDate && reviewedAt < fromDate) continue;
          if (reviewedAt > toDate) continue;

          const products = request.was_amended ? request.amended_products : request.requested_products;
          if (!Array.isArray(products)) continue;

          for (const item of products) {
            if (item.name !== productName) continue;

            if (variantValue) {
              // Looking for specific variant
              if (item.variants && Array.isArray(item.variants)) {
                const variant = item.variants.find((v: any) => v.value === variantValue);
                if (variant) {
                  total += variant.quantity || 0;
                }
              }
            } else {
              // Base product quantity (non-variant)
              total += item.quantity || 0;
            }
          }
        }
        return total;
      };

      const getCheckOutQuantity = (
        checkOuts: CheckOutRequest[],
        productName: string,
        variantValue: string | null,
        fromDate: Date | null,
        toDate: Date
      ): number => {
        let total = 0;
        for (const request of checkOuts) {
          const reviewedAt = new Date(request.reviewed_at);
          if (fromDate && reviewedAt < fromDate) continue;
          if (reviewedAt > toDate) continue;

          if (!Array.isArray(request.requested_items)) continue;

          for (const item of request.requested_items) {
            if (item.product_name !== productName) continue;

            if (variantValue) {
              if (item.variant_value === variantValue) {
                total += item.quantity || 0;
              }
            } else {
              if (!item.variant_value) {
                total += item.quantity || 0;
              }
            }
          }
        }
        return total;
      };

      // Build report data
      const reportData: JardeClientReport[] = [];

      for (const companyId of companyFilter) {
        const company = companies.find(c => c.id === companyId);
        if (!company) continue;

        const companyCheckIns = checkInsByCompany.get(companyId) || [];
        const companyCheckOuts = checkOutsByCompany.get(companyId) || [];
        const companyProducts = productsByCompany.get(companyId) || [];

        const items: JardeReportItem[] = [];

        for (const product of companyProducts) {
          // Calculate for base product
          const startingQty = 
            getCheckInQuantity(companyCheckIns, product.name, null, null, startDate) -
            getCheckOutQuantity(companyCheckOuts, product.name, null, null, startDate);

          const checkIns = getCheckInQuantity(companyCheckIns, product.name, null, startDate, endDate);
          const checkOuts = getCheckOutQuantity(companyCheckOuts, product.name, null, startDate, endDate);
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

          // Calculate for each variant
          if (product.variants && Array.isArray(product.variants) && product.variants.length > 0) {
            for (const variant of product.variants as any[]) {
              if (variant.values && Array.isArray(variant.values)) {
                for (const value of variant.values) {
                  const variantStarting = 
                    getCheckInQuantity(companyCheckIns, product.name, value, null, startDate) -
                    getCheckOutQuantity(companyCheckOuts, product.name, value, null, startDate);

                  const variantCheckIns = getCheckInQuantity(companyCheckIns, product.name, value, startDate, endDate);
                  const variantCheckOuts = getCheckOutQuantity(companyCheckOuts, product.name, value, startDate, endDate);
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
      doc.setFontSize(20);
      doc.text('JARDE - Inventory Reconciliation Report', 14, 20);
      
      doc.setFontSize(10);
      doc.text(`Date Range: ${startDate ? format(startDate, 'PP') : 'N/A'} - ${endDate ? format(endDate, 'PP') : 'N/A'}`, 14, 30);
      doc.text(`Generated: ${format(new Date(), 'PPpp')}`, 14, 36);

      let yPosition = 45;

      for (const clientReport of report) {
        if (clientReport.items.length === 0) continue;

        // Check if we need a new page
        if (yPosition > 250) {
          doc.addPage();
          yPosition = 20;
        }

        // Client header
        doc.setFontSize(14);
        doc.text(`Client: ${clientReport.company_name}`, 14, yPosition);
        yPosition += 8;

        // Table
        const tableData = clientReport.items.map(item => [
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
          theme: 'striped',
          styles: { fontSize: 8 },
          headStyles: { fillColor: [59, 130, 246] },
          didParseCell: (data: any) => {
            // Color variance column
            if (data.column.index === 6 && data.section === 'body') {
              const variance = parseInt(data.cell.text[0], 10);
              if (!isNaN(variance)) {
                if (variance === 0) {
                  data.cell.styles.textColor = [34, 197, 94];
                } else if (Math.abs(variance) < 5) {
                  data.cell.styles.textColor = [234, 179, 8];
                } else {
                  data.cell.styles.textColor = [239, 68, 68];
                }
              }
            }
          },
        });

        yPosition = (doc as any).lastAutoTable.finalY + 15;
      }

      // Summary
      const totalProducts = report.reduce((sum, c) => sum + c.items.length, 0);
      const itemsWithVariance = report.reduce((sum, c) => 
        sum + c.items.filter(i => i.variance !== null && i.variance !== 0).length, 0
      );

      if (yPosition > 270) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(12);
      doc.text('Summary', 14, yPosition);
      yPosition += 7;
      doc.setFontSize(10);
      doc.text(`Total Products Analyzed: ${totalProducts}`, 14, yPosition);
      yPosition += 6;
      doc.text(`Products with Variance: ${itemsWithVariance}`, 14, yPosition);

      doc.save(`JARDE-Report-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
      
      toast({
        title: 'Export Complete',
        description: 'PDF has been downloaded',
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

  const totalProducts = report.reduce((sum, c) => sum + c.items.length, 0);
  const itemsWithVariance = report.reduce((sum, c) => 
    sum + c.items.filter(i => i.variance !== null && i.variance !== 0).length, 0
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-foreground">JARDE</h1>
          <p className="text-muted-foreground">
            Inventory Reconciliation - Compare digital records with physical warehouse counts
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="generate">Generate Report</TabsTrigger>
          <TabsTrigger value="history">
            <History className="h-4 w-4 mr-2" />
            Report History ({savedReports.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="generate" className="space-y-6">
          {/* Controls */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Report Parameters</CardTitle>
              <CardDescription>Select date range and client to generate reconciliation report</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-4 items-end">
                {/* Start Date */}
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-[200px] justify-start text-left font-normal",
                          !startDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {startDate ? format(startDate, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={setStartDate}
                        initialFocus
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
                          "w-[200px] justify-start text-left font-normal",
                          !endDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {endDate ? format(endDate, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={endDate}
                        onSelect={setEndDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Client Filter */}
                <div className="space-y-2">
                  <Label>Client</Label>
                  <Select value={selectedCompanyId} onValueChange={setSelectedCompanyId}>
                    <SelectTrigger className="w-[200px]">
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

                {/* Generate Button */}
                <Button onClick={generateReport} disabled={isGenerating}>
                  <Search className="mr-2 h-4 w-4" />
                  {isGenerating ? 'Generating...' : 'Generate Report'}
                </Button>

                {/* Save Button */}
                <Button 
                  variant="secondary"
                  onClick={saveReport} 
                  disabled={isSaving || report.length === 0}
                >
                  <Save className="mr-2 h-4 w-4" />
                  {isSaving ? 'Saving...' : 'Save Report'}
                </Button>

                {/* Export Button */}
                <Button 
                  variant="outline" 
                  onClick={exportToPDF} 
                  disabled={isExporting || report.length === 0}
                >
                  <Download className="mr-2 h-4 w-4" />
                  {isExporting ? 'Exporting...' : 'Export PDF'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Summary Stats */}
          {report.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">{report.length}</div>
                  <p className="text-muted-foreground text-sm">Clients Analyzed</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">{totalProducts}</div>
                  <p className="text-muted-foreground text-sm">Products Tracked</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className={cn("text-2xl font-bold", itemsWithVariance > 0 && "text-red-600")}>
                    {itemsWithVariance}
                  </div>
                  <p className="text-muted-foreground text-sm">Items with Variance</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Report Tables */}
          {report.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center text-muted-foreground">
                  <AlertCircle className="mx-auto h-12 w-12 mb-4 opacity-50" />
                  <p>Select dates and generate a report to view reconciliation data</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {report.map(clientReport => (
                <Card key={clientReport.company_id}>
                  <CardHeader>
                    <CardTitle>{clientReport.company_name}</CardTitle>
                    <CardDescription>{clientReport.items.length} products tracked</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {clientReport.items.length === 0 ? (
                      <p className="text-muted-foreground text-center py-4">
                        No inventory activity for this client in the selected period
                      </p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left py-2 px-2">Product</th>
                              <th className="text-right py-2 px-2">Start</th>
                              <th className="text-right py-2 px-2">In</th>
                              <th className="text-right py-2 px-2">Out</th>
                              <th className="text-right py-2 px-2">Expected</th>
                              <th className="text-right py-2 px-2">Actual</th>
                              <th className="text-right py-2 px-2">Variance</th>
                            </tr>
                          </thead>
                          <tbody>
                            {clientReport.items.map((item, index) => (
                              <tr key={`${item.product_id}-${item.variant_value || 'base'}`} className="border-b">
                                <td className="py-2 px-2">{item.product_name}</td>
                                <td className="text-right py-2 px-2">{item.starting_quantity}</td>
                                <td className="text-right py-2 px-2 text-green-600">+{item.check_ins}</td>
                                <td className="text-right py-2 px-2 text-red-600">-{item.check_outs}</td>
                                <td className="text-right py-2 px-2 font-medium">{item.expected_quantity}</td>
                                <td className="text-right py-2 px-2">
                                  <Input
                                    type="number"
                                    className="w-20 h-8 text-right"
                                    value={item.actual_quantity ?? ''}
                                    onChange={(e) => handleActualQuantityChange(
                                      clientReport.company_id,
                                      index,
                                      e.target.value
                                    )}
                                    placeholder="-"
                                  />
                                </td>
                                <td className={cn(
                                  "text-right py-2 px-2 font-medium",
                                  getVarianceColor(item.variance)
                                )}>
                                  {item.variance !== null ? item.variance : '-'}
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
          )}
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-4">
          {loadingHistory ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">Loading saved reports...</p>
              </CardContent>
            </Card>
          ) : savedReports.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center text-muted-foreground">
                  <History className="mx-auto h-12 w-12 mb-4 opacity-50" />
                  <p>No saved reports yet</p>
                  <p className="text-sm mt-2">Generate and save a report to see it here</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {savedReports.map((savedReport) => (
                <Card key={savedReport.id}>
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="font-medium">
                          {format(new Date(savedReport.created_at), 'PPP')} at {format(new Date(savedReport.created_at), 'p')}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Date Range: {format(new Date(savedReport.start_date), 'PP')} - {format(new Date(savedReport.end_date), 'PP')}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Client: {savedReport.companies?.name || 'All Clients'} • 
                          {savedReport.total_products} products • 
                          <span className={savedReport.items_with_variance > 0 ? 'text-red-600' : 'text-green-600'}>
                            {savedReport.items_with_variance} variances
                          </span>
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => loadSavedReport(savedReport)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteSavedReport(savedReport.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Jarde;

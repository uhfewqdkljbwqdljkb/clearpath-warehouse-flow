import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { Download, Eye, FileText, Calendar, Package, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface JardeReportItem {
  product_id: string;
  product_name: string;
  variant_attribute?: string;
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
}

export const ClientJardeReports: React.FC = () => {
  const { profile } = useAuth();
  const [reports, setReports] = useState<SavedReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<SavedReport | null>(null);

  useEffect(() => {
    if (profile?.company_id) {
      fetchReports();
    }
  }, [profile?.company_id]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('jarde_reports')
        .select('*')
        .eq('company_id', profile!.company_id!)
        .order('created_at', { ascending: false });

      if (error) {
        // If company_id filter returns nothing, also try reports with null company_id
        // that include this company in report_data
        console.warn('Direct company filter returned error, trying alternative:', error.message);
      }

      // Also fetch reports where company_id is null (all-client reports) 
      const { data: allClientReports, error: allError } = await supabase
        .from('jarde_reports')
        .select('*')
        .is('company_id', null)
        .order('created_at', { ascending: false });

      const directReports = (data || []).map(item => ({
        ...item,
        report_data: item.report_data as unknown as JardeClientReport[],
      }));

      // Filter all-client reports to only include data for this company
      const filteredAllReports = (allClientReports || [])
        .map(item => {
          const reportData = item.report_data as unknown as JardeClientReport[];
          const companyData = reportData.filter(r => r.company_id === profile!.company_id);
          if (companyData.length === 0) return null;
          return {
            ...item,
            report_data: companyData,
            total_products: companyData.reduce((sum, c) => sum + c.items.length, 0),
            items_with_variance: companyData.reduce((sum, c) =>
              sum + c.items.filter(i => i.variance !== null && i.variance !== 0).length, 0
            ),
          };
        })
        .filter(Boolean) as SavedReport[];

      // Combine and deduplicate by id
      const allReports = [...directReports, ...filteredAllReports];
      const uniqueReports = Array.from(new Map(allReports.map(r => [r.id, r])).values());
      uniqueReports.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setReports(uniqueReports);
    } catch (error) {
      console.error('Error fetching JARDE reports:', error);
      toast({
        title: 'Error',
        description: 'Failed to load JARDE reports',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getVarianceColor = (variance: number | null): string => {
    if (variance === null) return '';
    if (variance === 0) return 'text-green-600';
    if (Math.abs(variance) < 5) return 'text-yellow-600';
    return 'text-red-600';
  };

  const exportToPDF = (report: SavedReport) => {
    try {
      const doc = new jsPDF();

      doc.setFontSize(20);
      doc.text('JARDE - Inventory Reconciliation Report', 14, 20);

      doc.setFontSize(10);
      doc.text(`Date Range: ${format(new Date(report.start_date), 'PP')} - ${format(new Date(report.end_date), 'PP')}`, 14, 30);
      doc.text(`Report Date: ${format(new Date(report.created_at), 'PPpp')}`, 14, 36);

      let yPosition = 45;

      for (const clientReport of report.report_data) {
        if (clientReport.items.length === 0) continue;

        if (yPosition > 250) {
          doc.addPage();
          yPosition = 20;
        }

        doc.setFontSize(14);
        doc.text(`Client: ${clientReport.company_name}`, 14, yPosition);
        yPosition += 8;

        const tableData = clientReport.items.map(item => {
          const displayName = item.variant_value
            ? `    ↳ ${item.variant_value}`
            : item.product_name;

          return [
            displayName,
            item.starting_quantity.toString(),
            item.check_ins.toString(),
            item.check_outs.toString(),
            item.expected_quantity.toString(),
            item.actual_quantity !== null ? item.actual_quantity.toString() : '-',
            item.variance !== null ? item.variance.toString() : '-',
          ];
        });

        autoTable(doc, {
          startY: yPosition,
          head: [['Product', 'Start', 'In', 'Out', 'Expected', 'Actual', 'Variance']],
          body: tableData,
          theme: 'striped',
          styles: { fontSize: 8 },
          headStyles: { fillColor: [59, 130, 246] },
          didParseCell: (data: any) => {
            if (data.column.index === 6 && data.section === 'body') {
              const variance = parseInt(data.cell.text[0], 10);
              if (!isNaN(variance)) {
                if (variance === 0) data.cell.styles.textColor = [34, 197, 94];
                else if (Math.abs(variance) < 5) data.cell.styles.textColor = [234, 179, 8];
                else data.cell.styles.textColor = [239, 68, 68];
              }
            }
          },
        });

        yPosition = (doc as any).lastAutoTable.finalY + 15;
      }

      // Summary
      if (yPosition > 270) {
        doc.addPage();
        yPosition = 20;
      }
      doc.setFontSize(12);
      doc.text('Summary', 14, yPosition);
      yPosition += 7;
      doc.setFontSize(10);
      doc.text(`Total Products: ${report.total_products}`, 14, yPosition);
      yPosition += 6;
      doc.text(`Items with Variance: ${report.items_with_variance}`, 14, yPosition);

      const filename = `JARDE-Report-${format(new Date(report.start_date), 'yyyy-MM-dd')}-to-${format(new Date(report.end_date), 'yyyy-MM-dd')}.pdf`;
      doc.save(filename);

      toast({ title: 'Export Complete', description: 'PDF has been downloaded' });
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast({ title: 'Export Failed', description: 'Failed to generate PDF', variant: 'destructive' });
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-32 bg-muted rounded"></div>
          <div className="h-32 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">JARDE Reports</h1>
        <p className="text-muted-foreground">
          View your inventory reconciliation reports
        </p>
      </div>

      {reports.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No Reports Yet</h3>
              <p className="text-muted-foreground">
                No JARDE reconciliation reports have been created for your company yet.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {reports.map((report) => (
            <Card key={report.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium text-foreground">
                        {format(new Date(report.start_date), 'PP')} — {format(new Date(report.end_date), 'PP')}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Created {format(new Date(report.created_at), 'PPp')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1.5">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{report.total_products}</span>
                        <span className="text-muted-foreground">products</span>
                      </div>
                      {report.items_with_variance > 0 && (
                        <Badge variant="destructive" className="gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          {report.items_with_variance} variance{report.items_with_variance > 1 ? 's' : ''}
                        </Badge>
                      )}
                      {report.items_with_variance === 0 && (
                        <Badge variant="secondary" className="bg-green-100 text-green-700">
                          No variance
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedReport(report)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => exportToPDF(report)}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        PDF
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Report Detail Dialog */}
      <Dialog open={!!selectedReport} onOpenChange={() => setSelectedReport(null)}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              JARDE Report: {selectedReport && format(new Date(selectedReport.start_date), 'PP')} — {selectedReport && format(new Date(selectedReport.end_date), 'PP')}
            </DialogTitle>
          </DialogHeader>

          {selectedReport && (
            <div className="space-y-6">
              {/* Summary stats */}
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-4 pb-4">
                    <div className="text-2xl font-bold">{selectedReport.total_products}</div>
                    <p className="text-sm text-muted-foreground">Products Tracked</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 pb-4">
                    <div className={cn(
                      "text-2xl font-bold",
                      selectedReport.items_with_variance > 0 && "text-destructive"
                    )}>
                      {selectedReport.items_with_variance}
                    </div>
                    <p className="text-sm text-muted-foreground">Items with Variance</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 pb-4">
                    <div className="text-2xl font-bold">
                      {format(new Date(selectedReport.created_at), 'PP')}
                    </div>
                    <p className="text-sm text-muted-foreground">Report Date</p>
                  </CardContent>
                </Card>
              </div>

              {/* Product table */}
              {selectedReport.report_data.map((clientReport) => (
                <div key={clientReport.company_id}>
                  <h3 className="font-semibold text-lg mb-3">{clientReport.company_name}</h3>
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="text-left py-2 px-3 font-medium">Product</th>
                          <th className="text-right py-2 px-3 font-medium">Start</th>
                          <th className="text-right py-2 px-3 font-medium">In</th>
                          <th className="text-right py-2 px-3 font-medium">Out</th>
                          <th className="text-right py-2 px-3 font-medium">Expected</th>
                          <th className="text-right py-2 px-3 font-medium">Actual</th>
                          <th className="text-right py-2 px-3 font-medium">Variance</th>
                        </tr>
                      </thead>
                      <tbody>
                        {clientReport.items.map((item, idx) => (
                          <tr key={idx} className={cn(
                            "border-t",
                            item.variant_value && "bg-muted/20"
                          )}>
                            <td className="py-2 px-3">
                              {item.variant_value ? (
                                <span className="pl-4 text-muted-foreground">↳ {item.variant_value}</span>
                              ) : (
                                <span className="font-medium">{item.product_name}</span>
                              )}
                            </td>
                            <td className="text-right py-2 px-3">{item.starting_quantity}</td>
                            <td className="text-right py-2 px-3 text-green-600">+{item.check_ins}</td>
                            <td className="text-right py-2 px-3 text-red-600">-{item.check_outs}</td>
                            <td className="text-right py-2 px-3 font-medium">{item.expected_quantity}</td>
                            <td className="text-right py-2 px-3">
                              {item.actual_quantity !== null ? item.actual_quantity : '-'}
                            </td>
                            <td className={cn(
                              "text-right py-2 px-3 font-medium",
                              getVarianceColor(item.variance)
                            )}>
                              {item.variance !== null ? item.variance : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}

              <div className="flex justify-end">
                <Button onClick={() => exportToPDF(selectedReport)}>
                  <Download className="h-4 w-4 mr-2" />
                  Export PDF
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClientJardeReports;

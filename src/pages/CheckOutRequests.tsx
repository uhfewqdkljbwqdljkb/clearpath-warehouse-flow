import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Clock, CheckCircle, XCircle, Eye, FileText, Download } from 'lucide-react';
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

interface CheckOutRequest {
  id: string;
  request_number: string;
  status: string;
  requested_items: any;
  notes: string | null;
  created_at: string;
  company_id: string;
  requested_by: string;
  companies?: {
    name: string;
    client_code: string;
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

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('check_out_requests')
        .select(`
          *,
          companies (
            name,
            client_code
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

  const handleApprove = async (request: CheckOutRequest) => {
    setIsProcessing(true);
    try {
      // Update request status
      const { error } = await supabase
        .from('check_out_requests')
        .update({
          status: 'approved',
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', request.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Check-out request approved",
      });

      fetchRequests();
      setIsReviewDialogOpen(false);
      setSelectedRequest(null);
    } catch (error) {
      console.error('Error approving request:', error);
      toast({
        title: "Error",
        description: "Failed to approve check-out request",
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
      const { error } = await supabase
        .from('check_out_requests')
        .update({
          status: 'rejected',
          reviewed_at: new Date().toISOString(),
          rejection_reason: rejectionReason,
        })
        .eq('id', request.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Check-out request rejected",
      });

      fetchRequests();
      setIsReviewDialogOpen(false);
      setSelectedRequest(null);
      setRejectionReason('');
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast({
        title: "Error",
        description: "Failed to reject check-out request",
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

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const requestIds = requests.map(r => r.id);
      setSelectedRequestsForExport(requestIds);
    } else {
      setSelectedRequestsForExport([]);
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
      
      // Add title
      doc.setFontSize(18);
      doc.text('Check-Out Requests Report', 14, 20);
      
      // Add date range if specified
      if (exportStartDate || exportEndDate) {
        doc.setFontSize(10);
        const dateRangeText = `Date Range: ${exportStartDate ? format(exportStartDate, 'PP') : 'All'} - ${exportEndDate ? format(exportEndDate, 'PP') : 'All'}`;
        doc.text(dateRangeText, 14, 28);
      }
      
      let yPosition = exportStartDate || exportEndDate ? 35 : 30;
      
      // Process each request
      for (let i = 0; i < requestsToExport.length; i++) {
        const request = requestsToExport[i];
        
        // Add page break if needed (except for first request)
        if (i > 0) {
          doc.addPage();
          yPosition = 20;
        }
        
        // Request header
        doc.setFontSize(14);
        doc.text(`Request #${request.request_number}`, 14, yPosition);
        yPosition += 7;
        
        // Request details
        doc.setFontSize(10);
        doc.text(`Client: ${request.companies?.name || 'N/A'}`, 14, yPosition);
        yPosition += 5;
        doc.text(`Client Code: ${request.companies?.client_code || 'N/A'}`, 14, yPosition);
        yPosition += 5;
        doc.text(`Status: ${request.status.toUpperCase()}`, 14, yPosition);
        yPosition += 5;
        doc.text(`Submitted: ${new Date(request.created_at).toLocaleDateString()}`, 14, yPosition);
        yPosition += 10;
        
        // Items table
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
        
        yPosition = (doc as any).lastAutoTable.finalY + 10;
        
        // Add notes if present
        if (request.notes) {
          doc.setFontSize(10);
          doc.text('Notes:', 14, yPosition);
          yPosition += 5;
          const splitNotes = doc.splitTextToSize(request.notes, 180);
          doc.text(splitNotes, 14, yPosition);
          yPosition += splitNotes.length * 5 + 5;
        }
        
        // Add rejection reason if present
        if (request.status === 'rejected' && (request as any).rejection_reason) {
          doc.setFontSize(10);
          doc.setTextColor(220, 38, 38);
          doc.text('Rejection Reason:', 14, yPosition);
          yPosition += 5;
          const splitReason = doc.splitTextToSize((request as any).rejection_reason, 180);
          doc.text(splitReason, 14, yPosition);
          doc.setTextColor(0, 0, 0);
        }
      }
      
      // Save the PDF
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
    
    // Filter by date range if specified
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
          <Button onClick={handleExportButtonClick} className="gap-2">
            <Download className="h-4 w-4" />
            Export Report
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pending & Recent Requests</CardTitle>
          <CardDescription>Manage client check-out requests</CardDescription>
        </CardHeader>
        <CardContent>
          {requests.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  {selectionModeActive && (
                    <TableHead className="w-12">
                      <Checkbox
                        checked={requests.length > 0 && requests.every(r => selectedRequestsForExport.includes(r.id))}
                        onCheckedChange={(checked) => handleSelectAll(checked as boolean)}
                        aria-label="Select all"
                      />
                    </TableHead>
                  )}
                  <TableHead>Request #</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((request) => (
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
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openReviewDialog(request)}
                        disabled={request.status !== 'pending'}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Review
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No check-out requests found</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Review Dialog */}
      <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Review Check-Out Request</DialogTitle>
            <DialogDescription>
              {selectedRequest?.request_number} - {selectedRequest?.companies?.name}
            </DialogDescription>
          </DialogHeader>
          
          {selectedRequest && (
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold mb-2">Requested Items</h3>
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
                          </div>
                          <div className="text-right">
                            <div className="font-semibold">Qty: {item.quantity}</div>
                          </div>
                        </div>
                      </Card>
                    ))}
                </div>
              </div>

              {selectedRequest.notes && (
                <div>
                  <h3 className="font-semibold mb-2">Notes</h3>
                  <p className="text-sm text-muted-foreground">{selectedRequest.notes}</p>
                </div>
              )}

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
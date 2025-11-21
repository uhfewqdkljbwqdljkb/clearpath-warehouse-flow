import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Clock, CheckCircle, XCircle, Eye, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
  companies?: {
    name: string;
    client_code: string;
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

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('check_in_requests')
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
      // Insert products into client_products table
      const productsToInsert = request.requested_products.map((product: any) => ({
        company_id: request.company_id,
        name: product.name,
        variants: product.variants || [],
        is_active: true,
      }));

      const { data: insertedProducts, error: insertError } = await supabase
        .from('client_products')
        .insert(productsToInsert)
        .select();

      if (insertError) throw insertError;

      // Get or create products and update inventory
      const productsToProcess = request.was_amended && request.amended_products 
        ? request.amended_products 
        : request.requested_products;

      for (let i = 0; i < productsToProcess.length; i++) {
        const product = productsToProcess[i];
        const insertedProduct = insertedProducts?.[i];

        if (insertedProduct) {
          // Calculate total quantity for products with variants
          let totalQuantity = product.quantity || 0;
          if (product.variants && product.variants.length > 0) {
            totalQuantity = product.variants.reduce((sum: number, variant: any) => 
              sum + variant.values.reduce((vSum: number, val: any) => 
                vSum + (val.quantity || 0), 0
              ), 0
            );
          }

          // Check if inventory item exists for this product
          const { data: existingInventory } = await supabase
            .from('inventory_items')
            .select('id, quantity')
            .eq('product_id', insertedProduct.id)
            .eq('company_id', request.company_id)
            .is('location_id', null)
            .maybeSingle();

          if (existingInventory) {
            // Update existing inventory
            await supabase
              .from('inventory_items')
              .update({ 
                quantity: existingInventory.quantity + totalQuantity,
                last_updated: new Date().toISOString()
              })
              .eq('id', existingInventory.id);
          } else {
            // Create new inventory item
            await supabase
              .from('inventory_items')
              .insert({
                product_id: insertedProduct.id,
                company_id: request.company_id,
                quantity: totalQuantity,
                received_date: new Date().toISOString()
              });
          }
        }
      }

      // Update request status
      const { error: updateError } = await supabase
        .from('check_in_requests')
        .update({
          status: 'approved',
          reviewed_at: new Date().toISOString(),
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
      const { error } = await supabase
        .from('check_in_requests')
        .update({
          status: 'rejected',
          reviewed_at: new Date().toISOString(),
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

  const handleAmendAndApprove = async () => {
    if (!selectedRequest) return;

    try {
      setIsProcessing(true);

      // Insert amended products into client_products
      const productsToInsert = amendedProducts.map((product) => ({
        company_id: selectedRequest.company_id,
        name: product.name,
        variants: product.variants || [],
        is_active: true,
      }));

      const { data: insertedProducts, error: insertError } = await supabase
        .from('client_products')
        .insert(productsToInsert)
        .select();

      if (insertError) throw insertError;

      // Create/update inventory with amended quantities
      for (let i = 0; i < amendedProducts.length; i++) {
        const product = amendedProducts[i];
        const insertedProduct = insertedProducts?.[i];

        if (insertedProduct) {
          // Calculate total quantity for products with variants
          let totalQuantity = product.quantity || 0;
          if (product.variants && product.variants.length > 0) {
            totalQuantity = product.variants.reduce((sum: number, variant: any) => 
              sum + variant.values.reduce((vSum: number, val: any) => 
                vSum + (val.quantity || 0), 0
              ), 0
            );
          }

          // Check if inventory item exists for this product
          const { data: existingInventory } = await supabase
            .from('inventory_items')
            .select('id, quantity')
            .eq('product_id', insertedProduct.id)
            .eq('company_id', selectedRequest.company_id)
            .is('location_id', null)
            .maybeSingle();

          if (existingInventory) {
            // Update existing inventory
            await supabase
              .from('inventory_items')
              .update({ 
                quantity: existingInventory.quantity + totalQuantity,
                last_updated: new Date().toISOString()
              })
              .eq('id', existingInventory.id);
          } else {
            // Create new inventory item
            await supabase
              .from('inventory_items')
              .insert({
                product_id: insertedProduct.id,
                company_id: selectedRequest.company_id,
                quantity: totalQuantity,
                received_date: new Date().toISOString()
              });
          }
        }
      }

      // Update request with amended information
      const { error: updateError } = await supabase
        .from('check_in_requests')
        .update({
          status: 'approved',
          reviewed_at: new Date().toISOString(),
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

  const renderRequestsTable = (requestsList: CheckInRequest[], showActions: boolean = true) => (
    requestsList.length > 0 ? (
      <Table>
        <TableHeader>
          <TableRow>
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Check-In Requests</h1>
        <p className="text-muted-foreground">Review and approve client product check-in requests</p>
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
                        {product.quantity && !product.variants?.length && (
                          <div className="text-sm text-muted-foreground mt-1">
                            Quantity: <span className="font-semibold">{product.quantity}</span>
                          </div>
                        )}
                        {product.variants && Array.isArray(product.variants) && product.variants.length > 0 && (
                          <div className="mt-3 space-y-2">
                            <div className="font-medium text-sm">Variants:</div>
                            {product.variants.map((variant: any, vIndex: number) => (
                              <div key={vIndex} className="ml-4 border-l-2 border-muted pl-3">
                                <div className="font-medium text-sm">{variant.attribute}:</div>
                                <div className="ml-3 mt-1 space-y-1">
                                  {variant.values?.map((val: any, valIndex: number) => (
                                    <div key={valIndex} className="text-sm">
                                      <span className="text-muted-foreground">{val.value}:</span>{' '}
                                      <span className="font-semibold">{val.quantity}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
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
                          {product.quantity && !product.variants?.length && (
                            <div className="text-sm text-muted-foreground mt-1">
                              Quantity: <span className="font-semibold text-primary">{product.quantity}</span>
                            </div>
                          )}
                          {product.variants && Array.isArray(product.variants) && product.variants.length > 0 && (
                            <div className="mt-3 space-y-2">
                              <div className="font-medium text-sm">Variants:</div>
                              {product.variants.map((variant: any, vIndex: number) => (
                                <div key={vIndex} className="ml-4 border-l-2 border-primary/30 pl-3">
                                  <div className="font-medium text-sm">{variant.attribute}:</div>
                                  <div className="ml-3 mt-1 space-y-1">
                                    {variant.values?.map((val: any, valIndex: number) => (
                                      <div key={valIndex} className="text-sm">
                                        <span className="text-muted-foreground">{val.value}:</span>{' '}
                                        <span className="font-semibold text-primary">{val.quantity}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
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
                          <Label>Variants</Label>
                          {product.variants.map((variant: any, variantIdx: number) => (
                            <div
                              key={variantIdx}
                              className="pl-4 space-y-2 border-l-2 border-primary/20"
                            >
                              <p className="text-sm font-medium">{variant.attribute}</p>
                              {variant.values.map((value: any, valueIdx: number) => (
                                <div key={valueIdx} className="flex gap-2 items-center">
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
                                </div>
                              ))}
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
    </div>
  );
};
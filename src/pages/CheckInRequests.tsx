import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Clock, CheckCircle, XCircle, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

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

      const { error: insertError } = await supabase
        .from('client_products')
        .insert(productsToInsert);

      if (insertError) throw insertError;

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
        description: 'Request amended and approved successfully',
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Check-In Requests</h1>
        <p className="text-muted-foreground">Review and approve client product check-in requests</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pending & Recent Requests</CardTitle>
          <CardDescription>Manage client check-in requests</CardDescription>
        </CardHeader>
        <CardContent>
          {requests.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Request #</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Products</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((request) => (
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
                    <TableCell>{getStatusBadge(request.status)}</TableCell>
                    <TableCell>
                      {Array.isArray(request.requested_products)
                        ? `${request.requested_products.length} product(s)`
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
              <p className="text-muted-foreground">No check-in requests found</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Review Dialog */}
      <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Review Check-In Request</DialogTitle>
            <DialogDescription>
              {selectedRequest?.request_number} - {selectedRequest?.companies?.name}
            </DialogDescription>
          </DialogHeader>
          
          {selectedRequest && (
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold mb-2">
                  {selectedRequest.was_amended ? 'Original ' : ''}Requested Products
                </h3>
                <div className="space-y-2">
                  {Array.isArray(selectedRequest.requested_products) &&
                    selectedRequest.requested_products.map((product: any, index: number) => (
                      <Card key={index} className="p-4">
                        <div className="font-medium">{product.name}</div>
                        {product.quantity && !product.variants?.length && (
                          <div className="text-sm text-muted-foreground">
                            Quantity: {product.quantity}
                          </div>
                        )}
                        {product.variants && Array.isArray(product.variants) && product.variants.length > 0 && (
                          <div className="mt-2 text-sm text-muted-foreground">
                            <div className="font-medium">Variants:</div>
                            {product.variants.map((variant: any, vIndex: number) => (
                              <div key={vIndex} className="ml-4">
                                <div>{variant.attribute}:</div>
                                {variant.values?.map((val: any, valIndex: number) => (
                                  <div key={valIndex} className="ml-4">
                                    {val.value} - Qty: {val.quantity}
                                  </div>
                                ))}
                              </div>
                            ))}
                          </div>
                        )}
                      </Card>
                    ))}
                </div>
              </div>

              {selectedRequest.was_amended && selectedRequest.amended_products && (
                <div>
                  <h3 className="font-semibold mb-2 text-primary">
                    Amended Products (Actually Checked In)
                  </h3>
                  <div className="space-y-2">
                    {Array.isArray(selectedRequest.amended_products) &&
                      selectedRequest.amended_products.map((product: any, index: number) => (
                        <Card key={index} className="p-4 border-primary/50 bg-primary/5">
                          <div className="font-medium">{product.name}</div>
                          {product.quantity && !product.variants?.length && (
                            <div className="text-sm text-muted-foreground">
                              Quantity: {product.quantity}
                            </div>
                          )}
                          {product.variants && Array.isArray(product.variants) && product.variants.length > 0 && (
                            <div className="mt-2 text-sm text-muted-foreground">
                              <div className="font-medium">Variants:</div>
                              {product.variants.map((variant: any, vIndex: number) => (
                                <div key={vIndex} className="ml-4">
                                  <div>{variant.attribute}:</div>
                                  {variant.values?.map((val: any, valIndex: number) => (
                                    <div key={valIndex} className="ml-4">
                                      {val.value} - Qty: {val.quantity}
                                    </div>
                                  ))}
                                </div>
                              ))}
                            </div>
                          )}
                        </Card>
                      ))}
                  </div>
                  {selectedRequest.amendment_notes && (
                    <div className="mt-2 p-3 bg-accent rounded-lg">
                      <p className="text-sm font-medium">Amendment Notes:</p>
                      <p className="text-sm text-muted-foreground">
                        {selectedRequest.amendment_notes}
                      </p>
                    </div>
                  )}
                </div>
              )}

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

              {selectedRequest.status === 'pending' && (
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
                    variant="secondary"
                    onClick={() => {
                      openAmendDialog(selectedRequest);
                      setIsReviewDialogOpen(false);
                    }}
                    disabled={isProcessing}
                  >
                    Amend
                  </Button>
                  <Button
                    onClick={() => handleApprove(selectedRequest)}
                    disabled={isProcessing}
                  >
                    {isProcessing ? 'Processing...' : 'Approve'}
                  </Button>
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
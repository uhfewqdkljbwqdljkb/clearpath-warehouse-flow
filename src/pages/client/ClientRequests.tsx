import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Package, PackageOpen, Clock, CheckCircle, XCircle, Eye, Edit, Plus, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CheckInRequest {
  id: string;
  request_number: string;
  status: string;
  requested_products: any;
  amended_products: any;
  notes: string | null;
  created_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  rejection_reason: string | null;
  was_amended: boolean | null;
}

interface CheckOutRequest {
  id: string;
  request_number: string;
  status: string;
  requested_items: any;
  notes: string | null;
  created_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  rejection_reason: string | null;
}

export const ClientRequests: React.FC = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [checkInRequests, setCheckInRequests] = useState<CheckInRequest[]>([]);
  const [checkOutRequests, setCheckOutRequests] = useState<CheckOutRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Check-in dialog state
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<CheckInRequest | null>(null);
  const [productDetails, setProductDetails] = useState<any[]>([]);
  const [editProducts, setEditProducts] = useState<any[]>([]);
  const [editNotes, setEditNotes] = useState('');
  
  // Check-out dialog state
  const [checkOutViewDialogOpen, setCheckOutViewDialogOpen] = useState(false);
  const [checkOutEditDialogOpen, setCheckOutEditDialogOpen] = useState(false);
  const [selectedCheckOutRequest, setSelectedCheckOutRequest] = useState<CheckOutRequest | null>(null);
  const [checkOutItemDetails, setCheckOutItemDetails] = useState<any[]>([]);
  const [editCheckOutItems, setEditCheckOutItems] = useState<any[]>([]);
  const [editCheckOutNotes, setEditCheckOutNotes] = useState('');

  useEffect(() => {
    if (profile?.company_id) {
      fetchRequests();
    }
  }, [profile?.company_id]);

  const fetchRequests = async () => {
    if (!profile?.company_id) return;

    try {
      const [checkInData, checkOutData] = await Promise.all([
        supabase
          .from('check_in_requests')
          .select('*')
          .eq('company_id', profile.company_id)
          .order('created_at', { ascending: false }),
        supabase
          .from('check_out_requests')
          .select('*')
          .eq('company_id', profile.company_id)
          .order('created_at', { ascending: false }),
      ]);

      if (checkInData.error) throw checkInData.error;
      if (checkOutData.error) throw checkOutData.error;

      setCheckInRequests(checkInData.data || []);
      setCheckOutRequests(checkOutData.data || []);
    } catch (error) {
      console.error('Error fetching requests:', error);
      toast({
        title: "Error",
        description: "Failed to load requests",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const isRequestEditable = (request: CheckInRequest) => {
    return (
      request.status === 'pending' &&
      !request.reviewed_by &&
      !request.was_amended
    );
  };

  const isCheckOutEditable = (request: CheckOutRequest) => {
    return request.status === 'pending' && !request.reviewed_by;
  };

  const handleViewDetails = async (request: CheckInRequest) => {
    setSelectedRequest(request);
    
    // Helper to normalize variants into a flat list of { attribute, value, quantity }
    const normalizeProductForDisplay = (product: any) => {
      if (!Array.isArray(product.variants) || product.variants.length === 0) {
        return product;
      }

      const hasNestedValues = product.variants.some(
        (v: any) => Array.isArray(v.values)
      );

      // If variants are stored as { attribute, values: [{ value, quantity }] }
      if (hasNestedValues) {
        const flatVariants = product.variants.flatMap((variant: any) =>
          (variant.values || []).map((val: any) => ({
            attribute: variant.attribute || '',
            value: typeof val === 'string' ? val : val.value ?? '',
            quantity: typeof val === 'object' && val !== null && 'quantity' in val
              ? val.quantity ?? 0
              : 0,
          }))
        );

        return {
          ...product,
          variants: flatVariants,
        };
      }

      // Already in flat format
      return product;
    };
    
    // Fetch product details for display
    const products = request.amended_products || request.requested_products;
    if (Array.isArray(products) && products.length > 0) {
      // Check if products have productId (new format) or name directly (old format)
      const hasProductIds = products.some((p: any) => p.productId);
      
      if (hasProductIds) {
        const productIds = products.map((p: any) => p.productId).filter(Boolean);
        if (productIds.length > 0) {
          const { data } = await supabase
            .from('client_products')
            .select('id, name, sku')
            .in('id', productIds);
          
          if (data) {
            const enrichedProducts = products.map((p: any) => {
              const productInfo = data.find(d => d.id === p.productId);
              return normalizeProductForDisplay({
                ...p,
                productName: productInfo?.name || p.name || 'Unknown Product',
                sku: productInfo?.sku,
              });
            });
            setProductDetails(enrichedProducts);
          }
        }
      } else {
        // Old format - products already have name directly
        const normalized = products.map((p: any) =>
          normalizeProductForDisplay({
            ...p,
            productName: p.name || 'Unknown Product',
          })
        );
        setProductDetails(normalized);
      }
    } else {
      setProductDetails([]);
    }
    
    setViewDialogOpen(true);
  };
  const handleEditRequest = (request: CheckInRequest) => {
    setSelectedRequest(request);
    setEditProducts(JSON.parse(JSON.stringify(request.requested_products || [])));
    setEditNotes(request.notes || '');
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedRequest) return;

    try {
      const { error } = await supabase
        .from('check_in_requests')
        .update({
          requested_products: editProducts,
          notes: editNotes,
        })
        .eq('id', selectedRequest.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Request updated successfully",
      });
      
      setEditDialogOpen(false);
      fetchRequests();
    } catch (error) {
      console.error('Error updating request:', error);
      toast({
        title: "Error",
        description: "Failed to update request",
        variant: "destructive",
      });
    }
  };

  const addProductToEdit = () => {
    setEditProducts([...editProducts, { productId: '', quantity: 0, variants: [] }]);
  };

  const removeProductFromEdit = (index: number) => {
    setEditProducts(editProducts.filter((_, i) => i !== index));
  };

  const updateEditProduct = (index: number, field: string, value: any) => {
    const updated = [...editProducts];
    updated[index] = { ...updated[index], [field]: value };
    setEditProducts(updated);
  };

  const addVariantToEditProduct = (productIndex: number) => {
    const updated = [...editProducts];
    const variants = updated[productIndex].variants || [];
    updated[productIndex].variants = [...variants, { attribute: '', value: '', quantity: 0 }];
    setEditProducts(updated);
  };

  const removeVariantFromEditProduct = (productIndex: number, variantIndex: number) => {
    const updated = [...editProducts];
    updated[productIndex].variants = updated[productIndex].variants.filter((_: any, i: number) => i !== variantIndex);
    setEditProducts(updated);
  };

  const updateEditVariant = (productIndex: number, variantIndex: number, field: string, value: any) => {
    const updated = [...editProducts];
    const variants = [...updated[productIndex].variants];
    variants[variantIndex] = { ...variants[variantIndex], [field]: value };
    updated[productIndex].variants = variants;
    setEditProducts(updated);
  };

  // Check-out handlers
  const handleViewCheckOutDetails = async (request: CheckOutRequest) => {
    setSelectedCheckOutRequest(request);
    
    const normalizeItemForDisplay = (item: any) => {
      if (!item.variant_attribute) return item;
      return {
        ...item,
        variants: item.variant_attribute ? [{ attribute: item.variant_attribute, value: item.variant_value, quantity: item.quantity }] : [],
      };
    };
    
    const items = request.requested_items;
    if (Array.isArray(items) && items.length > 0) {
      // Check-out items use product_id (snake_case)
      const productIds = items.map((i: any) => i.product_id).filter(Boolean);
      if (productIds.length > 0) {
        const { data } = await supabase
          .from('client_products')
          .select('id, name, sku')
          .in('id', productIds);
        
        if (data) {
          const enrichedItems = items.map((item: any) => {
            const productInfo = data.find(d => d.id === item.product_id);
            return normalizeItemForDisplay({
              ...item,
              productName: productInfo?.name || item.product_name || 'Unknown Product',
              sku: productInfo?.sku,
            });
          });
          setCheckOutItemDetails(enrichedItems);
        }
      } else {
        setCheckOutItemDetails(items.map((i: any) => normalizeItemForDisplay({ ...i, productName: i.product_name || 'Unknown Product' })));
      }
    } else {
      setCheckOutItemDetails([]);
    }
    
    setCheckOutViewDialogOpen(true);
  };

  const handleEditCheckOutRequest = (request: CheckOutRequest) => {
    setSelectedCheckOutRequest(request);
    setEditCheckOutItems(JSON.parse(JSON.stringify(request.requested_items || [])));
    setEditCheckOutNotes(request.notes || '');
    setCheckOutEditDialogOpen(true);
  };

  const handleSaveCheckOutEdit = async () => {
    if (!selectedCheckOutRequest) return;

    try {
      const { error } = await supabase
        .from('check_out_requests')
        .update({
          requested_items: editCheckOutItems,
          notes: editCheckOutNotes,
        })
        .eq('id', selectedCheckOutRequest.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Check-out request updated successfully",
      });
      
      setCheckOutEditDialogOpen(false);
      fetchRequests();
    } catch (error) {
      console.error('Error updating check-out request:', error);
      toast({
        title: "Error",
        description: "Failed to update request",
        variant: "destructive",
      });
    }
  };

  const addCheckOutItemToEdit = () => {
    setEditCheckOutItems([...editCheckOutItems, { productId: '', quantity: 0, variant: '', variantValue: '' }]);
  };

  const removeCheckOutItemFromEdit = (index: number) => {
    setEditCheckOutItems(editCheckOutItems.filter((_, i) => i !== index));
  };

  const updateEditCheckOutItem = (index: number, field: string, value: any) => {
    const updated = [...editCheckOutItems];
    updated[index] = { ...updated[index], [field]: value };
    setEditCheckOutItems(updated);
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
        <h1 className="text-3xl font-bold text-foreground">My Requests</h1>
        <p className="text-muted-foreground">View and track your check-in and check-out requests</p>
      </div>

      <Tabs defaultValue="check-in" className="space-y-4">
        <TabsList>
          <TabsTrigger value="check-in">
            <Package className="h-4 w-4 mr-2" />
            Check-In Requests
          </TabsTrigger>
          <TabsTrigger value="check-out">
            <PackageOpen className="h-4 w-4 mr-2" />
            Check-Out Requests
          </TabsTrigger>
        </TabsList>

        <TabsContent value="check-in">
          <Card>
            <CardHeader>
              <CardTitle>Check-In Requests</CardTitle>
              <CardDescription>Requests to add products to your inventory</CardDescription>
            </CardHeader>
            <CardContent>
              {checkInRequests.length > 0 ? (
                  <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Request #</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Products</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead>Notes</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {checkInRequests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell className="font-mono text-sm">
                          {request.request_number}
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
                        <TableCell className="max-w-xs truncate">
                          {request.status === 'rejected' && request.rejection_reason ? (
                            <span className="text-red-600">{request.rejection_reason}</span>
                          ) : (
                            request.notes || '-'
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewDetails(request)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                            {isRequestEditable(request) && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditRequest(request)}
                              >
                                <Edit className="h-4 w-4 mr-1" />
                                Edit
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-12">
                  <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No check-in requests found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="check-out">
          <Card>
            <CardHeader>
              <CardTitle>Check-Out Requests</CardTitle>
              <CardDescription>Requests to remove products from your inventory</CardDescription>
            </CardHeader>
            <CardContent>
              {checkOutRequests.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Request #</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead>Notes</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {checkOutRequests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell className="font-mono text-sm">
                          {request.request_number}
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
                        <TableCell className="max-w-xs truncate">
                          {request.status === 'rejected' && request.rejection_reason ? (
                            <span className="text-red-600">{request.rejection_reason}</span>
                          ) : (
                            request.notes || '-'
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewCheckOutDetails(request)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                            {isCheckOutEditable(request) && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditCheckOutRequest(request)}
                              >
                                <Edit className="h-4 w-4 mr-1" />
                                Edit
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-12">
                  <PackageOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No check-out requests found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* View Details Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Request Details</DialogTitle>
            <DialogDescription>
              {selectedRequest?.request_number} - {selectedRequest && getStatusBadge(selectedRequest.status)}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-semibold">Submitted Date</Label>
              <p className="text-sm text-muted-foreground">
                {selectedRequest && new Date(selectedRequest.created_at).toLocaleString()}
              </p>
            </div>

            {selectedRequest?.notes && (
              <div>
                <Label className="text-sm font-semibold">Notes</Label>
                <p className="text-sm text-muted-foreground">{selectedRequest.notes}</p>
              </div>
            )}

            {selectedRequest?.rejection_reason && (
              <div>
                <Label className="text-sm font-semibold text-red-600">Rejection Reason</Label>
                <p className="text-sm text-red-600">{selectedRequest.rejection_reason}</p>
              </div>
            )}

            <div>
              <Label className="text-sm font-semibold mb-2 block">Products</Label>
              <div className="space-y-3">
                {productDetails.map((product, idx) => (
                  <Card key={idx}>
                    <CardContent className="pt-4">
                      <div className="space-y-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">{product.productName}</p>
                            {product.sku && (
                              <p className="text-xs text-muted-foreground font-mono">{product.sku}</p>
                            )}
                          </div>
                          {!product.variants?.length && (
                            <Badge variant="secondary">Qty: {product.quantity}</Badge>
                          )}
                        </div>
                        
                        {product.variants && product.variants.length > 0 && (
                          <div className="pl-4 border-l-2 border-border space-y-1">
                            <p className="text-xs font-semibold text-muted-foreground">Variants:</p>
                            {product.variants.map((variant: any, vIdx: number) => (
                              <div key={vIdx} className="flex justify-between text-sm">
                                <span className="text-muted-foreground">
                                  {variant.attribute}: <span className="font-medium text-foreground">{variant.value}</span>
                                </span>
                                <Badge variant="secondary" className="ml-2">Qty: {variant.quantity}</Badge>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Request Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Request</DialogTitle>
            <DialogDescription>
              {selectedRequest?.request_number} - Modify products and notes
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>Notes</Label>
              <Textarea
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                placeholder="Add any notes for this request"
                rows={3}
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <Label className="text-sm font-semibold">Products</Label>
                <Button onClick={addProductToEdit} size="sm" variant="outline">
                  <Plus className="h-4 w-4 mr-1" />
                  Add Product
                </Button>
              </div>

              <div className="space-y-4">
                {editProducts.map((product, pIdx) => (
                  <Card key={pIdx}>
                    <CardContent className="pt-4 space-y-3">
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <Label className="text-xs">Product ID</Label>
                          <Input
                            value={product.productId}
                            onChange={(e) => updateEditProduct(pIdx, 'productId', e.target.value)}
                            placeholder="Product ID"
                          />
                        </div>
                        <div className="w-24">
                          <Label className="text-xs">Quantity</Label>
                          <Input
                            type="number"
                            value={product.quantity}
                            onChange={(e) => updateEditProduct(pIdx, 'quantity', parseInt(e.target.value) || 0)}
                          />
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeProductFromEdit(pIdx)}
                          className="mt-5"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>

                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <Label className="text-xs">Variants</Label>
                          <Button
                            onClick={() => addVariantToEditProduct(pIdx)}
                            size="sm"
                            variant="ghost"
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Add Variant
                          </Button>
                        </div>

                        {product.variants?.map((variant: any, vIdx: number) => (
                          <div key={vIdx} className="flex gap-2 mb-2 pl-4">
                            <div className="flex-1">
                              <Input
                                value={variant.attribute}
                                onChange={(e) => updateEditVariant(pIdx, vIdx, 'attribute', e.target.value)}
                                placeholder="Attribute (e.g., Color)"
                                className="text-xs"
                              />
                            </div>
                            <div className="flex-1">
                              <Input
                                value={variant.value}
                                onChange={(e) => updateEditVariant(pIdx, vIdx, 'value', e.target.value)}
                                placeholder="Value (e.g., Red)"
                                className="text-xs"
                              />
                            </div>
                            <div className="w-20">
                              <Input
                                type="number"
                                value={variant.quantity}
                                onChange={(e) => updateEditVariant(pIdx, vIdx, 'quantity', parseInt(e.target.value) || 0)}
                                className="text-xs"
                              />
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeVariantFromEditProduct(pIdx, vIdx)}
                            >
                              <Trash2 className="h-3 w-3 text-destructive" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveEdit}>
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Check-Out View Details Dialog */}
      <Dialog open={checkOutViewDialogOpen} onOpenChange={setCheckOutViewDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Check-Out Request Details</DialogTitle>
            <DialogDescription>
              {selectedCheckOutRequest?.request_number} - {selectedCheckOutRequest && getStatusBadge(selectedCheckOutRequest.status)}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-semibold">Submitted Date</Label>
              <p className="text-sm text-muted-foreground">
                {selectedCheckOutRequest && new Date(selectedCheckOutRequest.created_at).toLocaleString()}
              </p>
            </div>

            {selectedCheckOutRequest?.notes && (
              <div>
                <Label className="text-sm font-semibold">Notes</Label>
                <p className="text-sm text-muted-foreground">{selectedCheckOutRequest.notes}</p>
              </div>
            )}

            {selectedCheckOutRequest?.rejection_reason && (
              <div>
                <Label className="text-sm font-semibold text-red-600">Rejection Reason</Label>
                <p className="text-sm text-red-600">{selectedCheckOutRequest.rejection_reason}</p>
              </div>
            )}

            <div>
              <Label className="text-sm font-semibold mb-2 block">Items to Check Out</Label>
              <div className="space-y-3">
                {checkOutItemDetails.map((item, idx) => (
                  <Card key={idx}>
                    <CardContent className="pt-4">
                      <div className="space-y-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">{item.productName}</p>
                            {item.sku && (
                              <p className="text-xs text-muted-foreground font-mono">{item.sku}</p>
                            )}
                          </div>
                          <Badge variant="secondary">Qty: {item.quantity}</Badge>
                        </div>
                        
                        {item.variant && (
                          <div className="pl-4 border-l-2 border-border space-y-1">
                            <p className="text-xs font-semibold text-muted-foreground">Variant:</p>
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">
                                {item.variant}: <span className="font-medium text-foreground">{item.variantValue}</span>
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Check-Out Edit Request Dialog */}
      <Dialog open={checkOutEditDialogOpen} onOpenChange={setCheckOutEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Check-Out Request</DialogTitle>
            <DialogDescription>
              {selectedCheckOutRequest?.request_number} - Modify items and notes
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>Notes</Label>
              <Textarea
                value={editCheckOutNotes}
                onChange={(e) => setEditCheckOutNotes(e.target.value)}
                placeholder="Add any notes for this request"
                rows={3}
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <Label className="text-sm font-semibold">Items</Label>
                <Button onClick={addCheckOutItemToEdit} size="sm" variant="outline">
                  <Plus className="h-4 w-4 mr-1" />
                  Add Item
                </Button>
              </div>

              <div className="space-y-4">
                {editCheckOutItems.map((item, idx) => (
                  <Card key={idx}>
                    <CardContent className="pt-4 space-y-3">
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <Label className="text-xs">Product ID</Label>
                          <Input
                            value={item.productId}
                            onChange={(e) => updateEditCheckOutItem(idx, 'productId', e.target.value)}
                            placeholder="Product ID"
                          />
                        </div>
                        <div className="w-24">
                          <Label className="text-xs">Quantity</Label>
                          <Input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateEditCheckOutItem(idx, 'quantity', parseInt(e.target.value) || 0)}
                          />
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeCheckOutItemFromEdit(idx)}
                          className="mt-5"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>

                      <div className="flex gap-2">
                        <div className="flex-1">
                          <Label className="text-xs">Variant Attribute (optional)</Label>
                          <Input
                            value={item.variant || ''}
                            onChange={(e) => updateEditCheckOutItem(idx, 'variant', e.target.value)}
                            placeholder="e.g., Size"
                          />
                        </div>
                        <div className="flex-1">
                          <Label className="text-xs">Variant Value</Label>
                          <Input
                            value={item.variantValue || ''}
                            onChange={(e) => updateEditCheckOutItem(idx, 'variantValue', e.target.value)}
                            placeholder="e.g., Large"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setCheckOutEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveCheckOutEdit}>
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
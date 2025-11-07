import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Package, Plus, X } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Product {
  id: string;
  name: string;
  sku: string | null;
  variants: any;
}

interface CheckOutItem {
  product_id: string;
  product_name: string;
  variant_attribute?: string;
  variant_value?: string;
  quantity: number;
}

export const ClientCheckOut: React.FC = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [checkOutItems, setCheckOutItems] = useState<CheckOutItem[]>([]);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (profile?.company_id) {
      fetchProducts();
    }
  }, [profile?.company_id]);

  const fetchProducts = async () => {
    if (!profile?.company_id) return;

    try {
      const { data, error } = await supabase
        .from('client_products')
        .select('*')
        .eq('company_id', profile.company_id)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast({
        title: "Error",
        description: "Failed to load products",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addCheckOutItem = () => {
    setCheckOutItems([
      ...checkOutItems,
      {
        product_id: '',
        product_name: '',
        quantity: 0,
      },
    ]);
  };

  const removeCheckOutItem = (index: number) => {
    setCheckOutItems(checkOutItems.filter((_, i) => i !== index));
  };

  const updateCheckOutItem = (index: number, field: string, value: any) => {
    const updated = [...checkOutItems];
    
    if (field === 'product_id') {
      const product = products.find(p => p.id === value);
      if (product) {
        updated[index] = {
          ...updated[index],
          product_id: value,
          product_name: product.name,
          variant_attribute: undefined,
          variant_value: undefined,
        };
      }
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }
    
    setCheckOutItems(updated);
  };

  const getProductVariants = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product || !product.variants || !Array.isArray(product.variants)) return [];
    return product.variants;
  };

  const handleSubmit = async () => {
    if (checkOutItems.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one item to check out",
        variant: "destructive",
      });
      return;
    }

    const hasInvalidItems = checkOutItems.some(
      item => !item.product_id || item.quantity <= 0
    );

    if (hasInvalidItems) {
      toast({
        title: "Error",
        description: "Please fill in all required fields and ensure quantities are greater than 0",
        variant: "destructive",
      });
      return;
    }

    if (!profile?.company_id) return;

    setIsSubmitting(true);
    try {
      // Generate request number
      const { data: requestNumber, error: fnError } = await supabase
        .rpc('generate_check_out_request_number');

      if (fnError) throw fnError;

      // Create check-out request
      const { error } = await supabase
        .from('check_out_requests')
        .insert([{
          company_id: profile.company_id,
          request_number: requestNumber,
          requested_items: checkOutItems as any,
          notes: notes || null,
          requested_by: profile.id,
          status: 'pending'
        }]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Check-out request submitted successfully",
      });

      navigate('/client/requests');
    } catch (error) {
      console.error('Error submitting check-out request:', error);
      toast({
        title: "Error",
        description: "Failed to submit check-out request",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate('/client/products')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Products
        </Button>
      </div>

      <div>
        <h1 className="text-3xl font-bold text-foreground">Check Out Products</h1>
        <p className="text-muted-foreground">Submit a request to remove products from your inventory</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select Products</CardTitle>
          <CardDescription>Choose products and quantities to check out</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Button onClick={addCheckOutItem}>
            <Plus className="h-4 w-4 mr-2" />
            Add Item
          </Button>

          {checkOutItems.length === 0 ? (
            <div className="text-center py-12">
              <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No items added yet. Click "Add Item" to get started.</p>
            </div>
          ) : (
            checkOutItems.map((item, index) => (
              <Card key={index} className="border-2">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                  <CardTitle className="text-base">Item {index + 1}</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeCheckOutItem(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Product *</Label>
                    <Select
                      value={item.product_id}
                      onValueChange={(value) => updateCheckOutItem(index, 'product_id', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a product" />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map((product) => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.name} {product.sku && `(${product.sku})`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {item.product_id && getProductVariants(item.product_id).length > 0 && (
                    <div className="space-y-2">
                      <Label>Variant</Label>
                      <Select
                        value={item.variant_value || ''}
                        onValueChange={(value) => {
                          const variants = getProductVariants(item.product_id);
                          const selectedVariant = variants.find((v: any) =>
                            v.values?.some((val: any) => val.value === value)
                          );
                          if (selectedVariant) {
                            updateCheckOutItem(index, 'variant_attribute', selectedVariant.attribute);
                            updateCheckOutItem(index, 'variant_value', value);
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a variant" />
                        </SelectTrigger>
                        <SelectContent>
                          {getProductVariants(item.product_id).map((variant: any) =>
                            variant.values?.map((val: any) => (
                              <SelectItem key={val.value} value={val.value}>
                                {variant.attribute}: {val.value}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Quantity *</Label>
                    <Input
                      type="number"
                      min="1"
                      placeholder="Enter quantity"
                      value={item.quantity || ''}
                      onChange={(e) =>
                        updateCheckOutItem(index, 'quantity', parseInt(e.target.value) || 0)
                      }
                    />
                  </div>
                </CardContent>
              </Card>
            ))
          )}

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any additional notes or special instructions..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => navigate('/client/products')}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit Check-Out Request'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
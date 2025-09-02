import React, { useEffect, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

const orderItemSchema = z.object({
  client_product_id: z.string().min(1, 'Product is required'),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  notes: z.string().optional(),
});

const orderSchema = z.object({
  order_type: z.enum(['receive', 'ship']),
  requested_date: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(orderItemSchema).min(1, 'At least one item is required'),
});

type OrderFormData = z.infer<typeof orderSchema>;

interface ClientProduct {
  id: string;
  sku: string;
  name: string;
  unit_value?: number;
}

interface ClientOrderFormProps {
  onSubmit: () => void;
  onCancel: () => void;
}

export const ClientOrderForm: React.FC<ClientOrderFormProps> = ({
  onSubmit,
  onCancel,
}) => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [products, setProducts] = useState<ClientProduct[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<OrderFormData>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      order_type: 'receive',
      requested_date: '',
      notes: '',
      items: [{ client_product_id: '', quantity: 1, notes: '' }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  });

  useEffect(() => {
    const fetchProducts = async () => {
      if (!profile?.company_id) return;

      try {
        const { data, error } = await supabase
          .from('client_products')
          .select('id, sku, name, unit_value')
          .eq('company_id', profile.company_id)
          .eq('is_active', true)
          .order('name');

        if (error) throw error;
        setProducts(data || []);
      } catch (error) {
        console.error('Error fetching products:', error);
      }
    };

    fetchProducts();
  }, [profile?.company_id]);

  const generateOrderNumber = () => {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
    return `ORD-${timestamp}-${random}`;
  };

  const handleSubmit = async (data: OrderFormData) => {
    if (!profile?.company_id || !profile?.user_id) return;

    setIsSubmitting(true);

    try {
      // Create the order
      const orderNumber = generateOrderNumber();
      const { data: orderData, error: orderError } = await supabase
        .from('client_orders')
        .insert([{
          company_id: profile.company_id,
          order_number: orderNumber,
          order_type: data.order_type,
          requested_date: data.requested_date || null,
          notes: data.notes || null,
          created_by: profile.user_id,
        }])
        .select()
        .single();

      if (orderError) throw orderError;

      // Create the order items
      const orderItems = data.items.map(item => ({
        order_id: orderData.id,
        client_product_id: item.client_product_id,
        quantity: item.quantity,
        notes: item.notes || null,
      }));

      const { error: itemsError } = await supabase
        .from('client_order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      toast({
        title: "Success",
        description: `Order ${orderNumber} created successfully`,
      });

      onSubmit();
    } catch (error: any) {
      console.error('Error creating order:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create order",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getProductById = (productId: string) => {
    return products.find(p => p.id === productId);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Create New Order</h1>
        <p className="text-muted-foreground">
          Submit a new warehouse order request
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Order Details</CardTitle>
          <CardDescription>
            Fill in the order information and select products
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="order_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Order Type *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select order type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="receive">Receive Inventory</SelectItem>
                          <SelectItem value="ship">Ship Inventory</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="requested_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Requested Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Order Notes</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Add any special instructions or notes" 
                        rows={3}
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Order Items</h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => append({ client_product_id: '', quantity: 1, notes: '' })}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Item
                  </Button>
                </div>

                {fields.map((field, index) => (
                  <Card key={field.id} className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                      <FormField
                        control={form.control}
                        name={`items.${index}.client_product_id`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Product *</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select product" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {products.map((product) => (
                                  <SelectItem key={product.id} value={product.id}>
                                    <div>
                                      <div className="font-medium">{product.name}</div>
                                      <div className="text-sm text-muted-foreground">
                                        SKU: {product.sku}
                                        {product.unit_value && ` • $${product.unit_value}`}
                                      </div>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`items.${index}.quantity`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Quantity *</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                min="1"
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`items.${index}.notes`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Item Notes</FormLabel>
                            <FormControl>
                              <Input placeholder="Optional notes" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex items-center space-x-2">
                        {fields.length > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => remove(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>

                    {form.watch(`items.${index}.client_product_id`) && (
                      <div className="mt-3 pt-3 border-t">
                        {(() => {
                          const product = getProductById(form.watch(`items.${index}.client_product_id`));
                          const quantity = form.watch(`items.${index}.quantity`) || 0;
                          return product ? (
                            <div className="flex items-center space-x-4 text-sm">
                              <Badge variant="outline">{product.sku}</Badge>
                              {product.unit_value && (
                                <span className="text-muted-foreground">
                                  Unit Value: ${product.unit_value} • 
                                  Total: ${(product.unit_value * quantity).toFixed(2)}
                                </span>
                              )}
                            </div>
                          ) : null;
                        })()}
                      </div>
                    )}
                  </Card>
                ))}
              </div>

              <div className="flex justify-end space-x-4">
                <Button type="button" variant="outline" onClick={onCancel}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Creating Order...' : 'Create Order'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};
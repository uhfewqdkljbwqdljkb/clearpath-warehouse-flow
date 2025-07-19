import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { mockClients, generateInternalBarcode, calculateCubicFeet } from '@/data/mockData';
import { ClientProduct } from '@/types';

const productSchema = z.object({
  client_id: z.string().min(1, 'Client is required'),
  sku: z.string().min(1, 'SKU is required'),
  product_name: z.string().min(1, 'Product name is required'),
  description: z.string().min(1, 'Description is required'),
  category: z.string().min(1, 'Category is required'),
  dimensions_length: z.number().min(0.1, 'Length must be greater than 0'),
  dimensions_width: z.number().min(0.1, 'Width must be greater than 0'),
  dimensions_height: z.number().min(0.1, 'Height must be greater than 0'),
  weight_lbs: z.number().min(0, 'Weight cannot be negative'),
  storage_requirements: z.enum(['ambient', 'refrigerated', 'fragile', 'hazardous']),
  product_barcode: z.string().min(1, 'Product barcode is required'),
  internal_barcode: z.string().min(1, 'Internal barcode is required'),
  reorder_level: z.number().min(0, 'Reorder level cannot be negative'),
  cost_per_unit: z.number().min(0, 'Cost cannot be negative'),
  cubic_feet: z.number().min(0, 'Cubic feet cannot be negative'),
  is_active: z.boolean(),
});

type ProductFormData = z.infer<typeof productSchema>;

interface ProductFormProps {
  product?: ClientProduct | null;
  onSubmit: (data: Omit<ClientProduct, 'id' | 'created_at' | 'updated_at'>) => void;
  onCancel: () => void;
}

export const ProductForm: React.FC<ProductFormProps> = ({ product, onSubmit, onCancel }) => {
  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: product ? {
      client_id: product.client_id,
      sku: product.sku,
      product_name: product.product_name,
      description: product.description,
      category: product.category,
      dimensions_length: product.dimensions_length,
      dimensions_width: product.dimensions_width,
      dimensions_height: product.dimensions_height,
      weight_lbs: product.weight_lbs,
      storage_requirements: product.storage_requirements,
      product_barcode: product.product_barcode,
      internal_barcode: product.internal_barcode,
      reorder_level: product.reorder_level,
      cost_per_unit: product.cost_per_unit,
      cubic_feet: product.cubic_feet,
      is_active: product.is_active,
    } : {
      client_id: '',
      sku: '',
      product_name: '',
      description: '',
      category: '',
      dimensions_length: 0,
      dimensions_width: 0,
      dimensions_height: 0,
      weight_lbs: 0,
      storage_requirements: 'ambient',
      product_barcode: '',
      internal_barcode: '',
      reorder_level: 0,
      cost_per_unit: 0,
      cubic_feet: 0,
      is_active: true,
    },
  });

  const watchedValues = form.watch(['client_id', 'sku', 'dimensions_length', 'dimensions_width', 'dimensions_height']);

  // Auto-generate internal barcode when client or SKU changes
  useEffect(() => {
    const [clientId, sku] = watchedValues;
    if (clientId && sku) {
      const client = mockClients.find(c => c.id === clientId);
      if (client) {
        const internalBarcode = generateInternalBarcode(client.client_code, sku);
        form.setValue('internal_barcode', internalBarcode);
      }
    }
  }, [watchedValues[0], watchedValues[1], form]);

  // Auto-calculate cubic feet when dimensions change
  useEffect(() => {
    const [, , length, width, height] = watchedValues;
    if (length > 0 && width > 0 && height > 0) {
      const cubicFeet = calculateCubicFeet(length, width, height);
      form.setValue('cubic_feet', cubicFeet);
    }
  }, [watchedValues[2], watchedValues[3], watchedValues[4], form]);

  const handleSubmit = (data: ProductFormData) => {
    onSubmit(data as Omit<ClientProduct, 'id' | 'created_at' | 'updated_at'>);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="client_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Client</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select client" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {mockClients.filter(c => c.is_active).map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.company_name} ({client.client_code})
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
            name="sku"
            render={({ field }) => (
              <FormItem>
                <FormLabel>SKU</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="TS-WH001" />
                </FormControl>
                <FormDescription>Client's internal SKU</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="product_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Product Name</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Wireless Headphones" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Electronics" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea {...field} placeholder="Product description..." />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="dimensions_length"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Length (inches)</FormLabel>
                <FormControl>
                  <Input 
                    {...field} 
                    type="number" 
                    step="0.1"
                    onChange={(e) => field.onChange(Number(e.target.value))}
                    placeholder="8.0" 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="dimensions_width"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Width (inches)</FormLabel>
                <FormControl>
                  <Input 
                    {...field} 
                    type="number" 
                    step="0.1"
                    onChange={(e) => field.onChange(Number(e.target.value))}
                    placeholder="6.0" 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="dimensions_height"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Height (inches)</FormLabel>
                <FormControl>
                  <Input 
                    {...field} 
                    type="number" 
                    step="0.1"
                    onChange={(e) => field.onChange(Number(e.target.value))}
                    placeholder="3.0" 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="weight_lbs"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Weight (lbs)</FormLabel>
                <FormControl>
                  <Input 
                    {...field} 
                    type="number" 
                    step="0.1"
                    onChange={(e) => field.onChange(Number(e.target.value))}
                    placeholder="1.2" 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="cubic_feet"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cubic Feet</FormLabel>
                <FormControl>
                  <Input 
                    {...field} 
                    type="number" 
                    step="0.001"
                    readOnly
                    onChange={(e) => field.onChange(Number(e.target.value))}
                    placeholder="Auto-calculated" 
                  />
                </FormControl>
                <FormDescription>Calculated from dimensions</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="storage_requirements"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Storage Requirements</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select storage type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="ambient">Ambient Temperature</SelectItem>
                    <SelectItem value="refrigerated">Refrigerated</SelectItem>
                    <SelectItem value="fragile">Fragile</SelectItem>
                    <SelectItem value="hazardous">Hazardous</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="reorder_level"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Reorder Level</FormLabel>
                <FormControl>
                  <Input 
                    {...field} 
                    type="number" 
                    onChange={(e) => field.onChange(Number(e.target.value))}
                    placeholder="10" 
                  />
                </FormControl>
                <FormDescription>Minimum stock level for alerts</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="product_barcode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Client Barcode</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="123456789012" />
                </FormControl>
                <FormDescription>Client's product barcode</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="internal_barcode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Internal Barcode</FormLabel>
                <FormControl>
                  <Input {...field} readOnly placeholder="Auto-generated" />
                </FormControl>
                <FormDescription>Warehouse internal barcode</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="cost_per_unit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cost per Unit ($)</FormLabel>
                <FormControl>
                  <Input 
                    {...field} 
                    type="number" 
                    step="0.01"
                    onChange={(e) => field.onChange(Number(e.target.value))}
                    placeholder="89.99" 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="is_active"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Active Product</FormLabel>
                <FormDescription>
                  Enable or disable this product in the catalog
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">
            {product ? 'Update Product' : 'Add Product'}
          </Button>
        </div>
      </form>
    </Form>
  );
};
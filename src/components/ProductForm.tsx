import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { X, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Variant {
  attribute: string;
  values: { value: string; quantity: number }[];
}

interface ProductFormData {
  company_id: string;
  sku: string;
  name: string;
  description?: string;
  category?: string;
  storage_requirements?: string;
  variants?: Variant[];
}

interface ProductFormProps {
  clients: Array<{ id: string; name: string; client_code: string }>;
  onSuccess: () => void;
  onCancel: () => void;
}

export const ProductForm: React.FC<ProductFormProps> = ({ clients, onSuccess, onCancel }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState<ProductFormData>({
    company_id: '',
    sku: '',
    name: '',
    description: '',
    category: '',
    storage_requirements: 'ambient',
    variants: [],
  });

  const addVariant = () => {
    setFormData({
      ...formData,
      variants: [
        ...(formData.variants || []),
        { attribute: '', values: [{ value: '', quantity: 0 }] },
      ],
    });
  };

  const removeVariant = (variantIndex: number) => {
    setFormData({
      ...formData,
      variants: formData.variants?.filter((_, i) => i !== variantIndex) || [],
    });
  };

  const updateVariant = (variantIndex: number, field: string, value: any) => {
    const updated = [...(formData.variants || [])];
    updated[variantIndex] = { ...updated[variantIndex], [field]: value };
    setFormData({ ...formData, variants: updated });
  };

  const addValueToVariant = (variantIndex: number) => {
    const updated = [...(formData.variants || [])];
    updated[variantIndex].values.push({ value: '', quantity: 0 });
    setFormData({ ...formData, variants: updated });
  };

  const removeValueFromVariant = (variantIndex: number, valueIndex: number) => {
    const updated = [...(formData.variants || [])];
    updated[variantIndex].values = updated[variantIndex].values.filter(
      (_, i) => i !== valueIndex
    );
    setFormData({ ...formData, variants: updated });
  };

  const updateVariantValue = (
    variantIndex: number,
    valueIndex: number,
    field: string,
    value: any
  ) => {
    const updated = [...(formData.variants || [])];
    updated[variantIndex].values[valueIndex] = {
      ...updated[variantIndex].values[valueIndex],
      [field]: value,
    };
    setFormData({ ...formData, variants: updated });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.company_id || !formData.sku || !formData.name) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const productData = {
        company_id: formData.company_id,
        sku: formData.sku,
        name: formData.name,
        description: formData.description,
        category: formData.category,
        storage_requirements: formData.storage_requirements,
        variants: (formData.variants || []) as any,
        is_active: true,
      };

      const { error } = await supabase
        .from('client_products')
        .insert([productData]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Product added successfully",
      });
      
      onSuccess();
    } catch (error: any) {
      console.error('Error adding product:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add product",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Add New Product</CardTitle>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="company_id">Client *</Label>
            <Select 
              value={formData.company_id} 
              onValueChange={(value) => setFormData({ ...formData, company_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a client" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name} ({client.client_code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="sku">SKU *</Label>
              <Input
                id="sku"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                placeholder="e.g., PROD-001"
                required
              />
            </div>

            <div>
              <Label htmlFor="name">Product Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Wireless Headphones"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Product description..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="e.g., Electronics"
              />
            </div>

            <div>
              <Label htmlFor="storage_requirements">Storage Requirements</Label>
              <Select
                value={formData.storage_requirements}
                onValueChange={(value) =>
                  setFormData({ ...formData, storage_requirements: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select storage type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ambient">Ambient Temperature</SelectItem>
                  <SelectItem value="refrigerated">Refrigerated</SelectItem>
                  <SelectItem value="fragile">Fragile</SelectItem>
                  <SelectItem value="hazardous">Hazardous</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Variants Section */}
          <div className="space-y-3 border-t pt-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Product Variants</Label>
              <Button type="button" variant="outline" size="sm" onClick={addVariant}>
                <Plus className="h-4 w-4 mr-2" />
                Add Variant
              </Button>
            </div>

            {formData.variants && formData.variants.length > 0 ? (
              <div className="space-y-4">
                {formData.variants.map((variant, variantIndex) => (
                  <div key={variantIndex} className="border rounded-lg p-4 space-y-3 bg-muted/30">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <Label className="text-xs text-muted-foreground">Attribute Name</Label>
                        <Input
                          value={variant.attribute}
                          onChange={(e) =>
                            updateVariant(variantIndex, 'attribute', e.target.value)
                          }
                          placeholder="e.g., Color, Size, Material"
                          className="mt-1"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeVariant(variantIndex)}
                        className="ml-2"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="space-y-2 pl-3 border-l-2">
                      <Label className="text-xs text-muted-foreground">Values</Label>
                      {variant.values.map((val, valueIndex) => (
                        <div key={valueIndex} className="flex gap-2 items-center">
                          <Input
                            value={val.value}
                            onChange={(e) =>
                              updateVariantValue(variantIndex, valueIndex, 'value', e.target.value)
                            }
                            placeholder="e.g., Red, Large"
                            className="flex-1"
                          />
                          <Input
                            type="number"
                            min="0"
                            value={val.quantity}
                            onChange={(e) =>
                              updateVariantValue(
                                variantIndex,
                                valueIndex,
                                'quantity',
                                parseInt(e.target.value) || 0
                              )
                            }
                            placeholder="Qty"
                            className="w-24"
                          />
                          {variant.values.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeValueFromVariant(variantIndex, valueIndex)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => addValueToVariant(variantIndex)}
                        className="w-full"
                      >
                        + Add Value
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground pl-4">
                No variants added. Add variants to group values by attribute (e.g., Color with Red,
                Blue, Green).
              </p>
            )}
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Adding...' : 'Add Product'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

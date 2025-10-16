import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

interface Product {
  name: string;
  variants: Variant[];
}

interface ProductFormData {
  company_id: string;
  products: Product[];
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
    products: [{ name: '', variants: [] }],
  });

  const addProduct = () => {
    setFormData({
      ...formData,
      products: [...formData.products, { name: '', variants: [] }],
    });
  };

  const removeProduct = (productIndex: number) => {
    if (formData.products.length === 1) {
      toast({
        title: "Error",
        description: "You must have at least one product",
        variant: "destructive",
      });
      return;
    }
    setFormData({
      ...formData,
      products: formData.products.filter((_, i) => i !== productIndex),
    });
  };

  const updateProductName = (productIndex: number, name: string) => {
    const updated = [...formData.products];
    updated[productIndex] = { ...updated[productIndex], name };
    setFormData({ ...formData, products: updated });
  };

  const addVariant = (productIndex: number) => {
    const updated = [...formData.products];
    updated[productIndex].variants = [
      ...updated[productIndex].variants,
      { attribute: '', values: [{ value: '', quantity: 0 }] },
    ];
    setFormData({ ...formData, products: updated });
  };

  const removeVariant = (productIndex: number, variantIndex: number) => {
    const updated = [...formData.products];
    updated[productIndex].variants = updated[productIndex].variants.filter(
      (_, i) => i !== variantIndex
    );
    setFormData({ ...formData, products: updated });
  };

  const updateVariant = (productIndex: number, variantIndex: number, field: string, value: any) => {
    const updated = [...formData.products];
    updated[productIndex].variants[variantIndex] = {
      ...updated[productIndex].variants[variantIndex],
      [field]: value,
    };
    setFormData({ ...formData, products: updated });
  };

  const addValueToVariant = (productIndex: number, variantIndex: number) => {
    const updated = [...formData.products];
    updated[productIndex].variants[variantIndex].values.push({ value: '', quantity: 0 });
    setFormData({ ...formData, products: updated });
  };

  const removeValueFromVariant = (productIndex: number, variantIndex: number, valueIndex: number) => {
    const updated = [...formData.products];
    updated[productIndex].variants[variantIndex].values = updated[productIndex].variants[
      variantIndex
    ].values.filter((_, i) => i !== valueIndex);
    setFormData({ ...formData, products: updated });
  };

  const updateVariantValue = (
    productIndex: number,
    variantIndex: number,
    valueIndex: number,
    field: string,
    value: any
  ) => {
    const updated = [...formData.products];
    updated[productIndex].variants[variantIndex].values[valueIndex] = {
      ...updated[productIndex].variants[variantIndex].values[valueIndex],
      [field]: value,
    };
    setFormData({ ...formData, products: updated });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.company_id) {
      toast({
        title: "Error",
        description: "Please select a client",
        variant: "destructive",
      });
      return;
    }

    // Validate all products have names
    const hasEmptyNames = formData.products.some(p => !p.name.trim());
    if (hasEmptyNames) {
      toast({
        title: "Error",
        description: "Please provide names for all products",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const productsData = formData.products.map(product => ({
        company_id: formData.company_id,
        name: product.name,
        variants: product.variants as any,
        is_active: true,
      }));

      const { error } = await supabase
        .from('client_products')
        .insert(productsData);

      if (error) throw error;

      toast({
        title: "Success",
        description: `${formData.products.length} product(s) added successfully`,
      });
      
      onSuccess();
    } catch (error: any) {
      console.error('Error adding products:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add products",
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

          {/* Multiple Products Section */}
          <div className="space-y-4 border-t pt-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Products</Label>
              <Button type="button" variant="outline" size="sm" onClick={addProduct}>
                <Plus className="h-4 w-4 mr-2" />
                Add Another Product
              </Button>
            </div>

            {formData.products.map((product, productIndex) => (
              <div key={productIndex} className="border rounded-lg p-4 space-y-4 bg-card">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <Label>Product Name *</Label>
                    <Input
                      value={product.name}
                      onChange={(e) => updateProductName(productIndex, e.target.value)}
                      placeholder="e.g., Wireless Headphones"
                      className="mt-1"
                      required
                    />
                  </div>
                  {formData.products.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeProduct(productIndex)}
                      className="mt-6"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                {/* Variants for this product */}
                <div className="space-y-3 pl-4 border-l-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Product Variants</Label>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      onClick={() => addVariant(productIndex)}
                    >
                      <Plus className="h-3 w-3 mr-2" />
                      Add Variant
                    </Button>
                  </div>

                  {product.variants.length > 0 ? (
                    <div className="space-y-3">
                      {product.variants.map((variant, variantIndex) => (
                        <div key={variantIndex} className="border rounded-lg p-3 space-y-2 bg-muted/30">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <Label className="text-xs text-muted-foreground">Attribute Name</Label>
                              <Input
                                value={variant.attribute}
                                onChange={(e) =>
                                  updateVariant(productIndex, variantIndex, 'attribute', e.target.value)
                                }
                                placeholder="e.g., Color, Size"
                                className="mt-1"
                              />
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeVariant(productIndex, variantIndex)}
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
                                    updateVariantValue(productIndex, variantIndex, valueIndex, 'value', e.target.value)
                                  }
                                  placeholder="e.g., Red"
                                  className="flex-1"
                                />
                                <Input
                                  type="number"
                                  min="0"
                                  value={val.quantity}
                                  onChange={(e) =>
                                    updateVariantValue(
                                      productIndex,
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
                                    onClick={() => removeValueFromVariant(productIndex, variantIndex, valueIndex)}
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
                              onClick={() => addValueToVariant(productIndex, variantIndex)}
                              className="w-full"
                            >
                              + Add Value
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      No variants added yet.
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Adding...' : `Add ${formData.products.length} Product${formData.products.length > 1 ? 's' : ''}`}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

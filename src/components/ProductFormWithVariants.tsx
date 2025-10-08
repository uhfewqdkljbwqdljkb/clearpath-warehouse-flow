import React, { useState } from 'react';
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
import { X, Plus } from 'lucide-react';

interface Variant {
  attribute: string;
  values: { value: string; quantity: number }[];
}

interface ProductFormData {
  sku: string;
  name: string;
  description?: string;
  category?: string;
  dimensions_length?: number;
  dimensions_width?: number;
  dimensions_height?: number;
  weight?: number;
  unit_value?: number;
  storage_requirements?: string;
  variants?: Variant[];
}

interface ProductFormWithVariantsProps {
  product?: any | null;
  onSubmit: (data: ProductFormData) => void;
  onCancel: () => void;
}

export const ProductFormWithVariants: React.FC<ProductFormWithVariantsProps> = ({
  product,
  onSubmit,
  onCancel,
}) => {
  const [formData, setFormData] = useState<ProductFormData>({
    sku: product?.sku || '',
    name: product?.name || '',
    description: product?.description || '',
    category: product?.category || '',
    dimensions_length: product?.dimensions_length || undefined,
    dimensions_width: product?.dimensions_width || undefined,
    dimensions_height: product?.dimensions_height || undefined,
    weight: product?.weight || undefined,
    unit_value: product?.unit_value || undefined,
    storage_requirements: product?.storage_requirements || 'ambient',
    variants: product?.variants || [],
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
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
          <Label htmlFor="unit_value">Unit Value ($)</Label>
          <Input
            id="unit_value"
            type="number"
            step="0.01"
            value={formData.unit_value || ''}
            onChange={(e) =>
              setFormData({
                ...formData,
                unit_value: e.target.value ? parseFloat(e.target.value) : undefined,
              })
            }
            placeholder="0.00"
          />
        </div>
      </div>

      <div>
        <Label>Dimensions (inches)</Label>
        <div className="grid grid-cols-3 gap-4 mt-2">
          <div>
            <Input
              type="number"
              step="0.1"
              value={formData.dimensions_length || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  dimensions_length: e.target.value ? parseFloat(e.target.value) : undefined,
                })
              }
              placeholder="Length"
            />
          </div>
          <div>
            <Input
              type="number"
              step="0.1"
              value={formData.dimensions_width || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  dimensions_width: e.target.value ? parseFloat(e.target.value) : undefined,
                })
              }
              placeholder="Width"
            />
          </div>
          <div>
            <Input
              type="number"
              step="0.1"
              value={formData.dimensions_height || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  dimensions_height: e.target.value ? parseFloat(e.target.value) : undefined,
                })
              }
              placeholder="Height"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="weight">Weight (lbs)</Label>
          <Input
            id="weight"
            type="number"
            step="0.1"
            value={formData.weight || ''}
            onChange={(e) =>
              setFormData({
                ...formData,
                weight: e.target.value ? parseFloat(e.target.value) : undefined,
              })
            }
            placeholder="0.0"
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

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">{product ? 'Update Product' : 'Add Product'}</Button>
      </div>
    </form>
  );
};

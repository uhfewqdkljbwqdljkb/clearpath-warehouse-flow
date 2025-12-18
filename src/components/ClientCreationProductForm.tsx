import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, X } from 'lucide-react';

interface Variant {
  attribute: string;
  values: { value: string; quantity: number }[];
}

interface Product {
  name: string;
  variants: Variant[];
  quantity: number;
  minimumQuantity: number;
}

interface ClientCreationProductFormProps {
  onSubmit: (products: Product[]) => void;
  onCancel: () => void;
  initialProduct?: any;
}

export const ClientCreationProductForm: React.FC<ClientCreationProductFormProps> = ({
  onSubmit,
  onCancel,
  initialProduct,
}) => {
  const [products, setProducts] = useState<Product[]>(
    initialProduct
      ? [{
          name: initialProduct.name || '',
          variants: initialProduct.variants || [],
          quantity: initialProduct.variants?.reduce(
            (sum: number, v: Variant) => sum + v.values.reduce((s, val) => s + val.quantity, 0),
            0
          ) || 0,
          minimumQuantity: initialProduct.minimumQuantity || 0,
        }]
      : [{ name: '', variants: [], quantity: 0, minimumQuantity: 0 }]
  );

  const addProduct = () => {
    setProducts([...products, { name: '', variants: [], quantity: 0, minimumQuantity: 0 }]);
  };

  const removeProduct = (index: number) => {
    setProducts(products.filter((_, i) => i !== index));
  };

  const updateProduct = (index: number, field: string, value: any) => {
    const updated = [...products];
    updated[index] = { ...updated[index], [field]: value };
    setProducts(updated);
  };

  const addVariant = (productIndex: number) => {
    const updated = [...products];
    updated[productIndex].variants.push({ attribute: '', values: [{ value: '', quantity: 0 }] });
    setProducts(updated);
  };

  const addValueToVariant = (productIndex: number, variantIndex: number) => {
    const updated = [...products];
    updated[productIndex].variants[variantIndex].values.push({ value: '', quantity: 0 });
    setProducts(updated);
  };

  const removeValueFromVariant = (productIndex: number, variantIndex: number, valueIndex: number) => {
    const updated = [...products];
    updated[productIndex].variants[variantIndex].values = 
      updated[productIndex].variants[variantIndex].values.filter((_, i) => i !== valueIndex);
    setProducts(updated);
  };

  const updateVariantValue = (productIndex: number, variantIndex: number, valueIndex: number, field: string, value: any) => {
    const updated = [...products];
    updated[productIndex].variants[variantIndex].values[valueIndex] = {
      ...updated[productIndex].variants[variantIndex].values[valueIndex],
      [field]: value
    };
    
    // Auto-update total quantity
    if (updated[productIndex].variants.length > 0) {
      const totalQty = updated[productIndex].variants.reduce((sum, variant) => 
        sum + variant.values.reduce((vSum, val) => vSum + (val.quantity || 0), 0), 0
      );
      updated[productIndex].quantity = totalQty;
    }
    
    setProducts(updated);
  };

  const calculateTotalQuantity = (productIndex: number) => {
    const product = products[productIndex];
    if (product.variants.length > 0) {
      return product.variants.reduce((sum, variant) => 
        sum + variant.values.reduce((vSum, val) => vSum + (val.quantity || 0), 0), 0
      );
    }
    return product.quantity || 0;
  };

  const removeVariant = (productIndex: number, variantIndex: number) => {
    const updated = [...products];
    updated[productIndex].variants = updated[productIndex].variants.filter((_, i) => i !== variantIndex);
    setProducts(updated);
  };

  const updateVariant = (productIndex: number, variantIndex: number, field: string, value: any) => {
    const updated = [...products];
    updated[productIndex].variants[variantIndex] = {
      ...updated[productIndex].variants[variantIndex],
      [field]: value
    };
    setProducts(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(products);
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Add Products
          </CardTitle>
          <CardDescription>
            Add products with optional variants and quantities
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {products.map((product, productIndex) => (
            <div key={productIndex} className="border rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Product {productIndex + 1}</h4>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeProduct(productIndex)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Product Name</label>
                  <Input
                    value={product.name}
                    onChange={(e) => updateProduct(productIndex, 'name', e.target.value)}
                    placeholder="Enter product name"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Minimum Quantity (Low Stock Alert)
                  </label>
                  <Input
                    type="number"
                    min="0"
                    value={product.minimumQuantity || 0}
                    onChange={(e) => updateProduct(productIndex, 'minimumQuantity', parseInt(e.target.value) || 0)}
                    placeholder="Set minimum stock level"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Get notified when stock falls below this level
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Total Quantity
                    {product.variants.length > 0 && (
                      <span className="text-xs text-muted-foreground ml-2">(Auto-calculated from variants)</span>
                    )}
                  </label>
                  <Input
                    type="number"
                    min="0"
                    value={product.variants.length > 0 ? calculateTotalQuantity(productIndex) : (product.quantity || 0)}
                    onChange={(e) => updateProduct(productIndex, 'quantity', parseInt(e.target.value) || 0)}
                    placeholder="Enter quantity"
                    disabled={product.variants.length > 0}
                    className={product.variants.length > 0 ? 'bg-muted cursor-not-allowed' : ''}
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Variants</label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addVariant(productIndex)}
                    >
                      Add Variant
                    </Button>
                  </div>

                  {product.variants.map((variant, variantIndex) => (
                    <div key={variantIndex} className="border rounded-lg p-4 space-y-3 bg-muted/30">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <label className="text-xs font-medium text-muted-foreground block mb-1">
                            Attribute Name
                          </label>
                          <Input
                            value={variant.attribute}
                            onChange={(e) => updateVariant(productIndex, variantIndex, 'attribute', e.target.value)}
                            placeholder="e.g., Color, Size, Material"
                            className="font-medium"
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
                        <label className="text-xs font-medium text-muted-foreground">Values</label>
                        {variant.values.map((val, valueIndex) => (
                          <div key={valueIndex} className="flex gap-2 items-center">
                            <Input
                              value={val.value}
                              onChange={(e) => updateVariantValue(productIndex, variantIndex, valueIndex, 'value', e.target.value)}
                              placeholder="e.g., Red, Large"
                              className="flex-1"
                            />
                            <Input
                              type="number"
                              min="0"
                              value={val.quantity}
                              onChange={(e) => updateVariantValue(productIndex, variantIndex, valueIndex, 'quantity', parseInt(e.target.value) || 0)}
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

                  {product.variants.length === 0 && (
                    <p className="text-xs text-muted-foreground pl-4">
                      No variants added. Add variants to group values by attribute (e.g., Color with Red, Blue, Green).
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}

          {products.length === 0 && (
            <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
              <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No products added yet</p>
              <p className="text-sm">Click "Add Product" to get started</p>
            </div>
          )}

          <Button
            type="button"
            variant="outline"
            onClick={addProduct}
            className="w-full"
          >
            <Package className="h-4 w-4 mr-2" />
            Add Product
          </Button>

          <div className="bg-muted/50 p-4 rounded-lg">
            <p className="text-sm text-muted-foreground">
              💡 <strong>Tip:</strong> For products with variants, add an attribute (e.g., "Color"), then add multiple values (Red: 5, Blue: 3). Total quantity auto-calculates from all variant values.
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit">
              Save Products
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
};

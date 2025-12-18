import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Package, Search, Plus, X } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface ProductEntry {
  name: string;
  quantity: number;
  existingProductId?: string;
  minimumQuantity?: number;
  value?: number;
  variants: Array<{
    attribute: string;
    values: Array<{
      value: string;
      quantity: number;
    }>;
  }>;
}

interface ExistingProduct {
  id: string;
  name: string;
  sku: string;
  variants: any;
  minimum_quantity: number | null;
  value: number | null;
}

interface ExistingProductsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
  onProductsSelected: (products: ProductEntry[]) => void;
}

export const ExistingProductsDialog: React.FC<ExistingProductsDialogProps> = ({
  open,
  onOpenChange,
  companyId,
  onProductsSelected,
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [existingProducts, setExistingProducts] = useState<ExistingProduct[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<Map<string, ProductEntry>>(new Map());
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedNewVariants, setExpandedNewVariants] = useState<Set<string>>(new Set());
  const [newVariants, setNewVariants] = useState<Map<string, Array<{ attribute: string; values: Array<{ value: string; quantity: number }> }>>>(new Map());

  // Filter products based on search query
  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return existingProducts;
    const query = searchQuery.toLowerCase();
    return existingProducts.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        (p.sku && p.sku.toLowerCase().includes(query))
    );
  }, [existingProducts, searchQuery]);

  useEffect(() => {
    if (open && companyId) {
      fetchExistingProducts();
    }
  }, [open, companyId]);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setSearchQuery('');
      setExpandedNewVariants(new Set());
      setNewVariants(new Map());
    }
  }, [open]);

  const fetchExistingProducts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('client_products')
        .select('id, name, sku, variants, minimum_quantity, value')
        .eq('company_id', companyId)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setExistingProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast({
        title: "Error",
        description: "Failed to load existing products",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateProductQuantity = (productId: string, productName: string, quantity: number, variants: any, minimumQuantity?: number | null, productValue?: number | null) => {
    const updated = new Map(selectedProducts);
    
    if (quantity > 0) {
      // Parse variants to match ProductEntry format
      const parsedVariants = Array.isArray(variants) && variants.length > 0
        ? variants.map((v: any) => ({
            attribute: v.attribute || '',
            values: Array.isArray(v.values) 
              ? v.values.map((val: any) => ({
                  value: typeof val === 'string' ? val : val.value || '',
                  quantity: 0
                }))
              : []
          }))
        : [];

      updated.set(productId, {
        name: productName,
        quantity: parsedVariants.length > 0 ? 0 : quantity,
        existingProductId: productId,
        minimumQuantity: minimumQuantity || 0,
        value: productValue || 0,
        variants: parsedVariants
      });
    } else {
      updated.delete(productId);
    }
    
    setSelectedProducts(updated);
  };

  const updateVariantQuantity = (
    productId: string,
    productName: string,
    variants: any,
    variantIndex: number,
    valueIndex: number,
    quantity: number,
    minimumQuantity?: number | null,
    productValue?: number | null
  ) => {
    const updated = new Map(selectedProducts);
    let product = updated.get(productId);
    
    // Initialize product if it doesn't exist
    if (!product) {
      const parsedVariants = Array.isArray(variants) && variants.length > 0
        ? variants.map((v: any) => ({
            attribute: v.attribute || '',
            values: Array.isArray(v.values) 
              ? v.values.map((val: any) => ({
                  value: typeof val === 'string' ? val : val.value || '',
                  quantity: 0
                }))
              : []
          }))
        : [];
      
      product = {
        name: productName,
        quantity: 0,
        existingProductId: productId,
        minimumQuantity: minimumQuantity || 0,
        value: productValue || 0,
        variants: parsedVariants
      };
    }
    
    if (product.variants[variantIndex]) {
      product.variants[variantIndex].values[valueIndex].quantity = quantity;
      
      // Recalculate total quantity
      const totalQty = product.variants.reduce((sum, variant) => 
        sum + variant.values.reduce((vSum, val) => vSum + (val.quantity || 0), 0), 0
      );
      product.quantity = totalQty;
      
      updated.set(productId, product);
      setSelectedProducts(updated);
    }
  };

  // New variant management functions
  const toggleNewVariantSection = (productId: string) => {
    const updated = new Set(expandedNewVariants);
    if (updated.has(productId)) {
      updated.delete(productId);
    } else {
      updated.add(productId);
      // Initialize with empty variant if none exists
      if (!newVariants.has(productId)) {
        setNewVariants(new Map(newVariants).set(productId, []));
      }
    }
    setExpandedNewVariants(updated);
  };

  const addNewVariantToProduct = (productId: string) => {
    const updated = new Map(newVariants);
    const productVariants = updated.get(productId) || [];
    updated.set(productId, [...productVariants, { attribute: '', values: [{ value: '', quantity: 0 }] }]);
    setNewVariants(updated);
  };

  const removeNewVariant = (productId: string, variantIndex: number) => {
    const updated = new Map(newVariants);
    const productVariants = updated.get(productId) || [];
    updated.set(productId, productVariants.filter((_, i) => i !== variantIndex));
    setNewVariants(updated);
  };

  const updateNewVariantAttribute = (productId: string, variantIndex: number, attribute: string) => {
    const updated = new Map(newVariants);
    const productVariants = [...(updated.get(productId) || [])];
    productVariants[variantIndex] = { ...productVariants[variantIndex], attribute };
    updated.set(productId, productVariants);
    setNewVariants(updated);
  };

  const addNewVariantValue = (productId: string, variantIndex: number) => {
    const updated = new Map(newVariants);
    const productVariants = [...(updated.get(productId) || [])];
    productVariants[variantIndex] = {
      ...productVariants[variantIndex],
      values: [...productVariants[variantIndex].values, { value: '', quantity: 0 }]
    };
    updated.set(productId, productVariants);
    setNewVariants(updated);
  };

  const removeNewVariantValue = (productId: string, variantIndex: number, valueIndex: number) => {
    const updated = new Map(newVariants);
    const productVariants = [...(updated.get(productId) || [])];
    productVariants[variantIndex] = {
      ...productVariants[variantIndex],
      values: productVariants[variantIndex].values.filter((_, i) => i !== valueIndex)
    };
    updated.set(productId, productVariants);
    setNewVariants(updated);
  };

  const updateNewVariantValue = (productId: string, variantIndex: number, valueIndex: number, field: 'value' | 'quantity', val: string | number) => {
    const updated = new Map(newVariants);
    const productVariants = [...(updated.get(productId) || [])];
    const values = [...productVariants[variantIndex].values];
    values[valueIndex] = { ...values[valueIndex], [field]: val };
    productVariants[variantIndex] = { ...productVariants[variantIndex], values };
    updated.set(productId, productVariants);
    setNewVariants(updated);
  };

  const handleAddProducts = () => {
    // Combine selected products with new variants
    const productsToAdd: ProductEntry[] = [];

    // First, add products selected from existing variants
    Array.from(selectedProducts.values()).forEach(p => {
      if (p.variants.length > 0) {
        if (p.variants.some(v => v.values.some(val => val.quantity > 0))) {
          productsToAdd.push(p);
        }
      } else if (p.quantity > 0) {
        productsToAdd.push(p);
      }
    });

    // Then, add products with new variants
    newVariants.forEach((variants, productId) => {
      const validVariants = variants.filter(v => 
        v.attribute.trim() && v.values.some(val => val.value.trim() && val.quantity > 0)
      );

      if (validVariants.length > 0) {
        const product = existingProducts.find(p => p.id === productId);
        if (product) {
          // Check if this product is already in productsToAdd
          const existingIndex = productsToAdd.findIndex(p => p.existingProductId === productId);
          
          const totalNewQty = validVariants.reduce((sum, v) => 
            sum + v.values.reduce((vSum, val) => vSum + (val.quantity || 0), 0), 0
          );

          if (existingIndex >= 0) {
            // Merge new variants with existing selection
            productsToAdd[existingIndex].variants = [
              ...productsToAdd[existingIndex].variants,
              ...validVariants
            ];
            productsToAdd[existingIndex].quantity += totalNewQty;
          } else {
            productsToAdd.push({
              name: product.name,
              quantity: totalNewQty,
              existingProductId: productId,
              minimumQuantity: product.minimum_quantity || 0,
              value: product.value || 0,
              variants: validVariants
            });
          }
        }
      }
    });

    if (productsToAdd.length === 0) {
      toast({
        title: "No products selected",
        description: "Please select at least one product and enter quantities",
        variant: "destructive",
      });
      return;
    }

    onProductsSelected(productsToAdd);
    setSelectedProducts(new Map());
    setNewVariants(new Map());
    setExpandedNewVariants(new Set());
    onOpenChange(false);
    
    toast({
      title: "Success",
      description: `Added ${productsToAdd.length} product(s) to check-in request`,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Check In Existing Products</DialogTitle>
          <DialogDescription>
            Select products from your inventory and enter the quantities you want to check in
          </DialogDescription>
        </DialogHeader>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by product name or SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : existingProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No products found</p>
            <p className="text-sm text-muted-foreground">Add products first to check in inventory</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Search className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No products match your search</p>
            <p className="text-sm text-muted-foreground">Try a different search term</p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Showing {filteredProducts.length} of {existingProducts.length} products
            </p>
            {filteredProducts.map((product) => {
              const hasVariants = Array.isArray(product.variants) && product.variants.length > 0;
              const selectedProduct = selectedProducts.get(product.id);
              const isNewVariantExpanded = expandedNewVariants.has(product.id);
              const productNewVariants = newVariants.get(product.id) || [];
              
              return (
                <Card key={product.id}>
                  <CardContent className="pt-6 space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-medium">{product.name}</h3>
                        <p className="text-sm text-muted-foreground">SKU: {product.sku}</p>
                      </div>
                    </div>

                    {!hasVariants ? (
                      <div className="space-y-2">
                        <Label>Quantity to Check In</Label>
                        <Input
                          type="number"
                          placeholder="Enter quantity"
                          min="0"
                          value={selectedProduct?.quantity || ''}
                          onChange={(e) => updateProductQuantity(
                            product.id,
                            product.name,
                            parseInt(e.target.value) || 0,
                            product.variants,
                            product.minimum_quantity,
                            product.value
                          )}
                        />
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <Label>Select Variants and Quantities</Label>
                        {product.variants.map((variant: any, variantIndex: number) => (
                          <div key={variantIndex} className="space-y-2">
                            <p className="text-sm font-medium">{variant.attribute}</p>
                            <div className="grid grid-cols-2 gap-2">
                              {variant.values?.map((value: any, valueIndex: number) => {
                                const variantValue = typeof value === 'string' ? value : value.value || value;
                                const currentQty = selectedProduct?.variants[variantIndex]?.values[valueIndex]?.quantity || 0;
                                
                                return (
                                  <div key={valueIndex} className="flex items-center gap-2">
                                    <Label className="text-sm min-w-[100px]">{variantValue}</Label>
                                    <Input
                                      type="number"
                                      placeholder="Qty"
                                      min="0"
                                      className="w-24"
                                      value={currentQty || ''}
                                      onChange={(e) => {
                                        updateVariantQuantity(
                                          product.id,
                                          product.name,
                                          product.variants,
                                          variantIndex,
                                          valueIndex,
                                          parseInt(e.target.value) || 0,
                                          product.minimum_quantity,
                                          product.value
                                        );
                                      }}
                                    />
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                        {selectedProduct && selectedProduct.quantity > 0 && (
                          <p className="text-sm text-muted-foreground">
                            Total quantity: {selectedProduct.quantity}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Add New Variants Section */}
                    <Collapsible open={isNewVariantExpanded} onOpenChange={() => toggleNewVariantSection(product.id)}>
                      <CollapsibleTrigger asChild>
                        <Button variant="outline" size="sm" className="w-full">
                          <Plus className="h-4 w-4 mr-2" />
                          {isNewVariantExpanded ? 'Hide New Variants' : 'Add New Variants'}
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="mt-4 space-y-4">
                        {productNewVariants.map((variant, variantIndex) => (
                          <Card key={variantIndex} className="p-4 bg-muted/30">
                            <div className="space-y-3">
                              <div className="flex items-center gap-2">
                                <Input
                                  placeholder="Variant name (e.g., Size, Color)"
                                  value={variant.attribute}
                                  onChange={(e) => updateNewVariantAttribute(product.id, variantIndex, e.target.value)}
                                  className="flex-1"
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeNewVariant(product.id, variantIndex)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                              
                              <div className="space-y-2 pl-4 border-l-2 border-muted-foreground/20">
                                <Label className="text-xs text-muted-foreground">Values</Label>
                                {variant.values.map((val, valueIndex) => (
                                  <div key={valueIndex} className="flex items-center gap-2">
                                    <Input
                                      placeholder="Value (e.g., Red, Large)"
                                      value={val.value}
                                      onChange={(e) => updateNewVariantValue(product.id, variantIndex, valueIndex, 'value', e.target.value)}
                                      className="flex-1"
                                    />
                                    <Input
                                      type="number"
                                      placeholder="Qty"
                                      min="0"
                                      value={val.quantity || ''}
                                      onChange={(e) => updateNewVariantValue(product.id, variantIndex, valueIndex, 'quantity', parseInt(e.target.value) || 0)}
                                      className="w-24"
                                    />
                                    {variant.values.length > 1 && (
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => removeNewVariantValue(product.id, variantIndex, valueIndex)}
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
                                  onClick={() => addNewVariantValue(product.id, variantIndex)}
                                  className="w-full"
                                >
                                  + Add Value
                                </Button>
                              </div>
                            </div>
                          </Card>
                        ))}
                        
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => addNewVariantToProduct(product.id)}
                          className="w-full"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Variant Attribute
                        </Button>
                      </CollapsibleContent>
                    </Collapsible>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleAddProducts} 
            disabled={loading || (selectedProducts.size === 0 && newVariants.size === 0)}
          >
            Add Selected Products
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

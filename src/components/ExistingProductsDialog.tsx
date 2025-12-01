import React, { useState, useEffect } from 'react';
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
import { Loader2, Package } from 'lucide-react';

interface ProductEntry {
  name: string;
  quantity: number;
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

  useEffect(() => {
    if (open && companyId) {
      fetchExistingProducts();
    }
  }, [open, companyId]);

  const fetchExistingProducts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('client_products')
        .select('id, name, sku, variants')
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

  const updateProductQuantity = (productId: string, productName: string, quantity: number, variants: any) => {
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
    quantity: number
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

  const handleAddProducts = () => {
    const productsToAdd = Array.from(selectedProducts.values()).filter(p => {
      if (p.variants.length > 0) {
        return p.variants.some(v => v.values.some(val => val.quantity > 0));
      }
      return p.quantity > 0;
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
        ) : (
          <div className="space-y-4">
            {existingProducts.map((product) => {
              const hasVariants = Array.isArray(product.variants) && product.variants.length > 0;
              const selectedProduct = selectedProducts.get(product.id);
              
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
                            product.variants
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
                                          parseInt(e.target.value) || 0
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
          <Button onClick={handleAddProducts} disabled={loading || selectedProducts.size === 0}>
            Add Selected Products
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Package, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { VariantValue, Variant } from '@/types/variants';

interface LowStockItem {
  id: string;
  productId: string;
  productName: string;
  sku: string | null;
  variantPath: string | null; // e.g., "Size: Large → Color: Red"
  currentStock: number;
  minimumQuantity: number;
  isCritical: boolean;
}

export const LowStockAlerts: React.FC = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [lowStockItems, setLowStockItems] = useState<LowStockItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (profile?.company_id) {
      fetchLowStockItems();
    }
  }, [profile?.company_id]);

  const fetchLowStockItems = async () => {
    if (!profile?.company_id) return;

    try {
      // Fetch all active products
      const { data: products, error: productsError } = await supabase
        .from('client_products')
        .select('id, name, sku, minimum_quantity, variants')
        .eq('company_id', profile.company_id)
        .eq('is_active', true);

      if (productsError) throw productsError;

      // Fetch inventory
      const { data: inventory, error: inventoryError } = await supabase
        .from('inventory_items')
        .select('product_id, quantity, variant_attribute, variant_value')
        .eq('company_id', profile.company_id);

      if (inventoryError) throw inventoryError;

      // Create inventory map by product_id and variant
      const inventoryMap: { [key: string]: number } = {};
      inventory?.forEach((item) => {
        const key = item.variant_attribute && item.variant_value
          ? `${item.product_id}:${item.variant_attribute}:${item.variant_value}`
          : item.product_id;
        inventoryMap[key] = (inventoryMap[key] || 0) + item.quantity;
      });

      // Check variants for low stock
      const lowStock: LowStockItem[] = [];

      const checkVariantValues = (
        productId: string,
        productName: string,
        sku: string | null,
        values: VariantValue[],
        parentPath: string,
        attributeName: string
      ) => {
        for (const val of values) {
          const currentPath = parentPath
            ? `${parentPath} → ${attributeName}: ${val.value}`
            : `${attributeName}: ${val.value}`;

          if (val.subVariants && val.subVariants.length > 0) {
            // Has sub-variants, check them instead
            for (const subVariant of val.subVariants) {
              checkVariantValues(
                productId,
                productName,
                sku,
                subVariant.values,
                currentPath,
                subVariant.attribute
              );
            }
          } else {
            // Leaf node - check if it has a minimum quantity set
            const minQty = val.minimumQuantity || 0;
            if (minQty > 0) {
              // Get current stock for this variant
              const inventoryKey = `${productId}:${attributeName}:${val.value}`;
              let currentStock = inventoryMap[inventoryKey] || 0;
              
              // Fallback to variant quantity if no inventory record
              if (currentStock === 0) {
                currentStock = val.quantity || 0;
              }

              if (currentStock <= minQty) {
                lowStock.push({
                  id: `${productId}-${currentPath}`,
                  productId,
                  productName,
                  sku,
                  variantPath: currentPath,
                  currentStock,
                  minimumQuantity: minQty,
                  isCritical: currentStock === 0 || currentStock < minQty * 0.5,
                });
              }
            }
          }
        }
      };

      products?.forEach((product) => {
        // Check product-level minimum quantity
        const productMinQty = product.minimum_quantity || 0;
        if (productMinQty > 0) {
          let totalStock = inventoryMap[product.id] || 0;
          
          // Calculate from variants if no direct inventory
          if (totalStock === 0 && product.variants && Array.isArray(product.variants)) {
            const calcTotal = (vals: VariantValue[]): number => {
              return vals.reduce((sum, v) => {
                if (v.subVariants && v.subVariants.length > 0) {
                  return sum + v.subVariants.reduce((s, sv) => s + calcTotal(sv.values), 0);
                }
                return sum + (v.quantity || 0);
              }, 0);
            };
            totalStock = (product.variants as unknown as Variant[]).reduce(
              (sum, variant) => sum + calcTotal(variant.values),
              0
            );
          }

          if (totalStock <= productMinQty) {
            lowStock.push({
              id: product.id,
              productId: product.id,
              productName: product.name,
              sku: product.sku,
              variantPath: null,
              currentStock: totalStock,
              minimumQuantity: productMinQty,
              isCritical: totalStock === 0 || totalStock < productMinQty * 0.5,
            });
          }
        }

        // Check variant-level minimum quantities
        if (product.variants && Array.isArray(product.variants)) {
          for (const variant of product.variants as unknown as Variant[]) {
            checkVariantValues(
              product.id,
              product.name,
              product.sku,
              variant.values,
              '',
              variant.attribute
            );
          }
        }
      });

      // Sort by criticality
      lowStock.sort((a, b) => {
        if (a.isCritical && !b.isCritical) return -1;
        if (!a.isCritical && b.isCritical) return 1;
        return a.currentStock - b.currentStock;
      });

      setLowStockItems(lowStock);
    } catch (error) {
      console.error('Error fetching low stock items:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return null;
  }

  if (lowStockItems.length === 0) {
    return null;
  }

  return (
    <Card className="border-destructive/50 bg-destructive/5">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <CardTitle className="text-lg">Low Stock Alerts</CardTitle>
          </div>
          <Badge variant="destructive">{lowStockItems.length} items</Badge>
        </div>
        <CardDescription>
          These items need to be restocked soon
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {lowStockItems.slice(0, 5).map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between p-3 rounded-lg bg-background border"
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${item.isCritical ? 'bg-destructive/10' : 'bg-yellow-500/10'}`}>
                <Package className={`h-4 w-4 ${item.isCritical ? 'text-destructive' : 'text-yellow-600'}`} />
              </div>
              <div>
                <p className="font-medium text-sm">{item.productName}</p>
                {item.variantPath && (
                  <p className="text-xs text-muted-foreground">{item.variantPath}</p>
                )}
                {!item.variantPath && item.sku && (
                  <p className="text-xs text-muted-foreground">SKU: {item.sku}</p>
                )}
              </div>
            </div>
            <div className="text-right">
              <p className={`font-bold ${item.isCritical ? 'text-destructive' : 'text-yellow-600'}`}>
                {item.currentStock} left
              </p>
              <p className="text-xs text-muted-foreground">
                Min: {item.minimumQuantity}
              </p>
            </div>
          </div>
        ))}
        
        {lowStockItems.length > 5 && (
          <p className="text-sm text-muted-foreground text-center">
            +{lowStockItems.length - 5} more items with low stock
          </p>
        )}

        <Button 
          variant="outline" 
          className="w-full mt-2"
          onClick={() => navigate('/client/check-in')}
        >
          Check In Products
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </CardContent>
    </Card>
  );
};

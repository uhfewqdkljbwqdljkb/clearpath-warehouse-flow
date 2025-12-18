import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Package, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { calculateNestedVariantQuantity } from '@/types/variants';

interface LowStockProduct {
  id: string;
  name: string;
  sku: string | null;
  currentStock: number;
  minimumQuantity: number;
  isCritical: boolean;
}

export const LowStockAlerts: React.FC = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [lowStockProducts, setLowStockProducts] = useState<LowStockProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (profile?.company_id) {
      fetchLowStockProducts();
    }
  }, [profile?.company_id]);

  const fetchLowStockProducts = async () => {
    if (!profile?.company_id) return;

    try {
      // Fetch products with minimum_quantity set
      const { data: products, error: productsError } = await supabase
        .from('client_products')
        .select('id, name, sku, minimum_quantity, variants')
        .eq('company_id', profile.company_id)
        .eq('is_active', true)
        .gt('minimum_quantity', 0);

      if (productsError) throw productsError;

      // Fetch inventory for these products
      const { data: inventory, error: inventoryError } = await supabase
        .from('inventory_items')
        .select('product_id, quantity')
        .eq('company_id', profile.company_id);

      if (inventoryError) throw inventoryError;

      // Create inventory map
      const inventoryMap: { [key: string]: number } = {};
      inventory?.forEach((item) => {
        if (inventoryMap[item.product_id]) {
          inventoryMap[item.product_id] += item.quantity;
        } else {
          inventoryMap[item.product_id] = item.quantity;
        }
      });

      // Filter for low stock products
      const lowStock: LowStockProduct[] = [];
      products?.forEach((product) => {
        let currentStock = inventoryMap[product.id] || 0;
        
        // If no inventory record, fallback to variant quantities
        if (currentStock === 0 && product.variants && Array.isArray(product.variants)) {
          currentStock = calculateNestedVariantQuantity(product.variants as any);
        }

        const minQty = product.minimum_quantity || 0;
        if (currentStock <= minQty) {
          lowStock.push({
            id: product.id,
            name: product.name,
            sku: product.sku,
            currentStock,
            minimumQuantity: minQty,
            isCritical: currentStock === 0 || currentStock < minQty * 0.5,
          });
        }
      });

      // Sort by criticality
      lowStock.sort((a, b) => {
        if (a.isCritical && !b.isCritical) return -1;
        if (!a.isCritical && b.isCritical) return 1;
        return a.currentStock - b.currentStock;
      });

      setLowStockProducts(lowStock);
    } catch (error) {
      console.error('Error fetching low stock products:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return null;
  }

  if (lowStockProducts.length === 0) {
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
          <Badge variant="destructive">{lowStockProducts.length} items</Badge>
        </div>
        <CardDescription>
          These products need to be restocked soon
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {lowStockProducts.slice(0, 5).map((product) => (
          <div
            key={product.id}
            className="flex items-center justify-between p-3 rounded-lg bg-background border"
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${product.isCritical ? 'bg-destructive/10' : 'bg-yellow-500/10'}`}>
                <Package className={`h-4 w-4 ${product.isCritical ? 'text-destructive' : 'text-yellow-600'}`} />
              </div>
              <div>
                <p className="font-medium text-sm">{product.name}</p>
                {product.sku && (
                  <p className="text-xs text-muted-foreground">SKU: {product.sku}</p>
                )}
              </div>
            </div>
            <div className="text-right">
              <p className={`font-bold ${product.isCritical ? 'text-destructive' : 'text-yellow-600'}`}>
                {product.currentStock} left
              </p>
              <p className="text-xs text-muted-foreground">
                Min: {product.minimumQuantity}
              </p>
            </div>
          </div>
        ))}
        
        {lowStockProducts.length > 5 && (
          <p className="text-sm text-muted-foreground text-center">
            +{lowStockProducts.length - 5} more items with low stock
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

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TrendingUp, TrendingDown, Package, DollarSign, BarChart3, AlertTriangle } from 'lucide-react';

interface ProductAnalytics {
  id: string;
  sku: string;
  name: string;
  totalQuantity: number;
  totalValue: number;
  averageMovement: number;
  stockStatus: 'healthy' | 'low' | 'critical' | 'out';
  reorderSuggestion: number;
}

interface TopProduct {
  rank: number;
  product: string;
  sku: string;
  quantity: number;
  value: number;
  velocity: 'fast' | 'medium' | 'slow';
  stockDaysLeft: number;
  reorderUrgency: 'good' | 'low' | 'critical';
}

export const ClientAnalytics: React.FC = () => {
  const { profile } = useAuth();
  const [analytics, setAnalytics] = useState<ProductAnalytics[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (profile?.company_id) {
      fetchAnalytics();
    }
  }, [profile?.company_id]);

  const fetchAnalytics = async () => {
    if (!profile?.company_id) return;

    try {
      // Fetch all products with their inventory
      const { data: productsData, error } = await supabase
        .from('client_products')
        .select(`
          id,
          name,
          sku,
          inventory_items (
            quantity
          )
        `)
        .eq('company_id', profile.company_id)
        .eq('is_active', true);

      if (error) throw error;

      // Process analytics data
      const processedAnalytics: ProductAnalytics[] = (productsData || []).map(product => {
        // Sum up all inventory quantities for this product
        const totalQuantity = Array.isArray(product.inventory_items) 
          ? product.inventory_items.reduce((sum, inv) => sum + (inv.quantity || 0), 0)
          : 0;
        
        const totalValue = 0; // Value calculation removed since unit_value field was removed
        
        // Simple stock status calculation
        let stockStatus: 'healthy' | 'low' | 'critical' | 'out' = 'healthy';
        if (totalQuantity === 0) stockStatus = 'out';
        else if (totalQuantity <= 10) stockStatus = 'critical';
        else if (totalQuantity <= 50) stockStatus = 'low';

        return {
          id: product.id,
          sku: product.sku || `PROD-${product.id.substring(0, 8)}`,
          name: product.name,
          totalQuantity,
          totalValue,
          averageMovement: Math.floor(Math.random() * 20) + 1, // Mock data
          stockStatus,
          reorderSuggestion: stockStatus === 'critical' ? 500 : stockStatus === 'low' ? 200 : 0
        };
      });

      // Create top products from analytics
      const topProductsData: TopProduct[] = processedAnalytics
        .sort((a, b) => b.totalValue - a.totalValue)
        .slice(0, 10)
        .map((product, index) => ({
          rank: index + 1,
          product: product.name,
          sku: product.sku,
          quantity: product.totalQuantity,
          value: product.totalValue,
          velocity: product.averageMovement > 15 ? 'fast' : product.averageMovement > 5 ? 'medium' : 'slow',
          stockDaysLeft: Math.floor(product.totalQuantity / Math.max(product.averageMovement, 1)),
          reorderUrgency: product.stockStatus === 'critical' ? 'critical' : product.stockStatus === 'low' ? 'low' : 'good'
        }));

      setAnalytics(processedAnalytics);
      setTopProducts(topProductsData);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getVelocityColor = (velocity: string) => {
    switch (velocity) {
      case 'fast': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'slow': return 'text-orange-600';
      default: return 'text-muted-foreground';
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'critical': return 'text-red-600';
      case 'low': return 'text-orange-600';
      case 'good': return 'text-green-600';
      default: return 'text-muted-foreground';
    }
  };

  const getStockStatusBadge = (status: string) => {
    switch (status) {
      case 'healthy':
        return <Badge className="bg-green-100 text-green-800">Healthy</Badge>;
      case 'low':
        return <Badge className="bg-yellow-100 text-yellow-800">Low</Badge>;
      case 'critical':
        return <Badge className="bg-red-100 text-red-800">Critical</Badge>;
      case 'out':
        return <Badge className="bg-gray-100 text-gray-800">Out of Stock</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  // Calculate summary metrics
  const totalProducts = analytics.length;
  const totalValue = analytics.reduce((sum, item) => sum + item.totalValue, 0);
  const criticalItems = analytics.filter(item => item.stockStatus === 'critical').length;
  const lowStockItems = analytics.filter(item => item.stockStatus === 'low').length;
  const healthyItems = analytics.filter(item => item.stockStatus === 'healthy').length;

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">Loading analytics...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Analytics Dashboard</h1>
        <p className="text-muted-foreground">Business insights and performance metrics</p>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProducts}</div>
            <p className="text-xs text-muted-foreground">Active products</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalValue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Inventory value</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Items</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{criticalItems}</div>
            <p className="text-xs text-muted-foreground">Need immediate attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Health Score</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round((healthyItems / totalProducts) * 100)}%</div>
            <p className="text-xs text-muted-foreground">Products in good condition</p>
          </CardContent>
        </Card>
      </div>

      {/* Stock Health Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Stock Health Distribution</CardTitle>
          <CardDescription>Overview of your inventory status</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded"></div>
                Healthy Stock
              </span>
              <span className="text-sm">{healthyItems} products</span>
            </div>
            <Progress value={(healthyItems / totalProducts) * 100} className="h-2" />
            
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium flex items-center gap-2">
                <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                Low Stock
              </span>
              <span className="text-sm">{lowStockItems} products</span>
            </div>
            <Progress value={(lowStockItems / totalProducts) * 100} className="h-2" />
            
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded"></div>
                Critical Stock
              </span>
              <span className="text-sm">{criticalItems} products</span>
            </div>
            <Progress value={(criticalItems / totalProducts) * 100} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Top Performing Products */}
      <Card>
        <CardHeader>
          <CardTitle>Top Performing Products</CardTitle>
          <CardDescription>Your highest value inventory items</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rank</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Velocity</TableHead>
                <TableHead>Days Left</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topProducts.map((product) => (
                <TableRow key={product.rank}>
                  <TableCell className="font-medium">#{product.rank}</TableCell>
                  <TableCell>{product.product}</TableCell>
                  <TableCell className="font-mono text-sm">{product.sku}</TableCell>
                  <TableCell>{product.quantity}</TableCell>
                  <TableCell>${product.value.toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge className={getVelocityColor(product.velocity)}>
                      {product.velocity}
                    </Badge>
                  </TableCell>
                  <TableCell className={getUrgencyColor(product.reorderUrgency)}>
                    {product.stockDaysLeft} days
                  </TableCell>
                  <TableCell className={getUrgencyColor(product.reorderUrgency)}>
                    {product.reorderUrgency}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Stock Alert Details */}
      {criticalItems > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-700 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Critical Stock Alerts
            </CardTitle>
            <CardDescription>Products that need immediate restocking</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics
                .filter(item => item.stockStatus === 'critical')
                .map((item) => (
                  <div key={item.id} className="flex justify-between items-center p-3 bg-white rounded border">
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-muted-foreground">SKU: {item.sku}</p>
                      <p className="text-sm text-red-600">Only {item.totalQuantity} units remaining</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">Suggested reorder: {item.reorderSuggestion} units</p>
                      <Badge variant="destructive">Urgent</Badge>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
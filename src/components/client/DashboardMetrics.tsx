import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package, Warehouse, ClipboardList, DollarSign, TrendingUp, AlertTriangle } from 'lucide-react';

interface MetricsProps {
  totalProducts: number;
  totalInventory: number;
  pendingOrders: number;
  totalValue: number;
  lowStockAlerts?: number;
  storageUtilization?: number;
  monthlyFee?: number;
}

export const DashboardMetrics: React.FC<MetricsProps> = ({
  totalProducts,
  totalInventory,
  pendingOrders,
  totalValue,
  lowStockAlerts = 0,
  storageUtilization = 0,
  monthlyFee = 0
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Total Products */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Products</CardTitle>
          <Package className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalProducts}</div>
          <p className="text-xs text-muted-foreground">
            Active product catalog
          </p>
        </CardContent>
      </Card>

      {/* Inventory Items */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Inventory Items</CardTitle>
          <Warehouse className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalInventory.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">
            Items in warehouse
          </p>
        </CardContent>
      </Card>

      {/* Active Orders */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Orders</CardTitle>
          <ClipboardList className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{pendingOrders}</div>
          <p className="text-xs text-muted-foreground">
            Awaiting processing
          </p>
        </CardContent>
      </Card>

      {/* Total Value */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Value</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            ${totalValue.toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">
            Inventory value
          </p>
        </CardContent>
      </Card>

      {/* Storage Utilization */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Storage Used</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{storageUtilization.toFixed(1)}%</div>
          <p className="text-xs text-muted-foreground">
            ${monthlyFee.toLocaleString()}/month
          </p>
        </CardContent>
      </Card>

      {/* Low Stock Alerts */}
      <Card className={lowStockAlerts > 0 ? "border-orange-200 bg-orange-50" : ""}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Stock Alerts</CardTitle>
          <AlertTriangle className={`h-4 w-4 ${lowStockAlerts > 0 ? 'text-orange-500' : 'text-muted-foreground'}`} />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{lowStockAlerts}</div>
          <div className="flex items-center gap-2">
            <p className="text-xs text-muted-foreground">
              Items need restocking
            </p>
            {lowStockAlerts > 0 && (
              <Badge variant="secondary" className="text-orange-600">
                Action needed
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
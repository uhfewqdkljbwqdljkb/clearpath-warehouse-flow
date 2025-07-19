import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package, AlertTriangle, TruckIcon, Calendar } from 'lucide-react';
import { mockOrders, getLowStockItems, getInventoryWithProducts } from '@/data/mockData';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  
  const lowStockItems = getLowStockItems();
  const inventoryWithProducts = getInventoryWithProducts();
  const totalItems = inventoryWithProducts.reduce((sum, item) => sum + item.quantity, 0);
  const activeOrders = mockOrders.filter(order => order.status !== 'delivered').length;
  const todayOrders = mockOrders.filter(order => 
    new Date(order.createdDate).toDateString() === new Date().toDateString()
  ).length;

  if (isAdmin) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Warehouse Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {user?.name}</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Items</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalItems}</div>
              <p className="text-xs text-muted-foreground">
                Across {inventoryWithProducts.length} products
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Orders</CardTitle>
              <TruckIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeOrders}</div>
              <p className="text-xs text-muted-foreground">
                Orders in progress
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Low Stock Alerts</CardTitle>
              <AlertTriangle className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-warning">{lowStockItems.length}</div>
              <p className="text-xs text-muted-foreground">
                Items need reordering
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Orders</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{todayOrders}</div>
              <p className="text-xs text-muted-foreground">
                New orders today
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Low Stock Items</CardTitle>
              <CardDescription>Items that need to be reordered</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {lowStockItems.slice(0, 5).map((item) => (
                  <div key={item.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{item.product?.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.locationRow}{item.locationBin} • {item.product?.sku}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge variant="destructive">{item.quantity} left</Badge>
                      <p className="text-xs text-muted-foreground">
                        Reorder at {item.product?.reorderLevel}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Orders</CardTitle>
              <CardDescription>Latest order activity</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockOrders.slice(0, 5).map((order) => (
                  <div key={order.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{order.orderNumber}</p>
                      <p className="text-sm text-muted-foreground">
                        {order.clientName} • {order.totalItems} items
                      </p>
                    </div>
                    <Badge 
                      variant={
                        order.status === 'delivered' ? 'default' :
                        order.status === 'shipped' ? 'secondary' :
                        order.status === 'picking' ? 'destructive' : 'outline'
                      }
                    >
                      {order.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Client Dashboard
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Client Portal</h1>
        <p className="text-muted-foreground">Welcome back, {user?.name}</p>
      </div>

      {/* Client Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Orders</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeOrders}</div>
            <p className="text-xs text-muted-foreground">
              Orders in progress
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <TruckIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockOrders.length}</div>
            <p className="text-xs text-muted-foreground">
              All time orders
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inventoryWithProducts.length}</div>
            <p className="text-xs text-muted-foreground">
              Products in catalog
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Client Orders */}
      <Card>
        <CardHeader>
          <CardTitle>Your Recent Orders</CardTitle>
          <CardDescription>Track your order status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {mockOrders.map((order) => (
              <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">{order.orderNumber}</p>
                  <p className="text-sm text-muted-foreground">
                    {order.totalItems} items • Created {new Date(order.createdDate).toLocaleDateString()}
                  </p>
                </div>
                <Badge 
                  variant={
                    order.status === 'delivered' ? 'default' :
                    order.status === 'shipped' ? 'secondary' :
                    order.status === 'picking' ? 'destructive' : 'outline'
                  }
                >
                  {order.status}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
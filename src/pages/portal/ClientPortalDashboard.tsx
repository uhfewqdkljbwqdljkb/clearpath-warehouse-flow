import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Package, TrendingUp, Warehouse, AlertTriangle, Eye, RotateCcw } from 'lucide-react';

export const ClientPortalDashboard: React.FC = () => {
  const { profile, company } = useAuth();

  // Mock data for the client portal
  const clientMetrics = {
    totalProducts: {
      label: "Products in Stock",
      value: "1,247",
      breakdown: "89 SKUs",
      trend: "+15%",
      subtitle: "vs last month",
      icon: Package
    },
    activeOrders: {
      label: "Active Orders", 
      value: "23",
      breakdown: "156 items",
      trend: "+8%", 
      subtitle: "vs last week",
      icon: TrendingUp
    },
    storageUsed: {
      label: "Storage Utilization",
      value: "68.5%",
      breakdown: "4.2 of 6.1 m³",
      trend: "+5%",
      subtitle: "monthly avg",
      icon: Warehouse
    },
    lowStockAlerts: {
      label: "Low Stock Items",
      value: "12",
      breakdown: "Need restocking",
      trend: "🔴 Urgent",
      subtitle: "action required",
      icon: AlertTriangle
    }
  };

  const topProducts = [
    {
      rank: 1,
      product: "Wireless Earbuds Pro",
      sku: "TC-002",
      unitsSold: 234,
      revenue: "$11,700",
      margin: "45%",
      trend: "+23%",
      stockDays: 3,
      urgency: "critical"
    },
    {
      rank: 2, 
      product: "Phone Screen Protector",
      sku: "TC-007",
      unitsSold: 189,
      revenue: "$3,780", 
      margin: "65%",
      trend: "+8%",
      stockDays: 45,
      urgency: "good"
    },
    {
      rank: 3,
      product: "USB-C Cables",
      sku: "TC-012",
      unitsSold: 156,
      revenue: "$1,560",
      margin: "40%",
      trend: "+12%",
      stockDays: 22,
      urgency: "good"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-white rounded-lg border p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Welcome back, {profile?.full_name}
            </h1>
            <p className="text-gray-600 mt-1">
              {company?.name} • Account Manager: Sarah Johnson
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Today: {new Date().toLocaleDateString()}</p>
            <p className="text-sm font-medium text-green-600">Next Shipment: Tomorrow</p>
          </div>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Object.entries(clientMetrics).map(([key, metric]) => {
          const Icon = metric.icon;
          return (
            <Card key={key} className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {metric.label}
                </CardTitle>
                <Icon className="h-4 w-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900 mb-1">
                  {metric.value}
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-500">{metric.breakdown}</p>
                  <Badge variant="secondary" className="text-xs">
                    {metric.trend}
                  </Badge>
                </div>
                <p className="text-xs text-gray-500 mt-1">{metric.subtitle}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Top Selling Products */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Top Selling Products (Last 30 Days)</span>
            <Button variant="outline" size="sm">
              <Eye className="h-4 w-4 mr-2" />
              View All
            </Button>
          </CardTitle>
          <CardDescription>
            Products performing best in sales volume and revenue
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topProducts.map((product) => (
              <div key={product.rank} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-700 rounded-full font-semibold text-sm">
                    {product.rank}
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{product.product}</h4>
                    <p className="text-sm text-gray-500">SKU: {product.sku}</p>
                  </div>
                </div>
                <div className="text-right space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">{product.unitsSold} sold</span>
                    <Badge variant={product.urgency === 'critical' ? 'destructive' : 'secondary'}>
                      {product.stockDays} days stock
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <span>{product.revenue}</span>
                    <span>•</span>
                    <span className="text-green-600">{product.trend}</span>
                  </div>
                </div>
                {product.urgency === 'critical' && (
                  <Button size="sm" variant="destructive">
                    <RotateCcw className="h-4 w-4 mr-1" />
                    Restock
                  </Button>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardHeader>
            <CardTitle className="text-lg">View Full Inventory</CardTitle>
            <CardDescription>
              See all your products with real-time stock levels
            </CardDescription>
          </CardHeader>
        </Card>
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardHeader>
            <CardTitle className="text-lg">Track Orders</CardTitle>
            <CardDescription>
              Monitor active orders and shipment status
            </CardDescription>
          </CardHeader>
        </Card>
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardHeader>
            <CardTitle className="text-lg">Storage Overview</CardTitle>
            <CardDescription>
              Review your warehouse space utilization
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
};
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, Warehouse, ClipboardList, TrendingUp } from 'lucide-react';

interface DashboardStats {
  totalProducts: number;
  totalInventory: number;
  pendingOrders: number;
  totalValue: number;
}

export const ClientDashboard: React.FC = () => {
  const { profile, company } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    totalInventory: 0,
    pendingOrders: 0,
    totalValue: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!profile?.company_id) return;

      try {
        // Fetch products count
        const { count: productsCount } = await supabase
          .from('client_products')
          .select('*', { count: 'exact', head: true })
          .eq('company_id', profile.company_id)
          .eq('is_active', true);

        // Fetch inventory items
        const { data: inventoryData } = await supabase
          .from('inventory_items')
          .select('quantity, client_products!inner(unit_value)')
          .eq('company_id', profile.company_id);

        const totalInventory = inventoryData?.reduce((sum, item) => sum + item.quantity, 0) || 0;
        const totalValue = inventoryData?.reduce((sum, item) => {
          return sum + (item.quantity * (item.client_products.unit_value || 0));
        }, 0) || 0;

        // Fetch pending orders count
        const { count: pendingOrdersCount } = await supabase
          .from('client_orders')
          .select('*', { count: 'exact', head: true })
          .eq('company_id', profile.company_id)
          .in('status', ['pending', 'approved', 'in_progress']);

        setStats({
          totalProducts: productsCount || 0,
          totalInventory,
          pendingOrders: pendingOrdersCount || 0,
          totalValue: Math.round(totalValue * 100) / 100
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [profile?.company_id]);

  if (isLoading) {
    return <div>Loading dashboard...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {profile?.full_name}! Here's an overview of your inventory.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProducts}</div>
            <p className="text-xs text-muted-foreground">
              Active products in catalog
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inventory Items</CardTitle>
            <Warehouse className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalInventory}</div>
            <p className="text-xs text-muted-foreground">
              Total units in warehouse
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingOrders}</div>
            <p className="text-xs text-muted-foreground">
              Orders awaiting processing
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalValue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Total inventory value
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Company Information</CardTitle>
            <CardDescription>Your registered company details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Company Name</label>
              <p className="text-sm">{company?.name || 'Not specified'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Contact Person</label>
              <p className="text-sm">{company?.contact_person || 'Not specified'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Email</label>
              <p className="text-sm">{company?.email || 'Not specified'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Phone</label>
              <p className="text-sm">{company?.phone || 'Not specified'}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks you might want to perform</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm space-y-2">
              <p>• Add new products to your catalog</p>
              <p>• View current inventory levels</p>
              <p>• Submit receive/ship orders</p>
              <p>• Update company profile</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Package, Warehouse, ClipboardList, DollarSign, Plus, FileText, Truck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface DashboardStats {
  totalProducts: number;
  totalInventory: number;
  pendingOrders: number;
  totalValue: number;
}

export const ClientDashboard: React.FC = () => {
  const { profile, company } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    totalInventory: 0,
    pendingOrders: 0,
    totalValue: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (profile?.company_id) {
      fetchDashboardStats();
    }
  }, [profile?.company_id]);

  const fetchDashboardStats = async () => {
    if (!profile?.company_id) return;

    try {
      // Fetch products count
      const { count: productsCount } = await supabase
        .from('client_products')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', profile.company_id)
        .eq('is_active', true);

      // Fetch inventory stats
      const { data: inventoryData } = await supabase
        .from('inventory_items')
        .select(`
          quantity,
          client_products!inner (
            unit_value
          )
        `)
        .eq('company_id', profile.company_id)
        .gt('quantity', 0);

      // Calculate inventory stats
      const totalInventory = inventoryData?.reduce((sum, item) => sum + item.quantity, 0) || 0;
      const totalValue = inventoryData?.reduce((sum, item) => {
        const unitValue = item.client_products?.unit_value || 0;
        return sum + (item.quantity * unitValue);
      }, 0) || 0;

      // Fetch orders count
      const { count: ordersCount } = await supabase
        .from('client_orders')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', profile.company_id)
        .in('status', ['pending', 'approved', 'in_progress']);

      setStats({
        totalProducts: productsCount || 0,
        totalInventory,
        pendingOrders: ordersCount || 0,
        totalValue
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          Welcome back, {profile?.full_name || 'Client'}
        </h1>
        <p className="text-muted-foreground mt-2">
          Here's an overview of your warehouse operations
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProducts}</div>
            <p className="text-xs text-muted-foreground">
              Active product catalog
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
              Items in warehouse
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
              Awaiting processing
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${stats.totalValue.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Inventory value
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Company Information */}
      {company && (
        <Card>
          <CardHeader>
            <CardTitle>Company Information</CardTitle>
            <CardDescription>Your registered company details</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-sm text-muted-foreground">Company Name</h4>
              <p className="text-base">{company.name}</p>
            </div>
            <div>
              <h4 className="font-medium text-sm text-muted-foreground">Contact Person</h4>
              <p className="text-base">{company.contact_person || 'Not specified'}</p>
            </div>
            <div>
              <h4 className="font-medium text-sm text-muted-foreground">Email</h4>
              <p className="text-base">{company.email || 'Not specified'}</p>
            </div>
            <div>
              <h4 className="font-medium text-sm text-muted-foreground">Phone</h4>
              <p className="text-base">{company.phone || 'Not specified'}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks to get you started</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button 
              onClick={() => navigate('/client/products')}
              className="h-16 flex-col gap-2"
              variant="outline"
            >
              <Plus className="h-5 w-5" />
              Add Products
            </Button>
            <Button 
              onClick={() => navigate('/client/orders')}
              className="h-16 flex-col gap-2"
              variant="outline"
            >
              <FileText className="h-5 w-5" />
              Create Order
            </Button>
            <Button 
              onClick={() => navigate('/client/inventory')}
              className="h-16 flex-col gap-2"
              variant="outline"
            >
              <Truck className="h-5 w-5" />
              View Inventory
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
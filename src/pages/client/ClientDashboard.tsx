import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useIntegration } from '@/contexts/IntegrationContext';
import { supabase } from '@/integrations/supabase/client';
import { DashboardMetrics } from '@/components/client/DashboardMetrics';
import { RecentActivity } from '@/components/client/RecentActivity';
import { EnhancedActivityFeed } from '@/components/EnhancedActivityFeed';
import { QuickActions } from '@/components/client/QuickActions';
import { StorageAllocationCard } from '@/components/client/StorageAllocationCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useInventorySync, useOrderSync } from '@/hooks/useRealTimeSync';
import { useToast } from '@/hooks/use-toast';

interface DashboardStats {
  totalProducts: number;
  totalInventory: number;
  pendingOrders: number;
  totalValue: number;
  lowStockAlerts: number;
  storageUtilization: number;
  monthlyFee: number;
}

export const ClientDashboard: React.FC = () => {
  const { profile, company } = useAuth();
  const { logActivity } = useIntegration();
  const { toast } = useToast();
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    totalInventory: 0,
    pendingOrders: 0,
    totalValue: 0,
    lowStockAlerts: 0,
    storageUtilization: 0,
    monthlyFee: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [debugInfo, setDebugInfo] = useState<any>(null);

  // Real-time sync for inventory and orders
  useInventorySync(() => {
    fetchDashboardStats();
  });

  useOrderSync(() => {
    fetchDashboardStats();
  });

  useEffect(() => {
    if (profile?.company_id) {
      fetchDashboardStats();
      // Log dashboard access
      logActivity('dashboard_access', 'User accessed client dashboard', {
        timestamp: new Date().toISOString()
      });
    }
  }, [profile?.company_id]);

  const fetchDashboardStats = async () => {
    if (!profile?.company_id) {
      setDebugInfo({ 
        error: 'No company_id found',
        profile: profile,
        company: company 
      });
      return;
    }

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

      // Calculate low stock alerts (products with less than 50 items)
      const { data: lowStockData } = await supabase
        .from('inventory_items')
        .select('client_products!inner(*)')
        .eq('company_id', profile.company_id)
        .lt('quantity', 50);

      const lowStockAlerts = lowStockData?.length || 0;

      // Get company storage info  
      const storageUtilization = (company as any)?.max_storage_cubic_feet ? 
        Math.min((totalInventory * 0.001) / (company as any).max_storage_cubic_feet * 100, 100) : 0;
      const monthlyFee = (company as any)?.monthly_fee || 0;

      setStats({
        totalProducts: productsCount || 0,
        totalInventory,
        pendingOrders: ordersCount || 0,
        totalValue,
        lowStockAlerts,
        storageUtilization,
        monthlyFee
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      setDebugInfo({ 
        error: error,
        profile: profile,
        company: company 
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  // Show debug info if there's an issue
  if (debugInfo?.error) {
    return (
      <div className="space-y-6">
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="text-yellow-800">Data Loading Issue</CardTitle>
            <CardDescription>
              {!profile?.company_id 
                ? 'Your account is not linked to a company. Please contact support.'
                : 'There was an error loading your dashboard data.'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-yellow-700">
              <p><strong>Profile ID:</strong> {profile?.id || 'None'}</p>
              <p><strong>Company ID:</strong> {profile?.company_id || 'None'}</p>
              <p><strong>Company Name:</strong> {company?.name || 'None'}</p>
              <p><strong>User Email:</strong> {profile?.email || 'None'}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
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

      {/* Enhanced Stats Grid */}
      <DashboardMetrics
        totalProducts={stats.totalProducts}
        totalInventory={stats.totalInventory}
        pendingOrders={stats.pendingOrders}
        totalValue={stats.totalValue}
        lowStockAlerts={stats.lowStockAlerts}
        storageUtilization={stats.storageUtilization}
        monthlyFee={stats.monthlyFee}
      />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Storage Allocation */}
        <StorageAllocationCard
          totalAllocated={((company as any)?.max_storage_cubic_feet || 6100) / 1000}
          totalUsed={stats.totalInventory * 0.001}
          utilizationPercentage={stats.storageUtilization}
          monthlyCost={stats.monthlyFee}
        />

        {/* Recent Activity */}
        <EnhancedActivityFeed limit={8} showAllUsers={false} />
      </div>

      {/* Quick Actions */}
      <QuickActions />

      {/* Company Information - Moved to Bottom */}
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
    </div>
  );
};
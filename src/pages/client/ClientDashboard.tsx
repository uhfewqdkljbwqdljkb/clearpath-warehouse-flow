import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useIntegration } from '@/contexts/IntegrationContext';
import { supabase } from '@/integrations/supabase/client';
import { DashboardMetrics } from '@/components/client/DashboardMetrics';
import { RecentActivity } from '@/components/client/RecentActivity';
import { StorageAllocationCard } from '@/components/client/StorageAllocationCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export const ClientDashboard: React.FC = () => {
  const { profile, company } = useAuth();
  const { logActivity } = useIntegration();
  const [isLoading, setIsLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    totalProducts: 0,
    totalInventory: 0,
    pendingOrders: 0,
    totalValue: 0,
    lowStockAlerts: 0,
  });

  useEffect(() => {
    if (profile?.company_id) {
      fetchDashboardData();
      logActivity('dashboard_access', 'User accessed dashboard', {
        timestamp: new Date().toISOString()
      });
    }
  }, [profile?.company_id]);

  const fetchDashboardData = async () => {
    if (!profile?.company_id) return;

    try {
      // Fetch total products
      const { count: productsCount } = await supabase
        .from('client_products')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', profile.company_id)
        .eq('is_active', true);

      // Fetch inventory items
      const { data: inventoryData } = await supabase
        .from('inventory_items')
        .select('quantity')
        .eq('company_id', profile.company_id);

      const totalInventory = inventoryData?.reduce((sum, item) => sum + item.quantity, 0) || 0;

      // Fetch pending orders
      const { count: pendingCount } = await supabase
        .from('client_orders')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', profile.company_id)
        .in('status', ['pending', 'processing']);

      setMetrics({
        totalProducts: productsCount || 0,
        totalInventory,
        pendingOrders: pendingCount || 0,
        totalValue: 0, // Calculate based on your business logic
        lowStockAlerts: 0, // Calculate based on your business logic
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-10 w-64 mb-2" />
          <Skeleton className="h-5 w-96" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {profile?.full_name || 'User'}
        </p>
      </div>

      {/* Metrics */}
      <DashboardMetrics {...metrics} />

      {/* Storage Allocation */}
      {company && company.location_type && (
        <StorageAllocationCard
          companyId={company.id}
          locationType={company.location_type}
        />
      )}

      {/* Recent Activity */}
      <RecentActivity />
    </div>
  );
};

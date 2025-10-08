
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Package, Users, Building, Activity } from 'lucide-react';
import { MetricCard } from './MetricCard';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ActivityFeed } from './ActivityFeed';
import { AdminDashboardEnhancements } from './AdminDashboardEnhancements';
import { supabase } from '@/integrations/supabase/client';

interface DashboardStats {
  totalClients: number;
  activeClients: number;
  totalProducts: number;
  totalInventoryValue: number;
  totalOrders: number;
  recentActivities: number;
}

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalClients: 0,
    activeClients: 0,
    totalProducts: 0,
    totalInventoryValue: 0,
    totalOrders: 0,
    recentActivities: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      // Fetch clients
      const { data: companies } = await supabase
        .from('companies')
        .select('*');
      
      // Fetch products
      const { data: products } = await supabase
        .from('client_products')
        .select(`
          *,
          inventory_items(quantity)
        `);
      
      // Fetch orders
      const { data: orders } = await supabase
        .from('client_orders')
        .select('*');
      
      // Fetch recent activities
      const { data: activities } = await supabase
        .from('client_activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      // Calculate inventory value - no longer available since unit_value was removed
      let totalValue = 0;

      setStats({
        totalClients: companies?.length || 0,
        activeClients: companies?.filter(c => c.is_active).length || 0,
        totalProducts: products?.length || 0,
        totalInventoryValue: totalValue,
        totalOrders: orders?.length || 0,
        recentActivities: activities?.length || 0
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-muted-foreground">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Admin Dashboard Enhancements */}
      <AdminDashboardEnhancements />

      {/* Key Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Clients"
          value={stats.totalClients.toString()}
          icon={Users}
          subtitle={`${stats.activeClients} active`}
        />
        <MetricCard
          title="Total Products"
          value={stats.totalProducts.toString()}
          icon={Package}
          subtitle="Product catalog"
        />
        <MetricCard
          title="Inventory Value"
          value={`$${stats.totalInventoryValue.toLocaleString()}`}
          icon={Building}
          subtitle="Total value"
        />
        <MetricCard
          title="Recent Activity"
          value={stats.recentActivities.toString()}
          icon={Activity}
          subtitle="Latest actions"
        />
      </div>

      {/* Activity Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="activity">Recent Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Business Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-primary">{stats.totalClients}</div>
                  <div className="text-sm text-muted-foreground">Total Clients</div>
                  <div className="text-xs text-muted-foreground mt-1">{stats.activeClients} active</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-primary">{stats.totalProducts}</div>
                  <div className="text-sm text-muted-foreground">Products Managed</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-primary">${stats.totalInventoryValue.toLocaleString()}</div>
                  <div className="text-sm text-muted-foreground">Inventory Value</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <ActivityFeed />
        </TabsContent>
      </Tabs>
    </div>
  );
};

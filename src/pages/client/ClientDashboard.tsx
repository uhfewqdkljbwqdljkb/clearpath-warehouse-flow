import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useIntegration } from '@/contexts/IntegrationContext';
import { supabase } from '@/integrations/supabase/client';
import { DashboardMetrics } from '@/components/client/DashboardMetrics';
import { RecentActivity } from '@/components/client/RecentActivity';
import { StorageAllocationCard } from '@/components/client/StorageAllocationCard';
import { QuickActions } from '@/components/client/QuickActions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Bot, MessageSquare, Package, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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

  const navigate = useNavigate();

  return (
    <div className="space-y-8">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-background border border-border/50 p-8">
        <div className="relative z-10">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-4xl font-bold text-foreground mb-2">
                Welcome back, {profile?.full_name || 'User'}
              </h1>
              <p className="text-muted-foreground text-lg">
                Here's what's happening with your inventory today
              </p>
            </div>
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                size="lg"
                onClick={() => navigate('/client/ai-assistant')}
                className="gap-2 hover:bg-primary/10 border-primary/20"
              >
                <Bot className="h-5 w-5" />
                AI Assistant
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                onClick={() => navigate('/client/messages')}
                className="gap-2 hover:bg-primary/10 border-primary/20"
              >
                <MessageSquare className="h-5 w-5" />
                Messages
              </Button>
            </div>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -z-0" />
      </div>

      {/* Metrics */}
      <DashboardMetrics {...metrics} />

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Storage & Quick Actions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Storage Allocation */}
          {company && company.location_type && (
            <StorageAllocationCard
              companyId={company.id}
              locationType={company.location_type}
            />
          )}
          
          {/* Quick Actions */}
          <QuickActions />
        </div>

        {/* Right Column - Recent Activity */}
        <div className="lg:col-span-1">
          <RecentActivity />
        </div>
      </div>
    </div>
  );
};

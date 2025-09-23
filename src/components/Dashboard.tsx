
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Package, Users, MapPin, TrendingUp, Building, AlertTriangle, BarChart3, Activity } from 'lucide-react';
import { MetricCard } from './MetricCard';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { CapacityOverview } from './CapacityOverview';
import { UtilizationChart } from './UtilizationChart';
import { AlertsPanel } from './AlertsPanel';
import { ActivityFeed } from './ActivityFeed';
import { AdminDashboardEnhancements } from './AdminDashboardEnhancements';
import { SystemStatusSummary } from './SystemStatusSummary';
import { ClientPerformance } from './ClientPerformance';
import { mockClients, mockClientAllocations, mockProducts, warehouseZones, mockCapacityMetrics, mockCapacityAlerts } from '@/data/mockData';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();

  // Calculate key metrics
  const totalClients = mockClients.length;
  const totalAllocations = mockClientAllocations.length;
  const totalProducts = mockProducts.length;
  const totalZones = warehouseZones.length;
  
  const totalCapacity = mockCapacityMetrics.reduce((sum, zone) => sum + zone.totalCapacity, 0);
  const usedCapacity = mockCapacityMetrics.reduce((sum, zone) => sum + zone.usedCapacity, 0);
  const utilizationPercentage = Math.round((usedCapacity / totalCapacity) * 100);
  
  const activeAlerts = mockCapacityAlerts.filter(alert => !alert.acknowledged).length;

  return (
    <div className="space-y-6">
      {/* System Status Summary */}
      <SystemStatusSummary />
      
      {/* Admin Dashboard Enhancements */}
      <AdminDashboardEnhancements />

      {/* Key Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Clients"
          value={totalClients.toString()}
          icon={Users}
          trend="+12%"
          trendType="positive"
          subtitle="Client accounts"
        />
        <MetricCard
          title="Active Allocations"
          value={totalAllocations.toString()}
          icon={MapPin}
          trend="+8%"
          trendType="positive"
          subtitle="Space allocations"
        />
        <MetricCard
          title="Warehouse Utilization"
          value={`${utilizationPercentage}%`}
          icon={Building}
          trend="+5%"
          trendType="positive"
          subtitle="Capacity used"
        />
        <MetricCard
          title="Active Alerts"
          value={activeAlerts.toString()}
          icon={AlertTriangle}
          trend="-2"
          trendType="negative"
          subtitle="Capacity alerts"
        />
      </div>

      {/* Analytics Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <CapacityOverview />
            <AlertsPanel />
          </div>
          <UtilizationChart />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <UtilizationChart />
            <ClientPerformance />
          </div>
          
          {/* Zone Performance Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Warehouse Performance Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{totalCapacity.toLocaleString()}</div>
                  <div className="text-sm text-gray-500">Total Capacity (ft³)</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{usedCapacity.toLocaleString()}</div>
                  <div className="text-sm text-gray-500">Used Capacity (ft³)</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{(totalCapacity - usedCapacity).toLocaleString()}</div>
                  <div className="text-sm text-gray-500">Available Capacity (ft³)</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{totalProducts}</div>
                  <div className="text-sm text-gray-500">Total Products</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <ActivityFeed />
            <AlertsPanel />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

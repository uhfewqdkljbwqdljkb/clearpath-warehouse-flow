
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Package, ClipboardList, AlertTriangle, TruckIcon } from 'lucide-react';
import { MetricCard } from './MetricCard';
import { OrderVolumeChart } from './OrderVolumeChart';
import { WarehouseMap } from './WarehouseMap';
import { InventoryValue } from './InventoryValue';
import { RecentOrdersTable } from './RecentOrdersTable';
import { RecentActivity } from './RecentActivity';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  if (isAdmin) {
    return (
      <div className="space-y-6">
        {/* Top Row - Key Metrics Cards (4 columns) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Total Items"
            value="2,394"
            trend="+12%"
            trendType="positive"
            subtitle="vs last month"
            icon={Package}
          />
          <MetricCard
            title="Active Orders"
            value="156"
            trend="+8%"
            trendType="positive"
            subtitle="vs last week"
            icon={TruckIcon}
          />
          <MetricCard
            title="Pending Orders"
            value="23"
            trend="-5%"
            trendType="negative"
            subtitle="vs yesterday"
            icon={ClipboardList}
          />
          <MetricCard
            title="Low Stock Alerts"
            value="18"
            trend="+3"
            trendType="neutral"
            subtitle="items below threshold"
            icon={AlertTriangle}
          />
        </div>

        {/* Second Row - Charts and Visual Data (3 columns) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <OrderVolumeChart />
          <WarehouseMap />
          <InventoryValue />
        </div>

        {/* Third Row - Data Tables and Activity (2 columns) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RecentOrdersTable />
          <RecentActivity />
        </div>
      </div>
    );
  }

  // Client Dashboard - Simplified version
  return (
    <div className="space-y-6">
      {/* Client Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard
          title="Active Orders"
          value="12"
          trend="+2"
          trendType="positive"
          subtitle="vs last week"
          icon={ClipboardList}
        />
        <MetricCard
          title="Total Orders"
          value="45"
          trend="+15%"
          trendType="positive"
          subtitle="vs last month"
          icon={TruckIcon}
        />
        <MetricCard
          title="Available Products"
          value="1,250"
          trend="stable"
          trendType="neutral"
          subtitle="in catalog"
          icon={Package}
        />
      </div>

      {/* Client Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentOrdersTable />
        <RecentActivity />
      </div>
    </div>
  );
};

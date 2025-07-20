import React from 'react';
import { Package, TrendingUp, Warehouse } from 'lucide-react';
import { WarehouseMetricsCard } from '@/components/WarehouseMetricsCard';
import { WarehouseInventoryChart } from '@/components/WarehouseInventoryChart';
import { CapacityUsageDonut } from '@/components/CapacityUsageDonut';
import { WarehouseStorageTable } from '@/components/WarehouseStorageTable';
import { PackageStatusWidget } from '@/components/PackageStatusWidget';
import { WarehouseMapView } from '@/components/WarehouseMapView';
import { WarehouseActivityLog } from '@/components/WarehouseActivityLog';

export const Locations = () => {
  return (
    <div className="p-6 space-y-6">
      {/* Top Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <WarehouseMetricsCard
          title="Total SKU"
          value="285"
          trend="+2.50%"
          trendType="positive"
          icon={Package}
        />
        <WarehouseMetricsCard
          title="Quantity on Hand"
          value="12,450"
          subtitle="units"
          trend="+4.37%"
          trendType="positive"
          icon={TrendingUp}
        />
        <WarehouseMetricsCard
          title="Capacity Usage"
          value="62.5%"
          subtitle="Full"
          trend="+1.54%"
          trendType="positive"
          icon={Warehouse}
        />
      </div>

      {/* Second Row - Inventory & Capacity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <WarehouseInventoryChart />
        </div>
        <CapacityUsageDonut percentage={62.5} loadedShelves={40} emptyShelves={24} />
      </div>

      {/* Third Row - Storage Table & Package Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <WarehouseStorageTable />
        </div>
        <PackageStatusWidget />
      </div>

      {/* Bottom Row - Map & Activity Log */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <WarehouseMapView />
        </div>
        <WarehouseActivityLog />
      </div>
    </div>
  );
};
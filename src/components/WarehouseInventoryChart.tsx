import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const inventoryData = [
  { category: 'Electronics', percentage: 25, packages: 2500, color: 'bg-red-500' },
  { category: 'Apparel', percentage: 20, packages: 2000, color: 'bg-red-400' },
  { category: 'Home & Kitchen', percentage: 18, packages: 1800, color: 'bg-gray-800' },
  { category: 'Beauty & Health', percentage: 15, packages: 1500, color: 'bg-gray-600' },
  { category: 'Automotive Parts', percentage: 12, packages: 1200, color: 'bg-gray-400' },
  { category: 'Sports Equipment', percentage: 10, packages: 1000, color: 'bg-gray-300' },
];

export const WarehouseInventoryChart: React.FC = () => {
  const totalPackages = inventoryData.reduce((sum, item) => sum + item.packages, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Warehouse Inventory</CardTitle>
        <div className="text-2xl font-bold">
          {totalPackages.toLocaleString()} <span className="text-sm font-normal text-muted-foreground">packages</span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {inventoryData.map((item, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{item.category}</span>
                <span className="font-medium">{item.percentage}%</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className={`w-6 h-6 ${item.color} rounded`}></div>
                <span className="text-sm font-medium">{item.packages.toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
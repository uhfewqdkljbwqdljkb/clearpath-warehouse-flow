import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronDown, Filter } from 'lucide-react';

const storageData = [
  { floor: 1, section: 'A1 - A10', category: 'Electronics', percentage: 80, available: '20/100' },
  { floor: 2, section: 'B1 - B10', category: 'Apparel', percentage: 60, available: '40/100' },
  { floor: 1, section: 'C1 - C10', category: 'Home & Kitchen', percentage: 90, available: '10/100' },
  { floor: 3, section: 'D1 - D10', category: 'Automotive Parts', percentage: 50, available: '50/100' },
  { floor: 2, section: 'E1 - E10', category: 'Beauty & Health', percentage: 70, available: '30/100' },
];

export const WarehouseStorageTable: React.FC = () => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Warehouse Storage</CardTitle>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filter
            <ChevronDown className="h-4 w-4 ml-2" />
          </Button>
          <div className="text-sm text-muted-foreground">
            Sort by: Section
            <ChevronDown className="h-4 w-4 ml-1 inline" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b text-left">
                <th className="pb-2 text-sm font-medium text-muted-foreground">Floor</th>
                <th className="pb-2 text-sm font-medium text-muted-foreground">Section</th>
                <th className="pb-2 text-sm font-medium text-muted-foreground">Category</th>
                <th className="pb-2 text-sm font-medium text-muted-foreground">Storage Used</th>
                <th className="pb-2 text-sm font-medium text-muted-foreground">Percentage</th>
                <th className="pb-2 text-sm font-medium text-muted-foreground">Available Space</th>
              </tr>
            </thead>
            <tbody>
              {storageData.map((row, index) => (
                <tr key={index} className="border-b">
                  <td className="py-3 text-sm">{row.floor}</td>
                  <td className="py-3 text-sm font-medium">{row.section}</td>
                  <td className="py-3 text-sm">{row.category}</td>
                  <td className="py-3">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-red-500 h-2 rounded-full" 
                        style={{ width: `${row.percentage}%` }}
                      ></div>
                    </div>
                  </td>
                  <td className="py-3 text-sm font-medium">{row.percentage}%</td>
                  <td className="py-3 text-sm">{row.available}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

import React from 'react';
import { ChevronDown } from 'lucide-react';

export const WarehouseMap: React.FC = () => {
  return (
    <div className="chart-container">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">Warehouse Locations</h3>
        <div className="flex items-center space-x-1 text-sm text-muted-foreground cursor-pointer hover:text-foreground">
          <span>Last 7 Days</span>
          <ChevronDown className="h-4 w-4" />
        </div>
      </div>
      <div className="h-64 relative">
        <div className="grid grid-cols-4 gap-2 h-full">
          <div className="bg-success/20 rounded border-2 border-success/30 flex items-center justify-center">
            <div className="text-center">
              <div className="text-xs font-medium text-success">Zone A</div>
              <div className="text-xs text-muted-foreground">Electronics</div>
            </div>
          </div>
          <div className="bg-destructive/20 rounded border-2 border-destructive/30 flex items-center justify-center">
            <div className="text-center">
              <div className="text-xs font-medium text-destructive">Zone B</div>
              <div className="text-xs text-muted-foreground">Clothing</div>
            </div>
          </div>
          <div className="bg-muted rounded border-2 border-border flex items-center justify-center">
            <div className="text-center">
              <div className="text-xs font-medium text-muted-foreground">Zone C</div>
              <div className="text-xs text-muted-foreground">Storage</div>
            </div>
          </div>
          <div className="bg-warning/20 rounded border-2 border-warning/30 flex items-center justify-center">
            <div className="text-center">
              <div className="text-xs font-medium text-warning">Zone D</div>
              <div className="text-xs text-muted-foreground">Shipping</div>
            </div>
          </div>
        </div>
        <div className="absolute bottom-2 right-2 flex space-x-2 text-xs">
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-success rounded"></div>
            <span>Active</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-destructive rounded"></div>
            <span>Busy</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-2 h-2 bg-muted rounded"></div>
            <span>Inactive</span>
          </div>
        </div>
      </div>
    </div>
  );
};

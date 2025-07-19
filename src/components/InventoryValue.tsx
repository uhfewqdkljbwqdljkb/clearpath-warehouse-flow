
import React from 'react';
import { ChevronDown } from 'lucide-react';

export const InventoryValue: React.FC = () => {
  return (
    <div className="chart-container">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">Inventory Value</h3>
        <div className="flex items-center space-x-1 text-sm text-muted-foreground cursor-pointer hover:text-foreground">
          <span>This Year</span>
          <ChevronDown className="h-4 w-4" />
        </div>
      </div>
      <div className="h-64 flex items-center justify-center">
        <div className="relative">
          <svg className="w-40 h-40 transform -rotate-90">
            <circle
              cx="80"
              cy="80"
              r="70"
              stroke="hsl(var(--muted))"
              strokeWidth="8"
              fill="transparent"
            />
            <circle
              cx="80"
              cy="80"
              r="70"
              stroke="hsl(var(--accent))"
              strokeWidth="8"
              fill="transparent"
              strokeDasharray={`${2 * Math.PI * 70 * 0.75} ${2 * Math.PI * 70}`}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">$473,265</div>
              <div className="text-sm text-muted-foreground">Total Inventory Value</div>
              <div className="text-xs text-accent font-medium mt-1">75% of capacity</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface CapacityUsageDonutProps {
  percentage: number;
  loadedShelves: number;
  emptyShelves: number;
}

export const CapacityUsageDonut: React.FC<CapacityUsageDonutProps> = ({
  percentage,
  loadedShelves,
  emptyShelves
}) => {
  const circumference = 2 * Math.PI * 45;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Capacity Usage</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center">
        <div className="relative w-32 h-32 mb-4">
          <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
            {/* Background circle */}
            <circle
              cx="50"
              cy="50"
              r="45"
              stroke="#e5e7eb"
              strokeWidth="10"
              fill="none"
            />
            {/* Progress circle */}
            <circle
              cx="50"
              cy="50"
              r="45"
              stroke="#ef4444"
              strokeWidth="10"
              fill="none"
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-300"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-xl font-bold">Total Usage</div>
              <div className="text-2xl font-bold">{percentage}%</div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 w-full text-center">
          <div>
            <div className="text-lg font-bold">{loadedShelves}</div>
            <div className="text-sm text-muted-foreground">Loaded shelves</div>
          </div>
          <div>
            <div className="text-lg font-bold">{emptyShelves}</div>
            <div className="text-sm text-muted-foreground">Empty shelves</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
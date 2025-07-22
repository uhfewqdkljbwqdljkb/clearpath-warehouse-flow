import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { mockCapacityMetrics } from '@/data/mockData';
import { CapacityMetrics } from '@/types';

export const CapacityOverview: React.FC = () => {
  const getTrendIcon = (trend: CapacityMetrics['trend']) => {
    switch (trend) {
      case 'increasing':
        return <TrendingUp className="h-4 w-4 text-red-500" />;
      case 'decreasing':
        return <TrendingDown className="h-4 w-4 text-green-500" />;
      default:
        return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  const getUtilizationColor = (percentage: number) => {
    if (percentage >= 90) return 'text-red-600';
    if (percentage >= 75) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 75) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Zone Capacity Overview
          {mockCapacityMetrics.some(zone => zone.utilizationPercentage >= 90) && (
            <AlertTriangle className="h-4 w-4 text-red-500" />
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {mockCapacityMetrics.map((zone) => (
            <div key={zone.zoneId} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium text-sm">{zone.zoneName}</h4>
                  {getTrendIcon(zone.trend)}
                </div>
                <Badge 
                  variant={zone.utilizationPercentage >= 90 ? "destructive" : 
                           zone.utilizationPercentage >= 75 ? "default" : "secondary"}
                >
                  {zone.utilizationPercentage}%
                </Badge>
              </div>
              
              <Progress 
                value={zone.utilizationPercentage} 
                className="h-2 [&>div]:bg-green-500"
              />
              
              <div className="flex justify-between text-xs text-gray-600">
                <span>Used: {zone.usedCapacity.toLocaleString()} ft³</span>
                <span>Available: {zone.availableCapacity.toLocaleString()} ft³</span>
                <span>Total: {zone.totalCapacity.toLocaleString()} ft³</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
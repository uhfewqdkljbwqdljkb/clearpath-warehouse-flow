import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { mockClientAnalytics } from '@/data/mockData';

export const ClientPerformance: React.FC = () => {
  const getGrowthIcon = (growthRate: number) => {
    if (growthRate > 0) {
      return <TrendingUp className="h-4 w-4 text-green-500" />;
    } else if (growthRate < 0) {
      return <TrendingDown className="h-4 w-4 text-red-500" />;
    }
    return <Activity className="h-4 w-4 text-gray-500" />;
  };

  const getGrowthColor = (growthRate: number) => {
    if (growthRate > 0) return 'text-green-600';
    if (growthRate < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getUtilizationBadge = (utilization: number) => {
    if (utilization >= 80) return 'default';
    if (utilization >= 60) return 'secondary';
    return 'outline';
  };

  const formatLastActivity = (date: Date) => {
    return new Intl.RelativeTimeFormat('en', { numeric: 'auto' }).format(
      Math.floor((date.getTime() - Date.now()) / (1000 * 60 * 60)), 'hour'
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Client Performance Analytics</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {mockClientAnalytics.map((client) => (
            <div key={client.clientId} className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium">{client.clientName}</h4>
                <Badge variant={getUtilizationBadge(client.averageUtilization)}>
                  {client.averageUtilization}% avg utilization
                </Badge>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Allocations</p>
                  <p className="font-medium">{client.totalAllocations}</p>
                </div>
                <div>
                  <p className="text-gray-500">Capacity Used</p>
                  <p className="font-medium">{client.totalCapacityUsed.toLocaleString()} ft³</p>
                </div>
                <div>
                  <p className="text-gray-500">Growth Rate</p>
                  <div className="flex items-center gap-1">
                    {getGrowthIcon(client.growthRate)}
                    <span className={`font-medium ${getGrowthColor(client.growthRate)}`}>
                      {client.growthRate > 0 ? '+' : ''}{client.growthRate.toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-gray-500">Last Activity</p>
                  <p className="font-medium">{formatLastActivity(client.lastActivity)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { TruckIcon, Package, RotateCcw, CheckCircle, Clock } from 'lucide-react';

interface ShipmentStats {
  inTransit: number;
  delivered: number;
  returned: number;
  pending: number;
  today: number;
  thisWeek: number;
  thisMonth: number;
}

interface ShipmentStatsOverviewProps {
  stats: ShipmentStats;
}

export const ShipmentStatsOverview: React.FC<ShipmentStatsOverviewProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
      <Card className="bg-blue-500/10 border-blue-500/20">
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <TruckIcon className="h-4 w-4 text-blue-500" />
            <span className="text-xs text-muted-foreground">In Transit</span>
          </div>
          <p className="text-2xl font-bold text-blue-500 mt-1">{stats.inTransit}</p>
        </CardContent>
      </Card>

      <Card className="bg-green-500/10 border-green-500/20">
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span className="text-xs text-muted-foreground">Delivered</span>
          </div>
          <p className="text-2xl font-bold text-green-500 mt-1">{stats.delivered}</p>
        </CardContent>
      </Card>

      <Card className="bg-orange-500/10 border-orange-500/20">
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <RotateCcw className="h-4 w-4 text-orange-500" />
            <span className="text-xs text-muted-foreground">Returned</span>
          </div>
          <p className="text-2xl font-bold text-orange-500 mt-1">{stats.returned}</p>
        </CardContent>
      </Card>

      <Card className="bg-yellow-500/10 border-yellow-500/20">
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-yellow-500" />
            <span className="text-xs text-muted-foreground">Pending</span>
          </div>
          <p className="text-2xl font-bold text-yellow-500 mt-1">{stats.pending}</p>
        </CardContent>
      </Card>

      <Card className="bg-muted/50">
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Today</span>
          </div>
          <p className="text-2xl font-bold mt-1">{stats.today}</p>
        </CardContent>
      </Card>

      <Card className="bg-muted/50">
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">This Week</span>
          </div>
          <p className="text-2xl font-bold mt-1">{stats.thisWeek}</p>
        </CardContent>
      </Card>

      <Card className="bg-muted/50">
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">This Month</span>
          </div>
          <p className="text-2xl font-bold mt-1">{stats.thisMonth}</p>
        </CardContent>
      </Card>
    </div>
  );
};

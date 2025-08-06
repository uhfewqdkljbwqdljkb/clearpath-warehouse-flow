import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

interface Zone {
  id: string;
  code: string;
  name: string;
  total_locations: number;
  occupied_locations: number;
  utilization: number;
  color: string;
}

interface ZoneUtilizationChartProps {
  zones: Zone[];
}

export const ZoneUtilizationChart: React.FC<ZoneUtilizationChartProps> = ({ zones }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Zone Utilization</CardTitle>
        <p className="text-sm text-muted-foreground">
          Storage utilization across all warehouse zones
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {zones.map((zone) => (
          <div key={zone.id} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: zone.color }}
                />
                <div>
                  <p className="text-sm font-medium">{zone.name}</p>
                  <p className="text-xs text-muted-foreground">{zone.code}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge 
                  variant="outline" 
                  className={`text-xs ${
                    zone.utilization > 70 ? 'border-red-200 text-red-700' :
                    zone.utilization > 50 ? 'border-yellow-200 text-yellow-700' :
                    'border-green-200 text-green-700'
                  }`}
                >
                  {zone.utilization}%
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {zone.occupied_locations}/{zone.total_locations}
                </span>
              </div>
            </div>
            <Progress 
              value={zone.utilization} 
              className="h-2"
              style={{
                '--progress-foreground': zone.color
              } as React.CSSProperties}
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
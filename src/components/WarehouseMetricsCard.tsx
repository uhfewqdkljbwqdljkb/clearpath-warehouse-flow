import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface WarehouseMetricsCardProps {
  title: string;
  value: string;
  subtitle?: string;
  trend?: string;
  trendType?: 'positive' | 'negative';
  icon?: LucideIcon;
}

export const WarehouseMetricsCard: React.FC<WarehouseMetricsCardProps> = ({
  title,
  value,
  subtitle,
  trend,
  trendType = 'positive',
  icon: Icon
}) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <div className="flex items-center pt-1">
          {trend && (
            <span className={`text-xs font-medium ${
              trendType === 'positive' ? 'text-green-600' : 'text-red-600'
            }`}>
              {trend}
            </span>
          )}
          {subtitle && (
            <p className="text-xs text-muted-foreground ml-2">
              {subtitle}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
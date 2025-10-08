
import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string;
  trend?: string;
  trendType?: 'positive' | 'negative' | 'neutral';
  subtitle: string;
  icon: LucideIcon;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  trend,
  trendType,
  subtitle,
  icon: Icon
}) => {
  const getTrendColor = () => {
    switch (trendType) {
      case 'positive':
        return 'text-success';
      case 'negative':
        return 'text-destructive';
      default:
        return 'text-warning';
    }
  };

  return (
    <div className="metric-card">
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm font-medium text-muted-foreground">{title}</div>
        <Icon className="h-5 w-5 text-muted-foreground" />
      </div>
      <div className="space-y-2">
        <div className="text-3xl font-bold text-foreground">{value}</div>
        <div className="flex items-center space-x-2">
          {trend && (
            <span className={`text-sm font-medium ${getTrendColor()}`}>
              {trend}
            </span>
          )}
          <span className="text-sm text-muted-foreground">{subtitle}</span>
        </div>
      </div>
    </div>
  );
};

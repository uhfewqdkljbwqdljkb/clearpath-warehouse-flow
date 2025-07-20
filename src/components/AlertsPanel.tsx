import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Clock, CheckCircle } from 'lucide-react';
import { mockCapacityAlerts } from '@/data/mockData';

export const AlertsPanel: React.FC = () => {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'secondary';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'medium': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'low': return <Clock className="h-4 w-4 text-blue-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatTimestamp = (date: Date) => {
    return new Intl.RelativeTimeFormat('en', { numeric: 'auto' }).format(
      Math.floor((date.getTime() - Date.now()) / (1000 * 60 * 60)), 'hour'
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Capacity Alerts
          <Badge variant="destructive">
            {mockCapacityAlerts.filter(alert => !alert.acknowledged).length} Active
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {mockCapacityAlerts.map((alert) => (
            <div 
              key={alert.id} 
              className={`p-3 border rounded-lg ${alert.acknowledged ? 'bg-gray-50 opacity-70' : 'bg-white'}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  {alert.acknowledged ? (
                    <CheckCircle className="h-4 w-4 text-green-500 mt-1" />
                  ) : (
                    getSeverityIcon(alert.severity)
                  )}
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-sm">{alert.zoneName}</h4>
                      <Badge variant={getSeverityColor(alert.severity)}>
                        {alert.severity.toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{alert.message}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>Threshold: {alert.threshold}%</span>
                      <span>Current: {alert.currentValue}%</span>
                      <span>{formatTimestamp(alert.createdAt)}</span>
                    </div>
                  </div>
                </div>
                {!alert.acknowledged && (
                  <Button size="sm" variant="outline">
                    Acknowledge
                  </Button>
                )}
              </div>
            </div>
          ))}
          
          {mockCapacityAlerts.length === 0 && (
            <div className="text-center py-6 text-gray-500">
              <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
              <p>No active alerts</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
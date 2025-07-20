import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package, Users, MapPin, Plus, Edit, Trash2 } from 'lucide-react';
import { mockActivityLogs } from '@/data/mockData';

export const ActivityFeed: React.FC = () => {
  const getActionIcon = (action: string) => {
    switch (action) {
      case 'allocation_created':
      case 'allocation_updated':
        return <MapPin className="h-4 w-4 text-blue-500" />;
      case 'product_added':
      case 'product_updated':
        return <Package className="h-4 w-4 text-green-500" />;
      case 'client_added':
        return <Users className="h-4 w-4 text-purple-500" />;
      case 'allocation_deleted':
        return <Trash2 className="h-4 w-4 text-red-500" />;
      default:
        return <Edit className="h-4 w-4 text-gray-500" />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'allocation_created':
      case 'product_added':
      case 'client_added':
        return 'secondary';
      case 'allocation_updated':
      case 'product_updated':
        return 'default';
      case 'allocation_deleted':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const formatTimestamp = (date: Date) => {
    return new Intl.RelativeTimeFormat('en', { numeric: 'auto' }).format(
      Math.floor((date.getTime() - Date.now()) / (1000 * 60 * 60)), 'hour'
    );
  };

  const formatAction = (action: string) => {
    return action.split('_').join(' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {mockActivityLogs.map((log) => (
            <div key={log.id} className="flex items-start gap-3 p-3 border rounded-lg bg-gray-50">
              <div className="mt-1">
                {getActionIcon(log.action)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant={getActionColor(log.action)}>
                    {formatAction(log.action)}
                  </Badge>
                  <span className="text-xs text-gray-500">
                    {formatTimestamp(log.timestamp)}
                  </span>
                </div>
                <p className="text-sm text-gray-700 mb-1">{log.details}</p>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span>by {log.performedBy}</span>
                  {log.metadata && Object.keys(log.metadata).length > 0 && (
                    <div className="flex gap-1">
                      {Object.entries(log.metadata).slice(0, 2).map(([key, value]) => (
                        <span key={key} className="bg-gray-200 px-2 py-0.5 rounded">
                          {key}: {value}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
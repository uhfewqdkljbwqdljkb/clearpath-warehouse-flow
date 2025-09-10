import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PackagePlus, Package2, Truck, AlertTriangle, Clock } from 'lucide-react';

interface Activity {
  id: string;
  type: 'inventory_received' | 'order_shipped' | 'low_stock_alert' | 'storage_allocation' | 'system_message';
  title: string;
  description: string;
  timestamp: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
}

interface RecentActivityProps {
  activities?: Activity[];
}

export const RecentActivity: React.FC<RecentActivityProps> = ({ activities = [] }) => {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'inventory_received':
        return <PackagePlus className="h-4 w-4 text-green-600" />;
      case 'order_shipped':
        return <Truck className="h-4 w-4 text-blue-600" />;
      case 'low_stock_alert':
        return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      case 'storage_allocation':
        return <Package2 className="h-4 w-4 text-purple-600" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'critical':
        return <Badge variant="destructive">Critical</Badge>;
      case 'high':
        return <Badge variant="secondary" className="text-orange-600">High</Badge>;
      case 'medium':
        return <Badge variant="secondary">Medium</Badge>;
      case 'low':
        return <Badge variant="outline">Low</Badge>;
      default:
        return null;
    }
  };

  // Mock data if none provided
  const defaultActivities: Activity[] = [
    {
      id: '1',
      type: 'inventory_received',
      title: 'Inventory Received',
      description: '250 units of Wireless Earbuds Pro received and allocated to CLPRW0004',
      timestamp: '2024-01-15T10:30:00Z',
      priority: 'medium'
    },
    {
      id: '2',
      type: 'order_shipped',
      title: 'Order Shipped',
      description: 'Order #ORD-12345 shipped via Aramex - Tracking: AR789012345',
      timestamp: '2024-01-15T09:15:00Z',
      priority: 'low'
    },
    {
      id: '3',
      type: 'low_stock_alert',
      title: 'Low Stock Alert',
      description: 'iPhone Cases (TC-001) - Only 12 units remaining, reorder level: 100',
      timestamp: '2024-01-15T08:45:00Z',
      priority: 'critical'
    },
    {
      id: '4',
      type: 'storage_allocation',
      title: 'Storage Update',
      description: 'Additional 2.5 m³ allocated in Zone B for expanding product line',
      timestamp: '2024-01-14T16:20:00Z',
      priority: 'medium'
    },
    {
      id: '5',
      type: 'system_message',
      title: 'System Notification',
      description: 'Monthly storage utilization report generated and sent to your email',
      timestamp: '2024-01-14T12:00:00Z',
      priority: 'low'
    }
  ];

  const displayActivities = activities.length > 0 ? activities : defaultActivities;

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) {
      return 'Just now';
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {displayActivities.slice(0, 8).map((activity) => (
            <div key={activity.id} className="flex items-start gap-3 pb-3 border-b border-border last:border-0 last:pb-0">
              <div className="mt-1">
                {getActivityIcon(activity.type)}
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{activity.title}</p>
                  <div className="flex items-center gap-2">
                    {activity.priority && getPriorityBadge(activity.priority)}
                    <span className="text-xs text-muted-foreground">
                      {formatTimestamp(activity.timestamp)}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">{activity.description}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
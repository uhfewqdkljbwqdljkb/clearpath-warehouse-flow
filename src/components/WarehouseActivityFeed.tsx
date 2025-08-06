import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Package, 
  Truck, 
  MapPin, 
  RefreshCw, 
  CheckCircle, 
  Wrench,
  Clock
} from 'lucide-react';

interface Activity {
  id: string;
  timestamp: string;
  action: string;
  details: string;
  user: string;
  type: 'receiving' | 'shipping' | 'allocation' | 'movement' | 'quality' | 'maintenance';
  icon: string;
}

interface WarehouseActivityFeedProps {
  activities: Activity[];
}

export const WarehouseActivityFeed: React.FC<WarehouseActivityFeedProps> = ({ 
  activities 
}) => {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'receiving':
        return <Package className="h-4 w-4" />;
      case 'shipping':
        return <Truck className="h-4 w-4" />;
      case 'allocation':
        return <MapPin className="h-4 w-4" />;
      case 'movement':
        return <RefreshCw className="h-4 w-4" />;
      case 'quality':
        return <CheckCircle className="h-4 w-4" />;
      case 'maintenance':
        return <Wrench className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'receiving':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'shipping':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'allocation':
        return 'text-purple-600 bg-purple-50 border-purple-200';
      case 'movement':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'quality':
        return 'text-emerald-600 bg-emerald-50 border-emerald-200';
      case 'maintenance':
        return 'text-gray-600 bg-gray-50 border-gray-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getTypeBadge = (type: string) => {
    const typeLabels = {
      receiving: 'Receiving',
      shipping: 'Shipping',
      allocation: 'Allocation',
      movement: 'Movement',
      quality: 'Quality',
      maintenance: 'Maintenance'
    };

    return (
      <Badge 
        variant="outline" 
        className={`text-xs ${getActivityColor(type)}`}
      >
        {typeLabels[type as keyof typeof typeLabels] || type}
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Clock className="h-5 w-5" />
          <span>Recent Activity</span>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Latest warehouse operations and updates
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity, index) => (
            <div key={activity.id} className="relative">
              {/* Timeline line */}
              {index < activities.length - 1 && (
                <div className="absolute left-5 top-8 w-0.5 h-6 bg-gray-200" />
              )}
              
              <div className="flex space-x-3">
                {/* Icon */}
                <div className={`flex-shrink-0 w-10 h-10 rounded-full border-2 flex items-center justify-center ${getActivityColor(activity.type)}`}>
                  {getActivityIcon(activity.type)}
                </div>
                
                {/* Content */}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900">
                      {activity.action}
                    </p>
                    <div className="flex items-center space-x-2">
                      {getTypeBadge(activity.type)}
                      <span className="text-xs text-gray-500">
                        {activity.timestamp}
                      </span>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-600">
                    {activity.details}
                  </p>
                  
                  <p className="text-xs text-gray-500">
                    By {activity.user}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {activities.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Clock className="h-8 w-8 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">No recent activity</p>
          </div>
        )}
        
        {/* View all button */}
        {activities.length > 0 && (
          <div className="mt-6 pt-4 border-t">
            <button className="w-full text-sm text-blue-600 hover:text-blue-700 font-medium">
              View all activities →
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useIntegration } from '@/contexts/IntegrationContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Activity, 
  User, 
  Package, 
  MessageSquare, 
  Shield, 
  Clock,
  Eye,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { ClientActivityLog } from '@/types/integration';

interface EnhancedActivityFeedProps {
  limit?: number;
  showAllUsers?: boolean;
  companyId?: string;
}

export const EnhancedActivityFeed: React.FC<EnhancedActivityFeedProps> = ({ 
  limit = 10, 
  showAllUsers = false,
  companyId
}) => {
  const { profile } = useAuth();
  const { isViewingAsClient, clientCompany } = useIntegration();
  const [activities, setActivities] = useState<ClientActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivities();
  }, [profile?.user_id, isViewingAsClient, clientCompany, companyId]);

  const fetchActivities = async () => {
    try {
      let query = supabase
        .from('client_activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      // Filter based on context
      if (companyId) {
        query = query.eq('company_id', companyId);
      } else if (isViewingAsClient && clientCompany) {
        query = query.eq('company_id', clientCompany.id);
      } else if (!showAllUsers && profile?.user_id) {
        query = query.eq('user_id', profile.user_id);
      }

      const { data, error } = await query;

      if (error) throw error;
      setActivities(data || []);
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (activityType: string) => {
    switch (activityType) {
      case 'user_session_active':
      case 'dashboard_access':
        return <User className="h-4 w-4" />;
      case 'inventory_access':
      case 'product_view':
        return <Package className="h-4 w-4" />;
      case 'message_send':
      case 'message_read':
        return <MessageSquare className="h-4 w-4" />;
      case 'admin_view_client_portal':
      case 'admin_stop_view_client_portal':
        return <Shield className="h-4 w-4" />;
      case 'order_created':
      case 'order_updated':
        return <TrendingUp className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getActivityColor = (activityType: string) => {
    switch (activityType) {
      case 'admin_view_client_portal':
      case 'admin_stop_view_client_portal':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'message_send':
      case 'message_read':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'order_created':
      case 'order_updated':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'inventory_access':
      case 'product_view':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatActivityType = (activityType: string) => {
    return activityType
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const getRelativeTime = (dateString: string) => {
    const now = new Date();
    const activityDate = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - activityDate.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Recent Activity
          {(isViewingAsClient || companyId) && (
            <Badge variant="outline" className="ml-2">
              <Eye className="h-3 w-3 mr-1" />
              {clientCompany?.name || 'Client View'}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <div className="text-center py-8">
            <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Recent Activity</h3>
            <p className="text-muted-foreground">
              Activity will appear here as you use the system.
            </p>
          </div>
        ) : (
          <ScrollArea className="h-96">
            <div className="space-y-4">
              {activities.map((activity, index) => (
                <div key={activity.id}>
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 p-2 rounded-full bg-muted">
                      {getActivityIcon(activity.activity_type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${getActivityColor(activity.activity_type)}`}
                        >
                          {formatActivityType(activity.activity_type)}
                        </Badge>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {getRelativeTime(activity.created_at)}
                        </div>
                      </div>
                      <p className="text-sm mt-1">
                        {activity.activity_description || 'Activity logged'}
                      </p>
                      {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                        <div className="mt-1 text-xs text-muted-foreground">
                          {activity.metadata.company_name && (
                            <span>Company: {activity.metadata.company_name}</span>
                          )}
                          {activity.metadata.timestamp && (
                            <span className="ml-2">
                              {new Date(activity.metadata.timestamp).toLocaleTimeString()}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  {index < activities.length - 1 && <Separator className="mt-4" />}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package, Users, MapPin, Plus, Edit, Trash2, Activity as ActivityIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ActivityLog {
  id: string;
  activity_type: string;
  activity_description: string | null;
  created_at: string;
  user_id: string | null;
  metadata: any;
}

export const ActivityFeed: React.FC = () => {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    try {
      const { data, error } = await supabase
        .from('client_activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Error fetching activities:', error);
        return;
      }

      setActivities(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (action: string) => {
    const lowerAction = action.toLowerCase();
    if (lowerAction.includes('product')) {
      return <Package className="h-4 w-4 text-green-500" />;
    }
    if (lowerAction.includes('order')) {
      return <MapPin className="h-4 w-4 text-blue-500" />;
    }
    if (lowerAction.includes('client') || lowerAction.includes('user')) {
      return <Users className="h-4 w-4 text-purple-500" />;
    }
    if (lowerAction.includes('delete')) {
      return <Trash2 className="h-4 w-4 text-red-500" />;
    }
    if (lowerAction.includes('create') || lowerAction.includes('add')) {
      return <Plus className="h-4 w-4 text-green-500" />;
    }
    if (lowerAction.includes('update') || lowerAction.includes('edit')) {
      return <Edit className="h-4 w-4 text-blue-500" />;
    }
    return <ActivityIcon className="h-4 w-4 text-gray-500" />;
  };

  const getActionColor = (action: string) => {
    const lowerAction = action.toLowerCase();
    if (lowerAction.includes('create') || lowerAction.includes('add')) {
      return 'secondary';
    }
    if (lowerAction.includes('update') || lowerAction.includes('edit')) {
      return 'default';
    }
    if (lowerAction.includes('delete')) {
      return 'destructive';
    }
    return 'secondary';
  };

  const formatTimestamp = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours === 0) {
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
      return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`;
    }
    if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`;
    }
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} day${diffInDays !== 1 ? 's' : ''} ago`;
  };

  const formatAction = (action: string) => {
    return action.split('_').join(' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">Loading activity...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <ActivityIcon className="h-12 w-12 text-muted-foreground mb-2" />
            <p className="text-muted-foreground">No recent activity</p>
            <p className="text-sm text-muted-foreground">Activity will appear here as users interact with the system</p>
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((log) => (
              <div key={log.id} className="flex items-start gap-3 p-3 border rounded-lg">
                <div className="mt-1">
                  {getActionIcon(log.activity_type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={getActionColor(log.activity_type)}>
                      {formatAction(log.activity_type)}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatTimestamp(log.created_at)}
                    </span>
                  </div>
                  <p className="text-sm mb-1">{log.activity_description || 'Activity performed'}</p>
                  {log.metadata && Object.keys(log.metadata).length > 0 && (
                    <div className="flex gap-1 flex-wrap">
                      {Object.entries(log.metadata).slice(0, 3).map(([key, value]) => (
                        <span key={key} className="bg-muted px-2 py-0.5 rounded text-xs">
                          {key}: {String(value)}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
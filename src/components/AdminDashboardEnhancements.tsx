import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  Building2, 
  MessageSquare, 
  Activity,
  TrendingUp,
  AlertTriangle,
  Eye,
  Shield
} from 'lucide-react';
import { EnhancedActivityFeed } from './EnhancedActivityFeed';

interface AdminStats {
  totalClients: number;
  activeUsers: number;
  unreadMessages: number;
  recentSessions: number;
  systemAlerts: number;
}

export const AdminDashboardEnhancements: React.FC = () => {
  const { profile } = useAuth();
  const [stats, setStats] = useState<AdminStats>({
    totalClients: 0,
    activeUsers: 0,
    unreadMessages: 0,
    recentSessions: 0,
    systemAlerts: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.role === 'admin') {
      fetchAdminStats();
    }
  }, [profile]);

  const fetchAdminStats = async () => {
    try {
      // Get total clients
      const { count: clientsCount } = await supabase
        .from('companies')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      // Get active users (users who have logged activity in the last 24 hours)
      const { count: activeUsersCount } = await supabase
        .from('client_activity_logs')
        .select('user_id', { count: 'exact', head: true })
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      // Get unread messages count
      const { count: unreadCount } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'unread')
        .eq('recipient_id', profile?.user_id);

      // Get recent admin sessions
      const { count: sessionsCount } = await supabase
        .from('admin_sessions')
        .select('*', { count: 'exact', head: true })
        .gte('session_start', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

      setStats({
        totalClients: clientsCount || 0,
        activeUsers: activeUsersCount || 0,
        unreadMessages: unreadCount || 0,
        recentSessions: sessionsCount || 0,
        systemAlerts: 0 // Placeholder for future system alerts
      });
    } catch (error) {
      console.error('Error fetching admin stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="animate-pulse">Loading admin enhancements...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Admin Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalClients}</div>
            <p className="text-xs text-muted-foreground">Active companies</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeUsers}</div>
            <p className="text-xs text-muted-foreground">Last 24 hours</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unread Messages</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.unreadMessages}</div>
            <p className="text-xs text-muted-foreground">Requires attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Client Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.recentSessions}</div>
            <p className="text-xs text-muted-foreground">Last 7 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.systemAlerts}</div>
            <p className="text-xs text-muted-foreground">Active issues</p>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <EnhancedActivityFeed 
          limit={15} 
          showAllUsers={true}
          companyId={undefined}
        />
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Admin Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-3">
              <Button variant="outline" className="justify-start h-auto p-4">
                <div className="text-left">
                  <div className="font-medium">View System Health</div>
                  <div className="text-sm text-muted-foreground">Check database and system status</div>
                </div>
              </Button>
              
              <Button variant="outline" className="justify-start h-auto p-4">
                <div className="text-left">
                  <div className="font-medium">Generate Reports</div>
                  <div className="text-sm text-muted-foreground">Create client activity and usage reports</div>
                </div>
              </Button>
              
              <Button variant="outline" className="justify-start h-auto p-4">
                <div className="text-left">
                  <div className="font-medium">Manage Notifications</div>
                  <div className="text-sm text-muted-foreground">Configure system-wide alerts</div>
                </div>
              </Button>
              
              <Button variant="outline" className="justify-start h-auto p-4">
                <div className="text-left">
                  <div className="font-medium">Security Audit</div>
                  <div className="text-sm text-muted-foreground">Review access logs and permissions</div>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
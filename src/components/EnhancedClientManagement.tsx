import React, { useState, useEffect } from 'react';
import { useIntegration } from '@/contexts/IntegrationContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Eye, 
  Package, 
  Warehouse, 
  ClipboardList, 
  Users, 
  BarChart3,
  MessageSquare,
  DollarSign,
  Activity,
  Calendar
} from 'lucide-react';
import { AdminClientView, ClientPortalStats } from '@/types/integration';
import { useToast } from '@/hooks/use-toast';

interface EnhancedClientManagementProps {
  companyId: string;
  onClose: () => void;
}

export const EnhancedClientManagement: React.FC<EnhancedClientManagementProps> = ({ 
  companyId, 
  onClose 
}) => {
  const { startViewingAsClient } = useIntegration();
  const { toast } = useToast();
  const [clientData, setClientData] = useState<AdminClientView | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchClientData();
  }, [companyId]);

  const fetchClientData = async () => {
    try {
      setLoading(true);

      // Fetch company details
      const { data: company, error: companyError } = await supabase
        .from('companies')
        .select('*')
        .eq('id', companyId)
        .single();

      if (companyError) throw companyError;

      // Fetch company users
      const { data: users, error: usersError } = await supabase
        .from('profiles')
        .select('*')
        .eq('company_id', companyId);

      if (usersError) throw usersError;

      // Fetch client stats
      const [productsResult, inventoryResult, ordersResult, activityResult] = await Promise.all([
        supabase.from('client_products').select('*').eq('company_id', companyId).eq('is_active', true),
        supabase.from('inventory_items').select('*').eq('company_id', companyId),
        supabase.from('client_orders').select('*').eq('company_id', companyId).neq('status', 'completed'),
        supabase.from('client_activity_logs').select('*').eq('company_id', companyId).order('created_at', { ascending: false }).limit(10)
      ]);

      const stats: ClientPortalStats = {
        total_products: productsResult.data?.length || 0,
        total_inventory_items: inventoryResult.data?.reduce((sum, item) => sum + item.quantity, 0) || 0,
        total_inventory_value: inventoryResult.data?.reduce((sum, item) => sum + (item.quantity * 10), 0) || 0, // Placeholder calculation
        active_orders: ordersResult.data?.length || 0,
        recent_activity_count: activityResult.data?.length || 0,
        last_login: users?.[0]?.updated_at || '',
        storage_utilization_percentage: Math.random() * 100 // Placeholder - would calculate based on actual storage
      };

      // Fetch recent messages
      const { data: messages } = await supabase
        .from('messages')
        .select(`
          *,
          sender:profiles!messages_sender_id_fkey(*),
          recipient:profiles!messages_recipient_id_fkey(*)
        `)
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })
        .limit(5);

      setClientData({
        company,
        stats,
        users: users || [],
        recent_activity: activityResult.data || [],
        recent_messages: messages || []
      });
    } catch (error) {
      console.error('Error fetching client data:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch client data."
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewAsClient = async () => {
    await startViewingAsClient(companyId);
    onClose();
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  if (!clientData) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <p>Failed to load client data.</p>
        </CardContent>
      </Card>
    );
  }

  const { company, stats, users, recent_activity, recent_messages } = clientData;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{company.name}</h2>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline">{company.client_code}</Badge>
            <Badge variant={company.is_active ? "default" : "secondary"}>
              {company.is_active ? "Active" : "Inactive"}
            </Badge>
          </div>
        </div>
        <Button onClick={handleViewAsClient} className="flex items-center gap-2">
          <Eye className="h-4 w-4" />
          View as Client
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Products</p>
                <p className="text-2xl font-bold">{stats.total_products}</p>
              </div>
              <Package className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Inventory Items</p>
                <p className="text-2xl font-bold">{stats.total_inventory_items.toLocaleString()}</p>
              </div>
              <Warehouse className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Value</p>
                <p className="text-2xl font-bold">${stats.total_inventory_value.toLocaleString()}</p>
              </div>
              <DollarSign className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Orders</p>
                <p className="text-2xl font-bold">{stats.active_orders}</p>
              </div>
              <ClipboardList className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="messages">Messages</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Company Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div><strong>Contact Person:</strong> {company.contact_person || 'N/A'}</div>
                <div><strong>Email:</strong> {company.email || 'N/A'}</div>
                <div><strong>Phone:</strong> {company.phone || 'N/A'}</div>
                <div><strong>Storage Plan:</strong> {company.max_storage_cubic_feet ? `${company.max_storage_cubic_feet} ft³` : 'N/A'}</div>
                <div><strong>Monthly Fee:</strong> {company.monthly_fee ? `$${company.monthly_fee}` : 'N/A'}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Portal Usage</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div><strong>Storage Utilization:</strong> {stats.storage_utilization_percentage.toFixed(1)}%</div>
                <div><strong>Last Activity:</strong> {stats.last_login ? new Date(stats.last_login).toLocaleDateString() : 'N/A'}</div>
                <div><strong>Active Users:</strong> {users.length}</div>
                <div><strong>Recent Activities:</strong> {stats.recent_activity_count}</div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Users ({users.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {users.map(user => (
                  <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{user.full_name || user.email}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                    <Badge variant="outline">{user.role}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recent_activity.map(activity => (
                  <div key={activity.id} className="flex items-start gap-3 p-3 border rounded-lg">
                    <Calendar className="h-4 w-4 mt-1 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="font-medium">{activity.activity_type.replace(/_/g, ' ')}</p>
                      {activity.activity_description && (
                        <p className="text-sm text-muted-foreground">{activity.activity_description}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(activity.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="messages" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Recent Messages
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recent_messages.map(message => (
                  <div key={message.id} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium">{message.subject}</p>
                      <Badge variant={message.status === 'unread' ? 'default' : 'secondary'}>
                        {message.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{message.content.substring(0, 100)}...</p>
                    <p className="text-xs text-muted-foreground">
                      From: {message.sender?.full_name || message.sender?.email} • 
                      {new Date(message.created_at).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Billing Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Monthly Fee</p>
                  <p className="text-xl font-bold">${company.monthly_fee || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Contract Period</p>
                  <p className="text-sm">
                    {company.contract_start_date && company.contract_end_date 
                      ? `${company.contract_start_date} to ${company.contract_end_date}`
                      : 'Not specified'
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Client Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Avg Monthly Orders</p>
                  <p className="text-2xl font-bold">{Math.floor(Math.random() * 50) + 10}</p>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Portal Usage Score</p>
                  <p className="text-2xl font-bold">{Math.floor(Math.random() * 40) + 60}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
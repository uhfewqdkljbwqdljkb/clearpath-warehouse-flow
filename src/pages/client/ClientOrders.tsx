import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Eye } from 'lucide-react';
import { ClientOrderForm } from '@/components/ClientOrderForm';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface ClientOrder {
  id: string;
  order_number: string;
  order_type: 'receive' | 'ship';
  status: 'pending' | 'approved' | 'in_progress' | 'completed' | 'cancelled';
  requested_date?: string;
  completed_date?: string;
  notes?: string;
  created_at: string;
  client_order_items?: {
    id: string;
    quantity: number;
    client_products: {
      name: string;
      sku: string;
    };
  }[];
}

export const ClientOrders: React.FC = () => {
  const { profile } = useAuth();
  const [orders, setOrders] = useState<ClientOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const fetchOrders = async () => {
    if (!profile?.company_id) return;

    try {
      const { data, error } = await supabase
        .from('client_orders')
        .select(`
          *,
          client_order_items (
            id,
            quantity,
            client_products (
              name,
              sku
            )
          )
        `)
        .eq('company_id', profile.company_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data as ClientOrder[] || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [profile?.company_id]);

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'pending':
        return 'secondary';
      case 'approved':
        return 'default';
      case 'in_progress':
        return 'outline';
      case 'completed':
        return 'default';
      case 'cancelled':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getOrderTypeBadgeVariant = (type: string) => {
    return type === 'receive' ? 'default' : 'outline';
  };

  if (isLoading) {
    return <div>Loading orders...</div>;
  }

  if (showForm) {
    return (
      <ClientOrderForm
        onSubmit={() => {
          setShowForm(false);
          fetchOrders();
        }}
        onCancel={() => setShowForm(false)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Orders</h1>
          <p className="text-muted-foreground">
            Manage your warehouse orders and requests
          </p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Order
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {['pending', 'approved', 'in_progress', 'completed'].map((status) => {
          const count = orders.filter(order => order.status === status).length;
          return (
            <Card key={status}>
              <CardContent className="p-4">
                <div className="text-2xl font-bold">{count}</div>
                <p className="text-sm text-muted-foreground capitalize">
                  {status.replace('_', ' ')} Orders
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Orders</CardTitle>
          <CardDescription>
            View and track all your warehouse orders
          </CardDescription>
        </CardHeader>
        <CardContent>
          {orders.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order Number</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Requested Date</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">
                      {order.order_number}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getOrderTypeBadgeVariant(order.order_type)}>
                        {order.order_type === 'receive' ? 'Receive' : 'Ship'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(order.status)}>
                        {order.status.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {order.client_order_items?.length || 0} items
                        {order.client_order_items && order.client_order_items.length > 0 && (
                          <div className="text-xs text-muted-foreground">
                            {order.client_order_items[0].client_products.name}
                            {order.client_order_items.length > 1 && ` +${order.client_order_items.length - 1} more`}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {order.requested_date 
                        ? new Date(order.requested_date).toLocaleDateString()
                        : '-'
                      }
                    </TableCell>
                    <TableCell>
                      {new Date(order.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <Plus className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Orders Yet</h3>
              <p className="text-muted-foreground text-center mb-4">
                You haven't created any orders yet. Start by creating your first order.
              </p>
              <Button onClick={() => setShowForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Order
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
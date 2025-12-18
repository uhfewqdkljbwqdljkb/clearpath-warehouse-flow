import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useIntegration } from '@/contexts/IntegrationContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Search, Package, Truck, CheckCircle, XCircle, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ShipmentItem {
  id: string;
  product_id: string;
  quantity: number;
  variant_attribute: string | null;
  variant_value: string | null;
  product?: {
    name: string;
    sku: string | null;
  };
}

interface Shipment {
  id: string;
  shipment_number: string;
  status: string;
  shipment_date: string;
  destination_address: string;
  destination_contact: string | null;
  destination_phone: string | null;
  tracking_number: string | null;
  carrier: string | null;
  notes: string | null;
  created_at: string;
  items?: ShipmentItem[];
}

export const ClientOrders: React.FC = () => {
  const { profile } = useAuth();
  const { logActivity } = useIntegration();
  const { toast } = useToast();
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [expandedShipment, setExpandedShipment] = useState<string | null>(null);
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);

  useEffect(() => {
    if (profile?.company_id) {
      fetchShipments();
      logActivity('shipments_access', 'User accessed shipments page', {
        timestamp: new Date().toISOString()
      });
    }
  }, [profile?.company_id]);

  const fetchShipments = async () => {
    if (!profile?.company_id) return;

    try {
      const { data: shipmentsData, error: shipmentsError } = await supabase
        .from('shipments')
        .select('*')
        .eq('company_id', profile.company_id)
        .order('created_at', { ascending: false });

      if (shipmentsError) throw shipmentsError;

      // Fetch items for each shipment
      const shipmentsWithItems = await Promise.all(
        (shipmentsData || []).map(async (shipment) => {
          const { data: itemsData } = await supabase
            .from('shipment_items')
            .select(`
              id,
              product_id,
              quantity,
              variant_attribute,
              variant_value
            `)
            .eq('shipment_id', shipment.id);

          // Fetch product names for items
          const itemsWithProducts = await Promise.all(
            (itemsData || []).map(async (item) => {
              const { data: productData } = await supabase
                .from('client_products')
                .select('name, sku')
                .eq('id', item.product_id)
                .maybeSingle();

              return {
                ...item,
                product: productData
              };
            })
          );

          return {
            ...shipment,
            items: itemsWithProducts
          };
        })
      );

      setShipments(shipmentsWithItems);
    } catch (error) {
      console.error('Error fetching shipments:', error);
      toast({
        title: "Error",
        description: "Failed to load shipments",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredShipments = shipments.filter(shipment => {
    const matchesSearch = shipment.shipment_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shipment.destination_address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (shipment.tracking_number?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    const matchesStatus = statusFilter === 'all' || shipment.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
        return <CheckCircle className="h-4 w-4" />;
      case 'in_transit':
        return <Truck className="h-4 w-4" />;
      case 'cancelled':
      case 'returned':
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'in_transit':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'returned':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'in_transit':
        return 'In Transit';
      case 'delivered':
        return 'Delivered';
      case 'pending':
        return 'Pending';
      case 'cancelled':
        return 'Cancelled';
      case 'returned':
        return 'Returned';
      default:
        return status;
    }
  };

  const stats = {
    total: shipments.length,
    inTransit: shipments.filter(s => s.status === 'in_transit').length,
    delivered: shipments.filter(s => s.status === 'delivered').length,
    pending: shipments.filter(s => s.status === 'pending').length,
  };

  const toggleExpand = (shipmentId: string) => {
    setExpandedShipment(expandedShipment === shipmentId ? null : shipmentId);
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Shipments</h1>
        <p className="text-muted-foreground">Track your shipments and delivery status</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{stats.inTransit}</p>
                <p className="text-sm text-muted-foreground">In Transit</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{stats.delivered}</p>
                <p className="text-sm text-muted-foreground">Delivered</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold">{stats.pending}</p>
                <p className="text-sm text-muted-foreground">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by shipment #, address, or tracking..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="in_transit">In Transit</SelectItem>
            <SelectItem value="delivered">Delivered</SelectItem>
            <SelectItem value="returned">Returned</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Shipments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Your Shipments</CardTitle>
          <CardDescription>View all shipments and their delivery status</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredShipments.length > 0 ? (
            <div className="space-y-2">
              {filteredShipments.map((shipment) => (
                <div key={shipment.id} className="border rounded-lg overflow-hidden">
                  <div
                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => toggleExpand(shipment.id)}
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{shipment.shipment_number}</span>
                          <Badge className={getStatusColor(shipment.status)}>
                            <span className="flex items-center gap-1">
                              {getStatusIcon(shipment.status)}
                              {getStatusLabel(shipment.status)}
                            </span>
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {shipment.destination_address}
                        </p>
                      </div>
                      <div className="hidden md:block text-right">
                        <p className="text-sm font-medium">
                          {new Date(shipment.shipment_date).toLocaleDateString()}
                        </p>
                        {shipment.tracking_number && (
                          <p className="text-xs text-muted-foreground">
                            Tracking: {shipment.tracking_number}
                          </p>
                        )}
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="ml-2">
                      {expandedShipment === shipment.id ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </div>

                  {expandedShipment === shipment.id && (
                    <div className="border-t bg-muted/30 p-4 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-medium mb-2">Shipping Details</h4>
                          <div className="text-sm space-y-1">
                            <p><span className="text-muted-foreground">Contact:</span> {shipment.destination_contact || 'N/A'}</p>
                            <p><span className="text-muted-foreground">Phone:</span> {shipment.destination_phone || 'N/A'}</p>
                            <p><span className="text-muted-foreground">Carrier:</span> {shipment.carrier || 'N/A'}</p>
                            {shipment.notes && (
                              <p><span className="text-muted-foreground">Notes:</span> {shipment.notes}</p>
                            )}
                          </div>
                        </div>
                        <div>
                          <h4 className="font-medium mb-2">Products ({shipment.items?.length || 0})</h4>
                          {shipment.items && shipment.items.length > 0 ? (
                            <div className="space-y-2">
                              {shipment.items.map((item) => (
                                <div key={item.id} className="text-sm flex justify-between items-center bg-background p-2 rounded">
                                  <div>
                                    <span className="font-medium">{item.product?.name || 'Unknown Product'}</span>
                                    {item.variant_attribute && item.variant_value && (
                                      <span className="text-muted-foreground ml-2">
                                        ({item.variant_attribute}: {item.variant_value})
                                      </span>
                                    )}
                                  </div>
                                  <Badge variant="secondary">Qty: {item.quantity}</Badge>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground">No items</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No Shipments Found</h3>
              <p className="text-muted-foreground">
                {searchTerm || statusFilter !== 'all'
                  ? 'No shipments match your search criteria.'
                  : 'You don\'t have any shipments yet.'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

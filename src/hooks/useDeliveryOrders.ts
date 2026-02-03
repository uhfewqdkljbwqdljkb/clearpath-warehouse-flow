import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { 
  DeliveryOrder, 
  DeliveryOrderItem, 
  DeliveryOrderStatus, 
  DeliveryOrderFilters,
  DeliveryTrackingEvent 
} from '@/types/delivery';

export function useDeliveryOrders(filters?: DeliveryOrderFilters) {
  const [orders, setOrders] = useState<DeliveryOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('delivery_orders')
        .select(`
          *,
          company:companies(id, name, client_code),
          carrier:delivery_carriers(id, name, code),
          driver:delivery_drivers(id, full_name, phone)
        `)
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters?.status?.length) {
        query = query.in('status', filters.status);
      }
      if (filters?.source?.length) {
        query = query.in('source', filters.source);
      }
      if (filters?.companyId) {
        query = query.eq('company_id', filters.companyId);
      }
      if (filters?.carrierId) {
        query = query.eq('carrier_id', filters.carrierId);
      }
      if (filters?.driverId) {
        query = query.eq('driver_id', filters.driverId);
      }
      if (filters?.dateFrom) {
        query = query.gte('created_at', filters.dateFrom);
      }
      if (filters?.dateTo) {
        query = query.lte('created_at', filters.dateTo);
      }
      if (filters?.search) {
        query = query.or(`order_number.ilike.%${filters.search}%,recipient_name.ilike.%${filters.search}%`);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;
      setOrders((data || []) as unknown as DeliveryOrder[]);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching delivery orders:', err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('delivery_orders_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'delivery_orders' },
        () => {
          fetchOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchOrders]);

  const createOrder = async (
    orderData: Omit<DeliveryOrder, 'id' | 'order_number' | 'created_at' | 'updated_at' | 'status_history'>, 
    items?: Array<Omit<DeliveryOrderItem, 'id' | 'delivery_order_id' | 'created_at'>>
  ) => {
    try {
      // Generate order number
      const { data: orderNumber } = await supabase.rpc('generate_delivery_order_number');
      
      const { data: order, error: orderError } = await supabase
        .from('delivery_orders')
        .insert({
          company_id: orderData.company_id,
          source: orderData.source,
          recipient_name: orderData.recipient_name,
          recipient_email: orderData.recipient_email,
          recipient_phone: orderData.recipient_phone,
          shipping_address_line1: orderData.shipping_address_line1,
          shipping_address_line2: orderData.shipping_address_line2,
          shipping_city: orderData.shipping_city,
          shipping_state: orderData.shipping_state,
          shipping_postal_code: orderData.shipping_postal_code,
          shipping_country: orderData.shipping_country,
          delivery_type: orderData.delivery_type,
          scheduled_date: orderData.scheduled_date,
          scheduled_time_slot: orderData.scheduled_time_slot,
          delivery_instructions: orderData.delivery_instructions,
          order_number: orderNumber,
          status: 'pending',
          status_history: [{ status: 'pending', timestamp: new Date().toISOString() }],
          subtotal: orderData.subtotal,
          shipping_cost: orderData.shipping_cost,
          tax_amount: orderData.tax_amount,
          discount_amount: orderData.discount_amount,
          total_amount: orderData.total_amount,
          notes: orderData.notes
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items if provided
      if (items?.length && order) {
        const itemsToInsert = items.map(item => ({
          delivery_order_id: order.id,
          product_id: item.product_id,
          product_name: item.product_name,
          product_sku: item.product_sku,
          variant_attribute: item.variant_attribute,
          variant_value: item.variant_value,
          quantity_ordered: item.quantity_ordered,
          unit_price: item.unit_price,
          unit_cost: item.unit_cost,
          line_total: item.line_total
        }));

        const { error: itemsError } = await supabase
          .from('delivery_order_items')
          .insert(itemsToInsert);

        if (itemsError) throw itemsError;
      }

      toast({
        title: 'Order Created',
        description: `Delivery order ${orderNumber} has been created.`,
      });

      fetchOrders();
      return order;
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive',
      });
      throw err;
    }
  };

  const updateOrderStatus = async (
    orderId: string, 
    newStatus: DeliveryOrderStatus,
    note?: string
  ) => {
    try {
      // Get current order to update status history
      const { data: currentOrder } = await supabase
        .from('delivery_orders')
        .select('status_history')
        .eq('id', orderId)
        .single();

      const currentHistory = currentOrder?.status_history;
      const statusHistory = Array.isArray(currentHistory) ? [...currentHistory] : [];
      statusHistory.push({
        status: newStatus,
        timestamp: new Date().toISOString(),
        note
      });

      // Build update object with timestamp based on status
      const updateData: Record<string, any> = {
        status: newStatus,
        status_history: statusHistory
      };

      // Set appropriate timestamp
      switch (newStatus) {
        case 'confirmed':
          updateData.confirmed_at = new Date().toISOString();
          break;
        case 'picked':
          updateData.picked_at = new Date().toISOString();
          break;
        case 'packed':
          updateData.packed_at = new Date().toISOString();
          break;
        case 'shipped':
          updateData.shipped_at = new Date().toISOString();
          break;
        case 'delivered':
          updateData.delivered_at = new Date().toISOString();
          break;
      }

      const { error } = await supabase
        .from('delivery_orders')
        .update(updateData)
        .eq('id', orderId);

      if (error) throw error;

      // Add tracking event
      await supabase.from('delivery_tracking_events').insert({
        delivery_order_id: orderId,
        event_type: 'status_change',
        event_status: newStatus,
        event_description: `Order status changed to ${newStatus}${note ? `: ${note}` : ''}`
      });

      toast({
        title: 'Status Updated',
        description: `Order status changed to ${newStatus}.`,
      });

      fetchOrders();
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive',
      });
      throw err;
    }
  };

  const assignCarrier = async (orderId: string, carrierId: string) => {
    try {
      const { error } = await supabase
        .from('delivery_orders')
        .update({ carrier_id: carrierId })
        .eq('id', orderId);

      if (error) throw error;

      toast({
        title: 'Carrier Assigned',
        description: 'Carrier has been assigned to the order.',
      });

      fetchOrders();
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive',
      });
    }
  };

  const assignDriver = async (orderId: string, driverId: string) => {
    try {
      const { error } = await supabase
        .from('delivery_orders')
        .update({ driver_id: driverId })
        .eq('id', orderId);

      if (error) throw error;

      toast({
        title: 'Driver Assigned',
        description: 'Driver has been assigned to the order.',
      });

      fetchOrders();
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive',
      });
    }
  };

  const updateTrackingNumber = async (orderId: string, trackingNumber: string, trackingUrl?: string) => {
    try {
      const { error } = await supabase
        .from('delivery_orders')
        .update({ tracking_number: trackingNumber, tracking_url: trackingUrl })
        .eq('id', orderId);

      if (error) throw error;

      toast({
        title: 'Tracking Updated',
        description: 'Tracking information has been updated.',
      });

      fetchOrders();
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive',
      });
    }
  };

  return {
    orders,
    loading,
    error,
    refetch: fetchOrders,
    createOrder,
    updateOrderStatus,
    assignCarrier,
    assignDriver,
    updateTrackingNumber
  };
}

export function useDeliveryOrder(orderId: string) {
  const [order, setOrder] = useState<DeliveryOrder | null>(null);
  const [items, setItems] = useState<DeliveryOrderItem[]>([]);
  const [trackingEvents, setTrackingEvents] = useState<DeliveryTrackingEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchOrder = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch order with relations
      const { data: orderData, error: orderError } = await supabase
        .from('delivery_orders')
        .select(`
          *,
          company:companies(id, name, client_code),
          carrier:delivery_carriers(*),
          driver:delivery_drivers(*)
        `)
        .eq('id', orderId)
        .single();

      if (orderError) throw orderError;
      setOrder(orderData as unknown as DeliveryOrder);

      // Fetch items
      const { data: itemsData } = await supabase
        .from('delivery_order_items')
        .select('*')
        .eq('delivery_order_id', orderId)
        .order('created_at');

      setItems((itemsData || []) as unknown as DeliveryOrderItem[]);

      // Fetch tracking events
      const { data: eventsData } = await supabase
        .from('delivery_tracking_events')
        .select('*')
        .eq('delivery_order_id', orderId)
        .order('created_at', { ascending: false });

      setTrackingEvents((eventsData || []) as unknown as DeliveryTrackingEvent[]);
    } catch (err: any) {
      console.error('Error fetching order:', err);
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [orderId, toast]);

  useEffect(() => {
    if (orderId) {
      fetchOrder();
    }
  }, [orderId, fetchOrder]);

  const addTrackingEvent = async (event: Omit<DeliveryTrackingEvent, 'id' | 'delivery_order_id' | 'created_at'>) => {
    try {
      const { error } = await supabase
        .from('delivery_tracking_events')
        .insert({
          delivery_order_id: orderId,
          event_type: event.event_type,
          event_status: event.event_status,
          event_description: event.event_description,
          location_address: event.location_address,
          performer_name: event.performer_name,
          performer_role: event.performer_role
        });

      if (error) throw error;

      toast({
        title: 'Event Added',
        description: 'Tracking event has been added.',
      });

      fetchOrder();
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive',
      });
    }
  };

  return {
    order,
    items,
    trackingEvents,
    loading,
    refetch: fetchOrder,
    addTrackingEvent
  };
}

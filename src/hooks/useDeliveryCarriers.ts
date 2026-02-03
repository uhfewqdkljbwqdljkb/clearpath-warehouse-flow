import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { DeliveryCarrier, DeliveryDriver } from '@/types/delivery';

export function useDeliveryCarriers() {
  const [carriers, setCarriers] = useState<DeliveryCarrier[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchCarriers = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('delivery_carriers')
        .select('*')
        .order('name');

      if (error) throw error;
      setCarriers((data || []) as unknown as DeliveryCarrier[]);
    } catch (err: any) {
      console.error('Error fetching carriers:', err);
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchCarriers();
  }, [fetchCarriers]);

  const createCarrier = async (carrierData: {
    name: string;
    code: string;
    carrier_type: string;
    contact_name?: string;
    contact_email?: string;
    contact_phone?: string;
    base_rate?: number;
    per_kg_rate?: number;
    service_areas?: string[];
    is_active?: boolean;
  }) => {
    try {
      const { data, error } = await supabase
        .from('delivery_carriers')
        .insert(carrierData)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Carrier Created',
        description: `${carrierData.name} has been added.`,
      });

      fetchCarriers();
      return data;
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive',
      });
      throw err;
    }
  };

  const updateCarrier = async (carrierId: string, updates: Partial<DeliveryCarrier>) => {
    try {
      const { error } = await supabase
        .from('delivery_carriers')
        .update(updates)
        .eq('id', carrierId);

      if (error) throw error;

      toast({
        title: 'Carrier Updated',
        description: 'Carrier information has been updated.',
      });

      fetchCarriers();
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive',
      });
    }
  };

  const toggleCarrierStatus = async (carrierId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('delivery_carriers')
        .update({ is_active: isActive })
        .eq('id', carrierId);

      if (error) throw error;

      toast({
        title: isActive ? 'Carrier Activated' : 'Carrier Deactivated',
        description: `Carrier has been ${isActive ? 'activated' : 'deactivated'}.`,
      });

      fetchCarriers();
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive',
      });
    }
  };

  return {
    carriers,
    loading,
    refetch: fetchCarriers,
    createCarrier,
    updateCarrier,
    toggleCarrierStatus
  };
}

export function useDeliveryDrivers(carrierId?: string) {
  const [drivers, setDrivers] = useState<DeliveryDriver[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchDrivers = useCallback(async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('delivery_drivers')
        .select(`
          *,
          carrier:delivery_carriers(id, name, code)
        `)
        .order('full_name');

      if (carrierId) {
        query = query.eq('carrier_id', carrierId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setDrivers((data || []) as unknown as DeliveryDriver[]);
    } catch (err: any) {
      console.error('Error fetching drivers:', err);
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [carrierId, toast]);

  useEffect(() => {
    fetchDrivers();
  }, [fetchDrivers]);

  const createDriver = async (driverData: {
    full_name: string;
    phone: string;
    email?: string;
    carrier_id?: string;
    vehicle_type?: string;
    vehicle_plate?: string;
    status?: string;
    is_active?: boolean;
  }) => {
    try {
      const { data, error } = await supabase
        .from('delivery_drivers')
        .insert(driverData)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Driver Added',
        description: `${driverData.full_name} has been added.`,
      });

      fetchDrivers();
      return data;
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive',
      });
      throw err;
    }
  };

  const updateDriver = async (driverId: string, updates: Partial<DeliveryDriver>) => {
    try {
      const { error } = await supabase
        .from('delivery_drivers')
        .update(updates)
        .eq('id', driverId);

      if (error) throw error;

      toast({
        title: 'Driver Updated',
        description: 'Driver information has been updated.',
      });

      fetchDrivers();
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive',
      });
    }
  };

  const updateDriverStatus = async (driverId: string, status: DeliveryDriver['status']) => {
    try {
      const { error } = await supabase
        .from('delivery_drivers')
        .update({ status })
        .eq('id', driverId);

      if (error) throw error;

      toast({
        title: 'Status Updated',
        description: `Driver status changed to ${status}.`,
      });

      fetchDrivers();
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive',
      });
    }
  };

  return {
    drivers,
    loading,
    refetch: fetchDrivers,
    createDriver,
    updateDriver,
    updateDriverStatus
  };
}

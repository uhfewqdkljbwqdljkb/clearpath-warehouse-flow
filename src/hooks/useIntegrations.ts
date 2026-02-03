import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { ShopifyIntegration, IntegrationRequest } from '@/types/delivery';

export function useShopifyIntegrations() {
  const [integrations, setIntegrations] = useState<ShopifyIntegration[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchIntegrations = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('shopify_integrations')
        .select(`
          *,
          company:companies(id, name, client_code)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setIntegrations((data || []) as unknown as ShopifyIntegration[]);
    } catch (err: any) {
      console.error('Error fetching integrations:', err);
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
    fetchIntegrations();
  }, [fetchIntegrations]);

  const updateIntegrationStatus = async (
    integrationId: string, 
    status: ShopifyIntegration['status']
  ) => {
    try {
      const { error } = await supabase
        .from('shopify_integrations')
        .update({ status })
        .eq('id', integrationId);

      if (error) throw error;

      toast({
        title: 'Integration Updated',
        description: `Integration status changed to ${status}.`,
      });

      fetchIntegrations();
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive',
      });
    }
  };

  const disconnectIntegration = async (integrationId: string) => {
    try {
      const { error } = await supabase
        .from('shopify_integrations')
        .update({ status: 'disconnected' })
        .eq('id', integrationId);

      if (error) throw error;

      toast({
        title: 'Integration Disconnected',
        description: 'The Shopify integration has been disconnected.',
      });

      fetchIntegrations();
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive',
      });
    }
  };

  return {
    integrations,
    loading,
    refetch: fetchIntegrations,
    updateIntegrationStatus,
    disconnectIntegration
  };
}

export function useIntegrationRequests() {
  const [requests, setRequests] = useState<IntegrationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('integration_requests')
        .select(`
          *,
          company:companies(id, name, client_code)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests((data || []) as unknown as IntegrationRequest[]);
    } catch (err: any) {
      console.error('Error fetching integration requests:', err);
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
    fetchRequests();
  }, [fetchRequests]);

  const createRequest = async (requestData: {
    company_id: string;
    integration_type: string;
    shop_url?: string;
    request_notes?: string;
    technical_contact_email?: string;
    technical_contact_phone?: string;
  }) => {
    try {
      const { data, error } = await supabase
        .from('integration_requests')
        .insert(requestData)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Request Submitted',
        description: 'Your integration request has been submitted for review.',
      });

      fetchRequests();
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

  const approveRequest = async (requestId: string, adminNotes?: string) => {
    try {
      const { data: user } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('integration_requests')
        .update({ 
          status: 'approved',
          reviewed_by: user.user?.id,
          reviewed_at: new Date().toISOString(),
          admin_notes: adminNotes
        })
        .eq('id', requestId);

      if (error) throw error;

      toast({
        title: 'Request Approved',
        description: 'The integration request has been approved.',
      });

      fetchRequests();
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive',
      });
    }
  };

  const rejectRequest = async (requestId: string, rejectionReason: string) => {
    try {
      const { data: user } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('integration_requests')
        .update({ 
          status: 'rejected',
          reviewed_by: user.user?.id,
          reviewed_at: new Date().toISOString(),
          rejection_reason: rejectionReason
        })
        .eq('id', requestId);

      if (error) throw error;

      toast({
        title: 'Request Rejected',
        description: 'The integration request has been rejected.',
      });

      fetchRequests();
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive',
      });
    }
  };

  return {
    requests,
    loading,
    refetch: fetchRequests,
    createRequest,
    approveRequest,
    rejectRequest
  };
}

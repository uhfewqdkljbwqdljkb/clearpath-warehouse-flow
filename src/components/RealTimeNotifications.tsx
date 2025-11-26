import React, { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useIntegration } from '@/contexts/IntegrationContext';
import { useToast } from '@/hooks/use-toast';
import { useInventorySync, useOrderSync, useMessageSync, useCheckInRequestSync, useCheckOutRequestSync } from '@/hooks/useRealTimeSync';
import { supabase } from '@/integrations/supabase/client';

export const RealTimeNotifications: React.FC = () => {
  const { profile } = useAuth();
  const { isViewingAsClient, clientCompany } = useIntegration();
  const { toast } = useToast();

  // Message notifications
  useMessageSync((payload) => {
    if (payload.eventType === 'INSERT' && payload.new.recipient_id === profile?.user_id) {
      toast({
        title: "New Message",
        description: `${payload.new.subject}`,
      });
    }
  });

  // Inventory notifications for client users
  useInventorySync((payload) => {
    if (payload.eventType === 'UPDATE' && profile?.role === 'client') {
      if (payload.old?.quantity !== payload.new?.quantity) {
        const change = (payload.new?.quantity || 0) - (payload.old?.quantity || 0);
        const changeText = change > 0 ? `+${change}` : `${change}`;
        
        toast({
          title: "Inventory Updated",
          description: `Stock level changed by ${changeText} units`,
        });
      }
    }
  });

  // Order notifications
  useOrderSync((payload) => {
    if (payload.eventType === 'UPDATE' && payload.old?.status !== payload.new?.status) {
      toast({
        title: "Order Status Update",
        description: `Order ${payload.new.order_number} is now ${payload.new.status}`,
      });
    }
  });

  // Check-in request notifications
  useCheckInRequestSync(async (payload) => {
    // Check if user is admin to show new request notifications
    const { data: userRoles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', profile?.user_id || '')
      .single();
    
    const isAdmin = userRoles?.role === 'admin' || userRoles?.role === 'super_admin';

    if (payload.eventType === 'INSERT' && isAdmin) {
      toast({
        title: "New Check-In Request",
        description: `Request ${payload.new.request_number} has been submitted`,
      });
    } else if (payload.eventType === 'UPDATE' && payload.old?.status !== payload.new?.status) {
      const statusMessages: Record<string, string> = {
        approved: "Your check-in request has been approved! ✅",
        rejected: "Your check-in request has been rejected. Please review the feedback.",
        amended: "Your check-in request has been amended by admin."
      };
      
      if (statusMessages[payload.new.status]) {
        toast({
          title: "Check-In Request Update",
          description: `Request ${payload.new.request_number}: ${statusMessages[payload.new.status]}`,
          variant: payload.new.status === 'rejected' ? 'destructive' : 'default'
        });
      }
    }
  });

  // Check-out request notifications
  useCheckOutRequestSync(async (payload) => {
    // Check if user is admin to show new request notifications
    const { data: userRoles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', profile?.user_id || '')
      .single();
    
    const isAdmin = userRoles?.role === 'admin' || userRoles?.role === 'super_admin';

    if (payload.eventType === 'INSERT' && isAdmin) {
      toast({
        title: "New Check-Out Request",
        description: `Request ${payload.new.request_number} has been submitted`,
      });
    } else if (payload.eventType === 'UPDATE' && payload.old?.status !== payload.new?.status) {
      const statusMessages: Record<string, string> = {
        approved: "Your check-out request has been approved! ✅",
        rejected: "Your check-out request has been rejected. Please review the feedback.",
      };
      
      if (statusMessages[payload.new.status]) {
        toast({
          title: "Check-Out Request Update",
          description: `Request ${payload.new.request_number}: ${statusMessages[payload.new.status]}`,
          variant: payload.new.status === 'rejected' ? 'destructive' : 'default'
        });
      }
    }
  });

  return null; // This component only provides notifications
};
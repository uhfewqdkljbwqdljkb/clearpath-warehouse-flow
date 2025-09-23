import React, { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useIntegration } from '@/contexts/IntegrationContext';
import { useToast } from '@/hooks/use-toast';
import { useInventorySync, useOrderSync, useMessageSync } from '@/hooks/useRealTimeSync';

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

  return null; // This component only provides notifications
};
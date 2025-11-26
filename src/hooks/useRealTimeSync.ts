import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface UseRealTimeSyncOptions {
  table: string;
  onInsert?: (payload: any) => void;
  onUpdate?: (payload: any) => void;
  onDelete?: (payload: any) => void;
  filter?: string;
}

export const useRealTimeSync = ({
  table,
  onInsert,
  onUpdate,
  onDelete,
  filter
}: UseRealTimeSyncOptions) => {
  const { profile } = useAuth();
  const { toast } = useToast();

  const handleInsert = useCallback((payload: any) => {
    console.log(`Real-time INSERT on ${table}:`, payload);
    onInsert?.(payload);
    
    // Show notification for relevant updates
    if (table === 'messages' && payload.new.recipient_id === profile?.user_id) {
      toast({
        title: "New Message",
        description: `You have a new message: ${payload.new.subject}`,
      });
    }
  }, [table, onInsert, profile?.user_id, toast]);

  const handleUpdate = useCallback((payload: any) => {
    console.log(`Real-time UPDATE on ${table}:`, payload);
    onUpdate?.(payload);
  }, [table, onUpdate]);

  const handleDelete = useCallback((payload: any) => {
    console.log(`Real-time DELETE on ${table}:`, payload);
    onDelete?.(payload);
  }, [table, onDelete]);

  useEffect(() => {
    if (!profile?.user_id) return;

    const channel = supabase
      .channel(`realtime-${table}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: table,
          filter: filter
        },
        handleInsert
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: table,
          filter: filter
        },
        handleUpdate
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: table,
          filter: filter
        },
        handleDelete
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.user_id, table, filter, handleInsert, handleUpdate, handleDelete]);
};

// Specific hook for inventory synchronization
export const useInventorySync = (onInventoryChange?: (payload: any) => void) => {
  const { profile } = useAuth();
  
  return useRealTimeSync({
    table: 'inventory_items',
    filter: profile?.company_id ? `company_id=eq.${profile.company_id}` : undefined,
    onInsert: onInventoryChange,
    onUpdate: onInventoryChange,
    onDelete: onInventoryChange
  });
};

// Specific hook for order synchronization
export const useOrderSync = (onOrderChange?: (payload: any) => void) => {
  const { profile } = useAuth();
  
  return useRealTimeSync({
    table: 'client_orders',
    filter: profile?.company_id ? `company_id=eq.${profile.company_id}` : undefined,
    onInsert: onOrderChange,
    onUpdate: onOrderChange,
    onDelete: onOrderChange
  });
};

// Specific hook for message synchronization
export const useMessageSync = (onMessageChange?: (payload: any) => void) => {
  const { profile } = useAuth();
  
  return useRealTimeSync({
    table: 'messages',
    filter: profile?.user_id ? `recipient_id=eq.${profile.user_id}` : undefined,
    onInsert: onMessageChange,
    onUpdate: onMessageChange,
    onDelete: onMessageChange
  });
};

// Specific hook for check-in request synchronization
export const useCheckInRequestSync = (onRequestChange?: (payload: any) => void) => {
  const { profile } = useAuth();
  
  return useRealTimeSync({
    table: 'check_in_requests',
    filter: profile?.company_id ? `company_id=eq.${profile.company_id}` : undefined,
    onInsert: onRequestChange,
    onUpdate: onRequestChange,
    onDelete: onRequestChange
  });
};

// Specific hook for check-out request synchronization
export const useCheckOutRequestSync = (onRequestChange?: (payload: any) => void) => {
  const { profile } = useAuth();
  
  return useRealTimeSync({
    table: 'check_out_requests',
    filter: profile?.company_id ? `company_id=eq.${profile.company_id}` : undefined,
    onInsert: onRequestChange,
    onUpdate: onRequestChange,
    onDelete: onRequestChange
  });
};
import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import type { 
  FinancialTransaction, 
  FinancialMetrics, 
  FinancialFilters 
} from '@/types/delivery';

export function useFinancials(filters?: FinancialFilters) {
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('financial_transactions')
        .select(`
          *,
          company:companies(id, name),
          delivery_order:delivery_orders(id, order_number)
        `)
        .order('transaction_date', { ascending: false });

      if (filters?.dateFrom) {
        query = query.gte('transaction_date', filters.dateFrom);
      }
      if (filters?.dateTo) {
        query = query.lte('transaction_date', filters.dateTo);
      }
      if (filters?.transactionType?.length) {
        query = query.in('transaction_type', filters.transactionType);
      }
      if (filters?.category?.length) {
        query = query.in('category', filters.category);
      }
      if (filters?.companyId) {
        query = query.eq('company_id', filters.companyId);
      }
      if (filters?.isReconciled !== undefined) {
        query = query.eq('is_reconciled', filters.isReconciled);
      }

      const { data, error } = await query;

      if (error) throw error;
      setTransactions((data || []) as unknown as FinancialTransaction[]);
    } catch (err: any) {
      console.error('Error fetching transactions:', err);
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [filters, toast]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const metrics = useMemo<FinancialMetrics>(() => {
    const revenue = transactions
      .filter(t => t.transaction_type === 'revenue')
      .reduce((sum, t) => sum + Number(t.amount), 0);
    
    const costs = transactions
      .filter(t => t.transaction_type === 'cost')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const ordersCount = new Set(
      transactions
        .filter(t => t.delivery_order_id)
        .map(t => t.delivery_order_id)
    ).size;

    return {
      totalRevenue: revenue,
      revenueChange: 0,
      totalCosts: costs,
      costsChange: 0,
      grossProfit: revenue - costs,
      profitMargin: revenue > 0 ? ((revenue - costs) / revenue) * 100 : 0,
      ordersProcessed: ordersCount,
      averageOrderValue: ordersCount > 0 ? revenue / ordersCount : 0
    };
  }, [transactions]);

  const createTransaction = async (transactionData: {
    transaction_type: string;
    category: string;
    amount: number;
    company_id?: string;
    delivery_order_id?: string;
    description?: string;
    reference_number?: string;
    transaction_date?: string;
  }) => {
    try {
      const { data, error } = await supabase
        .from('financial_transactions')
        .insert(transactionData)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Transaction Created',
        description: 'Financial transaction has been recorded.',
      });

      fetchTransactions();
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

  const reconcileTransactions = async (transactionIds: string[]) => {
    try {
      const { error } = await supabase
        .from('financial_transactions')
        .update({ 
          is_reconciled: true, 
          reconciled_at: new Date().toISOString() 
        })
        .in('id', transactionIds);

      if (error) throw error;

      toast({
        title: 'Transactions Reconciled',
        description: `${transactionIds.length} transactions have been reconciled.`,
      });

      fetchTransactions();
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message,
        variant: 'destructive',
      });
    }
  };

  return {
    transactions,
    metrics,
    loading,
    refetch: fetchTransactions,
    createTransaction,
    reconcileTransactions
  };
}

export function useDeliveryMetrics() {
  const [metrics, setMetrics] = useState({
    ordersToday: 0,
    ordersTodayChange: 0,
    ordersInTransit: 0,
    pendingFulfillment: 0,
    deliverySuccessRate: 0,
    totalRevenue: 0,
    revenueChange: 0,
    totalCosts: 0,
    grossProfit: 0,
    profitMargin: 0
  });
  const [loading, setLoading] = useState(true);

  const fetchMetrics = useCallback(async () => {
    try {
      setLoading(true);
      const today = new Date().toISOString().split('T')[0];
      
      // Orders today
      const { count: ordersToday } = await supabase
        .from('delivery_orders')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today);

      // In transit
      const { count: ordersInTransit } = await supabase
        .from('delivery_orders')
        .select('*', { count: 'exact', head: true })
        .in('status', ['shipped', 'in_transit', 'out_for_delivery']);

      // Pending fulfillment
      const { count: pendingFulfillment } = await supabase
        .from('delivery_orders')
        .select('*', { count: 'exact', head: true })
        .in('status', ['pending', 'confirmed', 'processing']);

      // Success rate (delivered / (delivered + failed + returned))
      const { count: delivered } = await supabase
        .from('delivery_orders')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'delivered');

      const { count: failed } = await supabase
        .from('delivery_orders')
        .select('*', { count: 'exact', head: true })
        .in('status', ['failed', 'returned']);

      const totalCompleted = (delivered || 0) + (failed || 0);
      const successRate = totalCompleted > 0 
        ? ((delivered || 0) / totalCompleted) * 100 
        : 100;

      // Revenue and costs
      const { data: financials } = await supabase
        .from('delivery_orders')
        .select('total_amount, total_cost')
        .eq('status', 'delivered');

      const totalRevenue = financials?.reduce((sum, o) => sum + Number(o.total_amount || 0), 0) || 0;
      const totalCosts = financials?.reduce((sum, o) => sum + Number(o.total_cost || 0), 0) || 0;

      setMetrics({
        ordersToday: ordersToday || 0,
        ordersTodayChange: 0,
        ordersInTransit: ordersInTransit || 0,
        pendingFulfillment: pendingFulfillment || 0,
        deliverySuccessRate: Math.round(successRate),
        totalRevenue,
        revenueChange: 0,
        totalCosts,
        grossProfit: totalRevenue - totalCosts,
        profitMargin: totalRevenue > 0 ? ((totalRevenue - totalCosts) / totalRevenue) * 100 : 0
      });
    } catch (err) {
      console.error('Error fetching metrics:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  return { metrics, loading, refetch: fetchMetrics };
}

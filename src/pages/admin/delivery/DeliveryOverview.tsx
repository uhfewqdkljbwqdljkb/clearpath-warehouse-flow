import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Package, 
  Truck, 
  Clock, 
  CheckCircle, 
  TrendingUp,
  TrendingDown,
  ArrowRight,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { useDeliveryMetrics } from '@/hooks/useFinancials';
import { useDeliveryOrders } from '@/hooks/useDeliveryOrders';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';

export default function DeliveryOverview() {
  const navigate = useNavigate();
  const { metrics, loading: metricsLoading, refetch } = useDeliveryMetrics();
  const { orders, loading: ordersLoading } = useDeliveryOrders({ 
    status: ['pending', 'confirmed', 'processing'] 
  });

  const pendingOrders = orders.filter(o => o.status === 'pending');
  const processingOrders = orders.filter(o => ['confirmed', 'processing', 'picked', 'packed'].includes(o.status));

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Delivery Overview</h1>
          <p className="text-muted-foreground">Monitor and manage all delivery operations</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => navigate('/dashboard/delivery/orders/new')}>
            <Package className="h-4 w-4 mr-2" />
            New Order
          </Button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Orders Today"
          value={metricsLoading ? <Skeleton className="h-8 w-16" /> : metrics.ordersToday}
          change={metrics.ordersTodayChange}
          icon={Package}
          onClick={() => navigate('/dashboard/delivery/orders?filter=today')}
        />
        <MetricCard
          title="In Transit"
          value={metricsLoading ? <Skeleton className="h-8 w-16" /> : metrics.ordersInTransit}
          icon={Truck}
          iconColor="text-blue-500"
          onClick={() => navigate('/dashboard/delivery/orders?status=in_transit')}
        />
        <MetricCard
          title="Pending Fulfillment"
          value={metricsLoading ? <Skeleton className="h-8 w-16" /> : metrics.pendingFulfillment}
          icon={Clock}
          iconColor="text-orange-500"
          onClick={() => navigate('/dashboard/delivery/orders?status=pending')}
        />
        <MetricCard
          title="Delivery Success Rate"
          value={metricsLoading ? <Skeleton className="h-8 w-16" /> : `${metrics.deliverySuccessRate}%`}
          icon={CheckCircle}
          iconColor="text-green-500"
        />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Actions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg">Pending Actions</CardTitle>
            <Badge variant="secondary">{pendingOrders.length + processingOrders.length}</Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            {ordersLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : (
              <>
                {/* Orders needing confirmation */}
                {pendingOrders.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-500" />
                      Needs Confirmation ({pendingOrders.length})
                    </h4>
                    {pendingOrders.slice(0, 3).map(order => (
                      <ActionItem
                        key={order.id}
                        title={order.order_number}
                        subtitle={order.recipient_name}
                        time={format(new Date(order.created_at), 'HH:mm')}
                        onAction={() => navigate(`/dashboard/delivery/orders/${order.id}`)}
                        actionLabel="Confirm"
                      />
                    ))}
                  </div>
                )}

                {/* Orders in processing */}
                {processingOrders.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Clock className="h-4 w-4 text-blue-500" />
                      In Processing ({processingOrders.length})
                    </h4>
                    {processingOrders.slice(0, 3).map(order => (
                      <ActionItem
                        key={order.id}
                        title={order.order_number}
                        subtitle={`${order.status} - ${order.recipient_name}`}
                        time={format(new Date(order.updated_at), 'HH:mm')}
                        onAction={() => navigate(`/dashboard/delivery/orders/${order.id}`)}
                        actionLabel="View"
                      />
                    ))}
                  </div>
                )}

                {pendingOrders.length === 0 && processingOrders.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
                    <p>All caught up! No pending actions.</p>
                  </div>
                )}
              </>
            )}

            {(pendingOrders.length > 3 || processingOrders.length > 3) && (
              <Button 
                variant="link" 
                className="w-full" 
                onClick={() => navigate('/dashboard/delivery/orders')}
              >
                View All Orders <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Financial Summary */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Financial Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 dark:bg-green-950/20">
                <div>
                  <p className="text-sm text-muted-foreground">Total Revenue</p>
                  <p className="text-2xl font-bold text-green-600">
                    {metricsLoading ? (
                      <Skeleton className="h-8 w-24" />
                    ) : (
                      `$${metrics.totalRevenue.toLocaleString()}`
                    )}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-500" />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-red-50 dark:bg-red-950/20">
                <div>
                  <p className="text-sm text-muted-foreground">Total Costs</p>
                  <p className="text-2xl font-bold text-red-600">
                    {metricsLoading ? (
                      <Skeleton className="h-8 w-24" />
                    ) : (
                      `$${metrics.totalCosts.toLocaleString()}`
                    )}
                  </p>
                </div>
                <TrendingDown className="h-8 w-8 text-red-500" />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-primary/10">
                <div>
                  <p className="text-sm text-muted-foreground">Gross Profit</p>
                  <p className="text-2xl font-bold text-primary">
                    {metricsLoading ? (
                      <Skeleton className="h-8 w-24" />
                    ) : (
                      `$${metrics.grossProfit.toLocaleString()}`
                    )}
                  </p>
                </div>
                <Badge variant={metrics.profitMargin >= 0 ? 'default' : 'destructive'}>
                  {metrics.profitMargin.toFixed(1)}% margin
                </Badge>
              </div>

              <Button 
                variant="outline" 
                className="w-full" 
                onClick={() => navigate('/dashboard/financials/overview')}
              >
                View Financial Reports <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <QuickLinkCard
          title="Carriers"
          description="Manage delivery carriers"
          icon={Truck}
          onClick={() => navigate('/dashboard/delivery/carriers')}
        />
        <QuickLinkCard
          title="Drivers"
          description="Manage drivers"
          icon={Package}
          onClick={() => navigate('/dashboard/delivery/drivers')}
        />
        <QuickLinkCard
          title="Live Tracking"
          description="Track deliveries"
          icon={Clock}
          onClick={() => navigate('/dashboard/delivery/tracking')}
        />
        <QuickLinkCard
          title="Integrations"
          description="Shopify & more"
          icon={RefreshCw}
          onClick={() => navigate('/dashboard/delivery/integrations')}
        />
      </div>
    </div>
  );
}

interface MetricCardProps {
  title: string;
  value: React.ReactNode;
  change?: number;
  icon: React.ElementType;
  iconColor?: string;
  onClick?: () => void;
}

function MetricCard({ title, value, change, icon: Icon, iconColor = 'text-primary', onClick }: MetricCardProps) {
  return (
    <Card 
      className={`${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
      onClick={onClick}
    >
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {change !== undefined && change !== 0 && (
              <p className={`text-xs ${change > 0 ? 'text-green-500' : 'text-red-500'}`}>
                {change > 0 ? '+' : ''}{change}% from yesterday
              </p>
            )}
          </div>
          <div className={`p-3 rounded-full bg-muted ${iconColor}`}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface ActionItemProps {
  title: string;
  subtitle: string;
  time: string;
  onAction: () => void;
  actionLabel: string;
}

function ActionItem({ title, subtitle, time, onAction, actionLabel }: ActionItemProps) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{title}</p>
        <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
      </div>
      <div className="flex items-center gap-2 ml-4">
        <span className="text-xs text-muted-foreground">{time}</span>
        <Button size="sm" variant="outline" onClick={onAction}>
          {actionLabel}
        </Button>
      </div>
    </div>
  );
}

interface QuickLinkCardProps {
  title: string;
  description: string;
  icon: React.ElementType;
  onClick: () => void;
}

function QuickLinkCard({ title, description, icon: Icon, onClick }: QuickLinkCardProps) {
  return (
    <Card 
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={onClick}
    >
      <CardContent className="pt-6">
        <Icon className="h-8 w-8 text-primary mb-2" />
        <h3 className="font-medium">{title}</h3>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

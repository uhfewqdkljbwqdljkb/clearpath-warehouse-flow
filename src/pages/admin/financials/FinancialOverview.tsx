import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Package,
  Wallet,
  PieChart,
  BarChart3,
  RefreshCw
} from 'lucide-react';
import { useDeliveryMetrics, useFinancials } from '@/hooks/useFinancials';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPie,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend
} from 'recharts';

const COLORS = ['#2563eb', '#16a34a', '#ea580c', '#8b5cf6', '#06b6d4'];

export default function FinancialOverview() {
  const navigate = useNavigate();
  const [period, setPeriod] = useState('30d');
  const { metrics, loading: metricsLoading, refetch } = useDeliveryMetrics();
  const { transactions, loading: transactionsLoading } = useFinancials();

  // Calculate chart data
  const revenueVsCostData = useMemo(() => {
    // Group transactions by date
    const grouped = transactions.reduce((acc, t) => {
      const date = t.transaction_date;
      if (!acc[date]) {
        acc[date] = { date, revenue: 0, cost: 0 };
      }
      if (t.transaction_type === 'revenue') {
        acc[date].revenue += Number(t.amount);
      } else if (t.transaction_type === 'cost') {
        acc[date].cost += Number(t.amount);
      }
      return acc;
    }, {} as Record<string, { date: string; revenue: number; cost: number }>);

    return Object.values(grouped)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-7);
  }, [transactions]);

  const revenueBySource = useMemo(() => {
    // Mock data - in real app, would come from delivery orders
    return [
      { name: 'Manual', value: 35000 },
      { name: 'Shopify', value: 45000 },
      { name: 'B2B Portal', value: 25000 },
      { name: 'B2C Portal', value: 15000 },
    ];
  }, []);

  const costBreakdown = useMemo(() => {
    const breakdown = transactions
      .filter(t => t.transaction_type === 'cost')
      .reduce((acc, t) => {
        const category = t.category || 'other';
        acc[category] = (acc[category] || 0) + Number(t.amount);
        return acc;
      }, {} as Record<string, number>);

    return Object.entries(breakdown).map(([name, value]) => ({
      name: name.replace(/_/g, ' '),
      value
    }));
  }, [transactions]);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Financial Overview</h1>
          <p className="text-muted-foreground">Track revenue, costs, and profitability</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
              <SelectItem value="90d">Last 90 Days</SelectItem>
              <SelectItem value="1y">This Year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Revenue"
          value={metricsLoading ? null : `$${metrics.totalRevenue.toLocaleString()}`}
          change={12.5}
          icon={DollarSign}
          iconBg="bg-green-100"
          iconColor="text-green-600"
        />
        <MetricCard
          title="Total Costs"
          value={metricsLoading ? null : `$${metrics.totalCosts.toLocaleString()}`}
          change={-3.2}
          icon={Wallet}
          iconBg="bg-red-100"
          iconColor="text-red-600"
        />
        <MetricCard
          title="Gross Profit"
          value={metricsLoading ? null : `$${metrics.grossProfit.toLocaleString()}`}
          change={18.7}
          icon={TrendingUp}
          iconBg="bg-blue-100"
          iconColor="text-blue-600"
        />
        <MetricCard
          title="Orders Processed"
          value={metricsLoading ? null : metrics.ordersInTransit + metrics.pendingFulfillment}
          subtitle={`Avg $${(metrics.totalRevenue / Math.max(1, metrics.ordersInTransit + metrics.pendingFulfillment)).toFixed(2)}/order`}
          icon={Package}
          iconBg="bg-purple-100"
          iconColor="text-purple-600"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue vs Cost Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Revenue vs Cost (Last 7 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {transactionsLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : revenueVsCostData.length === 0 ? (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No data available
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={revenueVsCostData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(value) => `$${value}`} />
                  <Tooltip 
                    formatter={(value: number) => [`$${value.toFixed(2)}`, '']}
                    labelFormatter={(label) => new Date(label).toLocaleDateString()}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stackId="1"
                    stroke="#16a34a" 
                    fill="#16a34a" 
                    fillOpacity={0.3}
                    name="Revenue"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="cost" 
                    stackId="2"
                    stroke="#dc2626" 
                    fill="#dc2626" 
                    fillOpacity={0.3}
                    name="Cost"
                  />
                  <Legend />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Revenue by Source */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Revenue by Source
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsPie>
                <Pie
                  data={revenueBySource}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {revenueBySource.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => [`$${value.toLocaleString()}`, 'Revenue']} />
              </RechartsPie>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Breakdown Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cost Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Cost Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {transactionsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-8 w-full" />
                ))}
              </div>
            ) : costBreakdown.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No cost data</p>
            ) : (
              <div className="space-y-3">
                {costBreakdown.map((item, index) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="text-sm capitalize">{item.name}</span>
                    </div>
                    <span className="font-medium">${item.value.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Profit Margin */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Profit Margin</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-4">
              <div className={`text-5xl font-bold ${metrics.profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {metricsLoading ? (
                  <Skeleton className="h-12 w-24 mx-auto" />
                ) : (
                  `${metrics.profitMargin.toFixed(1)}%`
                )}
              </div>
              <p className="text-muted-foreground mt-2">
                {metrics.profitMargin >= 20 
                  ? 'Excellent margin' 
                  : metrics.profitMargin >= 10 
                    ? 'Good margin'
                    : metrics.profitMargin >= 0
                      ? 'Low margin'
                      : 'Negative margin'}
              </p>
            </div>
            <div className="mt-4 pt-4 border-t space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Revenue</span>
                <span className="text-green-600">${metrics.totalRevenue.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Costs</span>
                <span className="text-red-600">-${metrics.totalCosts.toLocaleString()}</span>
              </div>
              <div className="flex justify-between font-medium pt-2 border-t">
                <span>Gross Profit</span>
                <span className={metrics.grossProfit >= 0 ? 'text-green-600' : 'text-red-600'}>
                  ${metrics.grossProfit.toLocaleString()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => navigate('/dashboard/financials/transactions')}
            >
              <DollarSign className="h-4 w-4 mr-2" />
              View All Transactions
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => navigate('/dashboard/financials/revenue')}
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Revenue Details
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => navigate('/dashboard/financials/costs')}
            >
              <TrendingDown className="h-4 w-4 mr-2" />
              Cost Analysis
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => navigate('/dashboard/financials/reports')}
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Generate Reports
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

interface MetricCardProps {
  title: string;
  value: React.ReactNode;
  change?: number;
  subtitle?: string;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
}

function MetricCard({ title, value, change, subtitle, icon: Icon, iconBg, iconColor }: MetricCardProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm text-muted-foreground">{title}</p>
            {value === null ? (
              <Skeleton className="h-8 w-24 mt-1" />
            ) : (
              <p className="text-2xl font-bold mt-1">{value}</p>
            )}
            {change !== undefined && (
              <div className={`flex items-center gap-1 mt-1 text-sm ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {change >= 0 ? (
                  <ArrowUpRight className="h-4 w-4" />
                ) : (
                  <ArrowDownRight className="h-4 w-4" />
                )}
                <span>{Math.abs(change)}% from last period</span>
              </div>
            )}
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
            )}
          </div>
          <div className={`p-3 rounded-full ${iconBg}`}>
            <Icon className={`h-6 w-6 ${iconColor}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}


import React from 'react';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

const orders = [
  { id: 'ORD-001', client: 'ABC Store', status: 'In Progress', items: 12, amount: 450 },
  { id: 'ORD-002', client: 'XYZ Corp', status: 'Shipped', items: 8, amount: 320 },
  { id: 'ORD-003', client: 'DEF Ltd', status: 'Pending', items: 15, amount: 675 },
  { id: 'ORD-004', client: 'GHI Inc', status: 'Shipped', items: 6, amount: 280 },
  { id: 'ORD-005', client: 'JKL Store', status: 'In Progress', items: 10, amount: 525 },
];

export const RecentOrdersTable: React.FC = () => {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Shipped':
        return 'status-badge-shipped';
      case 'In Progress':
        return 'status-badge-progress';
      case 'Pending':
        return 'status-badge-pending';
      default:
        return 'status-badge-pending';
    }
  };

  return (
    <div className="chart-container">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">Recent Orders</h3>
        <Search className="h-5 w-5 text-muted-foreground cursor-pointer hover:text-foreground" />
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Order #</th>
              <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Client</th>
              <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Status</th>
              <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Items</th>
              <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Amount</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order, index) => (
              <tr key={order.id} className={index % 2 === 0 ? 'bg-muted/20' : ''}>
                <td className="py-3 px-2 text-sm font-medium">{order.id}</td>
                <td className="py-3 px-2 text-sm">{order.client}</td>
                <td className="py-3 px-2">
                  <span className={getStatusBadge(order.status)}>
                    {order.status}
                  </span>
                </td>
                <td className="py-3 px-2 text-sm">{order.items}</td>
                <td className="py-3 px-2 text-sm font-medium">${order.amount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
        <span className="text-sm text-muted-foreground">Showing 1-5 of 156 orders</span>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

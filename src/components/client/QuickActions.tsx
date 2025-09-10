import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, FileText, Truck, MessageSquare, BarChart3, Package } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const QuickActions: React.FC = () => {
  const navigate = useNavigate();

  const actions = [
    {
      icon: <Plus className="h-5 w-5" />,
      title: 'Place New Order',
      description: 'Quick order entry',
      onClick: () => navigate('/client/orders'),
      color: 'bg-blue-50 hover:bg-blue-100 text-blue-700'
    },
    {
      icon: <Package className="h-5 w-5" />,
      title: 'Check Stock Levels',
      description: 'Inventory overview',
      onClick: () => navigate('/client/inventory'),
      color: 'bg-green-50 hover:bg-green-100 text-green-700'
    },
    {
      icon: <Truck className="h-5 w-5" />,
      title: 'Track Shipments',
      description: 'Order tracking',
      onClick: () => navigate('/client/orders'),
      color: 'bg-purple-50 hover:bg-purple-100 text-purple-700'
    },
    {
      icon: <FileText className="h-5 w-5" />,
      title: 'Request Restock',
      description: 'Inventory replenishment',
      onClick: () => navigate('/client/products'),
      color: 'bg-orange-50 hover:bg-orange-100 text-orange-700'
    },
    {
      icon: <BarChart3 className="h-5 w-5" />,
      title: 'View Analytics',
      description: 'Performance insights',
      onClick: () => navigate('/client/analytics'),
      color: 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700'
    },
    {
      icon: <MessageSquare className="h-5 w-5" />,
      title: 'Contact Warehouse',
      description: 'Direct communication',
      onClick: () => navigate('/client/messages'),
      color: 'bg-teal-50 hover:bg-teal-100 text-teal-700'
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>Common tasks to get you started</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {actions.map((action, index) => (
            <Button
              key={index}
              onClick={action.onClick}
              variant="outline"
              className={`h-20 flex-col gap-2 border-2 hover:border-current transition-colors ${action.color}`}
            >
              {action.icon}
              <div className="text-center">
                <div className="font-medium text-sm">{action.title}</div>
                <div className="text-xs opacity-80">{action.description}</div>
              </div>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, FileText, Truck, MessageSquare, BarChart3, Package, Bot, CheckCircle, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const QuickActions: React.FC = () => {
  const navigate = useNavigate();

  const actions = [
    {
      icon: Plus,
      title: 'Place Order',
      description: 'Create new order',
      path: '/client/orders',
    },
    {
      icon: Package,
      title: 'Check Stock',
      description: 'View inventory',
      path: '/client/products',
    },
    {
      icon: CheckCircle,
      title: 'Check In',
      description: 'Receive inventory',
      path: '/client/check-in',
    },
    {
      icon: XCircle,
      title: 'Check Out',
      description: 'Ship products',
      path: '/client/check-out',
    },
    {
      icon: BarChart3,
      title: 'Analytics',
      description: 'View insights',
      path: '/client/analytics',
    },
    {
      icon: Bot,
      title: 'AI Assistant',
      description: 'Get help',
      path: '/client/ai-assistant',
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {actions.map((action, index) => {
            const Icon = action.icon;
            return (
              <Button
                key={index}
                onClick={() => navigate(action.path)}
                variant="outline"
                className="h-24 flex flex-col items-center justify-center gap-2 hover:bg-muted/50 hover:border-primary/50 transition-all group"
              >
                <Icon className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
                <div className="text-center">
                  <div className="font-medium text-sm">{action.title}</div>
                  <div className="text-xs text-muted-foreground">{action.description}</div>
                </div>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
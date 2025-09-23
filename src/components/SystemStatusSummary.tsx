import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  Users, 
  Shield, 
  MessageSquare, 
  Activity, 
  Database,
  Zap,
  Bell,
  Eye,
  Building2
} from 'lucide-react';

interface FeatureStatus {
  name: string;
  description: string;
  status: 'completed' | 'active' | 'configured';
  icon: React.ComponentType<any>;
}

export const SystemStatusSummary: React.FC = () => {
  const features: FeatureStatus[] = [
    {
      name: 'Admin-Client Portal Integration',
      description: 'Seamless switching between admin and client views with session tracking',
      status: 'completed',
      icon: Eye
    },
    {
      name: 'Enhanced User Management',
      description: 'Comprehensive user role management and client administration',
      status: 'completed',
      icon: Users
    },
    {
      name: 'Unified Messaging System',
      description: 'Real-time messaging between admins and clients with priority levels',
      status: 'completed',
      icon: MessageSquare
    },
    {
      name: 'Real-Time Notifications',
      description: 'Live updates for inventory, orders, and messages using Supabase realtime',
      status: 'active',
      icon: Bell
    },
    {
      name: 'Activity Logging & Tracking',
      description: 'Comprehensive audit trail of all user activities and system interactions',
      status: 'active',
      icon: Activity
    },
    {
      name: 'Database Security (RLS)',
      description: 'Row-level security policies ensuring data isolation and access control',
      status: 'configured',
      icon: Shield
    },
    {
      name: 'Client Company Management',
      description: 'Complete client onboarding and company profile management',
      status: 'completed',
      icon: Building2
    },
    {
      name: 'Real-Time Data Sync',
      description: 'Live synchronization of inventory, orders, and user data across all clients',
      status: 'active',
      icon: Zap
    },
    {
      name: 'Enhanced Dashboard Analytics',
      description: 'Rich admin dashboard with client insights and system monitoring',
      status: 'completed',
      icon: Database
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'active':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'configured':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Implemented';
      case 'active':
        return 'Live';
      case 'configured':
        return 'Configured';
      default:
        return 'Pending';
    }
  };

  const completedFeatures = features.filter(f => f.status === 'completed').length;
  const totalFeatures = features.length;
  const completionPercentage = Math.round((completedFeatures / totalFeatures) * 100);

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-green-600" />
          Admin-Client Portal Integration Status
          <Badge variant="outline" className="ml-2 bg-green-100 text-green-800">
            {completionPercentage}% Complete
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                <div className="flex-shrink-0 p-2 rounded-full bg-muted">
                  <IconComponent className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-medium text-sm">{feature.name}</h4>
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${getStatusColor(feature.status)}`}
                    >
                      {getStatusText(feature.status)}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{feature.description}</p>
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Summary Stats */}
        <div className="mt-6 pt-4 border-t">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-green-600">{completedFeatures}</div>
              <div className="text-sm text-muted-foreground">Features Implemented</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {features.filter(f => f.status === 'active').length}
              </div>
              <div className="text-sm text-muted-foreground">Systems Active</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">
                {features.filter(f => f.status === 'configured').length}
              </div>
              <div className="text-sm text-muted-foreground">Security Policies</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MoreHorizontal } from 'lucide-react';

const activityData = [
  {
    user: 'Leo Fernandez',
    action: 'confirmed receipt of 40 units of Winter Jacket Series in Section B3 (Apparel)',
    time: '01:45 PM',
    icon: '✅',
    iconBg: 'bg-gray-800'
  },
  {
    user: 'Ava Martinez',
    action: 'added 25 units of Smart Router Kit to Section A1 (Electronics)',
    time: '09:15 AM',
    icon: '📦',
    iconBg: 'bg-red-500'
  },
  {
    user: 'Oscar Liem',
    action: 'dispatched 18 units of Stainless Steel Cookware Set from Section C5 (Home & Kitchen)',
    time: '06:30 PM',
    icon: '🚛',
    iconBg: 'bg-gray-800'
  },
  {
    user: 'Dina Choi',
    action: 'created a shipment entry for Brake Pad Sets in Section D2 (Automotive Parts)',
    time: '04:10 PM',
    icon: '📋',
    iconBg: 'bg-red-500'
  },
];

export const WarehouseActivityLog: React.FC = () => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Warehouse Activity Log</CardTitle>
        <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activityData.map((activity, index) => (
            <div key={index} className="flex items-start space-x-3">
              <div className={`w-8 h-8 ${activity.iconBg} rounded-full flex items-center justify-center text-white text-xs flex-shrink-0`}>
                {activity.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm">
                  <span className="font-medium">{activity.user}</span>{' '}
                  <span className="text-muted-foreground">{activity.action}</span>
                </div>
                <div className="text-xs text-muted-foreground mt-1">{activity.time}</div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
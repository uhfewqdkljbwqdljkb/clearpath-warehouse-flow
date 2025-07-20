import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal } from 'lucide-react';

const packageData = [
  { id: 'PKG-HK7420', client: 'March 20, 2035 - 05:30 PM', status: 'Sent', statusColor: 'bg-red-100 text-red-800' },
  { id: 'PKG-A50812', client: 'March 21, 2035 - 01:45 PM', status: 'Received', statusColor: 'bg-green-100 text-green-800' },
  { id: 'PKG-E10293', client: 'March 22, 2035 - 09:00 AM', status: 'Expected', statusColor: 'bg-gray-100 text-gray-800' },
];

const statusTabs = ['All', 'Expected', 'Received', 'Sent'];

export const PackageStatusWidget: React.FC = () => {
  const [activeTab, setActiveTab] = useState('All');

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Package Status</CardTitle>
        <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="flex space-x-1 mb-4">
          {statusTabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1 text-xs rounded-full transition-colors ${
                activeTab === tab 
                  ? 'bg-gray-900 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="space-y-3">
          {packageData.map((pkg, index) => (
            <div key={index} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50">
              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                <span className="text-xs font-medium">📦</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm">{pkg.id}</div>
                <div className="text-xs text-muted-foreground truncate">{pkg.client}</div>
              </div>
              <Badge className={`text-xs ${pkg.statusColor}`}>
                {pkg.status}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
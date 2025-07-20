import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, Package, Building, TrendingUp, Filter, 
  Clock, Truck, CheckCircle, AlertCircle, Package2,
  MapPin, Activity, ChevronDown, Search
} from 'lucide-react';

export const WarehouseDashboard: React.FC = () => {
  const [selectedFloor, setSelectedFloor] = useState(1);
  const [orderFilter, setOrderFilter] = useState('All');

  // Mock data for the dashboard
  const keyMetrics = {
    totalClients: { value: 47, change: '+3', period: 'new this month' },
    activeOrders: { value: 284, change: '+12%', period: 'vs yesterday' },
    capacityUsed: { value: 62.5, change: '+1.5%', period: 'warehouse full' }
  };

  const clientInventoryData = [
    { name: 'TechShop Electronics', percentage: 30, packages: 4575, color: 'bg-blue-500' },
    { name: 'Fashion Forward', percentage: 25, packages: 3813, color: 'bg-green-500' },
    { name: 'Home Essentials', percentage: 20, packages: 3050, color: 'bg-purple-500' },
    { name: 'SportStore', percentage: 15, packages: 2288, color: 'bg-orange-500' },
    { name: 'Beauty Plus', percentage: 10, packages: 1525, color: 'bg-gray-500' }
  ];

  const storageAllocation = [
    { floor: 1, section: 'A1-A10', client: 'TechShop', used: 80, available: '20/100' },
    { floor: 1, section: 'B1-B7', client: 'Fashion Fwd', used: 60, available: '40/100' },
    { floor: 2, section: 'C1-C4', client: 'Home Essen', used: 90, available: '10/100' },
    { floor: 2, section: 'D1-D3', client: 'SportStore', used: 50, available: '50/100' },
    { floor: 3, section: 'E1-E2', client: 'Beauty Plus', used: 70, available: '30/100' }
  ];

  const recentOrders = [
    { id: 'ORD-12345', client: 'TechShop', status: 'Shipped', time: 'Mar 20, 05:30 PM', color: 'bg-green-500' },
    { id: 'ORD-12346', client: 'Fashion', status: 'Received', time: 'Mar 21, 01:45 PM', color: 'bg-blue-500' },
    { id: 'ORD-12347', client: 'Home Essen', status: 'Pending', time: 'Mar 21, 03:20 PM', color: 'bg-yellow-500' },
    { id: 'ORD-12348', client: 'SportStore', status: 'Processing', time: 'Mar 21, 04:15 PM', color: 'bg-orange-500' }
  ];

  const warehouseSections = {
    1: [
      { id: 'A1', client: 'TechShop', used: 20, total: 100, color: 'bg-blue-100 border-blue-300' },
      { id: 'A2', client: 'TechShop', used: 15, total: 100, color: 'bg-blue-100 border-blue-300' },
      { id: 'A3', client: 'TechShop', used: 25, total: 100, color: 'bg-blue-100 border-blue-300' },
      { id: 'B1', client: 'Fashion', used: 30, total: 100, color: 'bg-green-100 border-green-300' },
      { id: 'B2', client: 'Fashion', used: 20, total: 100, color: 'bg-green-100 border-green-300' },
      { id: 'B3', client: 'Fashion', used: 35, total: 100, color: 'bg-green-100 border-green-300' }
    ],
    2: [
      { id: 'C1', client: 'Home', used: 10, total: 100, color: 'bg-purple-100 border-purple-300' },
      { id: 'C2', client: 'Home', used: 5, total: 100, color: 'bg-purple-100 border-purple-300' },
      { id: 'D1', client: 'Sport', used: 45, total: 100, color: 'bg-orange-100 border-orange-300' },
      { id: 'D2', client: 'Sport', used: 55, total: 100, color: 'bg-orange-100 border-orange-300' }
    ]
  };

  const activityLog = [
    { user: 'Sarah', action: 'confirmed receipt of 40 units', time: '2min', icon: CheckCircle, color: 'text-green-600' },
    { user: 'Mike', action: 'added 25 Router units to A1', time: '15min', icon: Package, color: 'text-blue-600' },
    { user: 'Lisa', action: 'shipped 18 units to ClientX', time: '1hr', icon: Truck, color: 'text-purple-600' },
    { user: 'David', action: 'updated inventory in B2', time: '2hr', icon: Activity, color: 'text-orange-600' }
  ];

  return (
    <div className="space-y-6 bg-slate-50 min-h-screen p-6">
      {/* Key Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-white shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Clients</p>
                <p className="text-3xl font-bold text-gray-900">{keyMetrics.totalClients.value}</p>
                <div className="flex items-center mt-1">
                  <span className="text-sm font-medium text-green-600">{keyMetrics.totalClients.change} ↗</span>
                  <span className="text-sm text-gray-500 ml-2">{keyMetrics.totalClients.period}</span>
                </div>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Orders</p>
                <p className="text-3xl font-bold text-gray-900">{keyMetrics.activeOrders.value}</p>
                <div className="flex items-center mt-1">
                  <span className="text-sm font-medium text-green-600">{keyMetrics.activeOrders.change} ↗</span>
                  <span className="text-sm text-gray-500 ml-2">{keyMetrics.activeOrders.period}</span>
                </div>
              </div>
              <Package className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Capacity Used</p>
                <p className="text-3xl font-bold text-gray-900">{keyMetrics.capacityUsed.value}%</p>
                <div className="flex items-center mt-1">
                  <span className="text-sm font-medium text-green-600">{keyMetrics.capacityUsed.change} ↗</span>
                  <span className="text-sm text-gray-500 ml-2">{keyMetrics.capacityUsed.period}</span>
                </div>
              </div>
              <Building className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Second Row - Inventory Distribution & Capacity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 bg-white shadow-sm">
          <CardHeader>
            <CardTitle>Client Inventory Distribution</CardTitle>
            <p className="text-sm text-gray-600">15,250 total packages</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {clientInventoryData.map((client, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">{client.name}</span>
                    <span className="text-sm text-gray-500">{client.percentage}% - {client.packages.toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`${client.color} h-2 rounded-full`} 
                      style={{ width: `${client.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm">
          <CardHeader>
            <CardTitle>Capacity Usage</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <div className="relative w-32 h-32 mb-4">
              <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 36 36">
                <path
                  d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth="2"
                />
                <path
                  d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2"
                  strokeDasharray={`${keyMetrics.capacityUsed.value}, 100`}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold text-gray-900">{keyMetrics.capacityUsed.value}%</span>
              </div>
            </div>
            <div className="text-center space-y-1">
              <p className="text-sm text-gray-600">40 occupied sections</p>
              <p className="text-sm text-gray-600">24 available sections</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Third Row - Storage Table & Order Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 bg-white shadow-sm">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Client Storage Allocation</CardTitle>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left text-sm text-gray-600">
                    <th className="pb-3">Floor</th>
                    <th className="pb-3">Section</th>
                    <th className="pb-3">Client</th>
                    <th className="pb-3">Used</th>
                    <th className="pb-3">%</th>
                    <th className="pb-3">Available</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {storageAllocation.map((item, index) => (
                    <tr key={index} className="border-b">
                      <td className="py-3">{item.floor}</td>
                      <td className="py-3 font-medium">{item.section}</td>
                      <td className="py-3">{item.client}</td>
                      <td className="py-3">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${item.used}%` }}
                          ></div>
                        </div>
                      </td>
                      <td className="py-3">{item.used}%</td>
                      <td className="py-3 text-gray-600">{item.available}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm">
          <CardHeader>
            <CardTitle>Order Status</CardTitle>
            <div className="flex space-x-2">
              {['All', 'Pending', 'Shipped', 'Done'].map((filter) => (
                <Button
                  key={filter}
                  variant={orderFilter === filter ? "default" : "outline"}
                  size="sm"
                  onClick={() => setOrderFilter(filter)}
                  className="text-xs"
                >
                  {filter}
                </Button>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentOrders.map((order, index) => (
                <div key={index} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50">
                  <Package2 className="h-4 w-4 text-gray-400" />
                  <div className="flex-1">
                    <p className="font-medium text-sm">{order.id}</p>
                    <p className="text-xs text-gray-600">{order.client} - {order.status}</p>
                    <p className="text-xs text-gray-500">{order.time}</p>
                  </div>
                  <Badge className={`${order.color} text-white text-xs`}>
                    {order.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row - Warehouse Map & Activity Log */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 bg-white shadow-sm">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Warehouse Layout</CardTitle>
              <div className="flex space-x-2">
                {[1, 2].map((floor) => (
                  <Button
                    key={floor}
                    variant={selectedFloor === floor ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedFloor(floor)}
                  >
                    Floor {floor}
                  </Button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              {warehouseSections[selectedFloor]?.map((section, index) => (
                <div
                  key={index}
                  className={`${section.color} border-2 rounded-lg p-3 cursor-pointer hover:shadow-md transition-shadow`}
                >
                  <div className="text-center">
                    <p className="font-semibold text-sm">{section.id}</p>
                    <p className="text-xs text-gray-600">{section.client}</p>
                    <p className="text-xs font-medium">{section.used}/{section.total}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm">
          <CardHeader>
            <CardTitle>Activity Log</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activityLog.map((activity, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <activity.icon className={`h-4 w-4 mt-1 ${activity.color}`} />
                  <div className="flex-1">
                    <p className="text-sm">
                      <span className="font-medium">{activity.user}</span> {activity.action}
                    </p>
                    <p className="text-xs text-gray-500">{activity.time} ago</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
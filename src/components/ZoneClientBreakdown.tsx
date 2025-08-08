import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { MapPin, Users, DollarSign, Package } from 'lucide-react';
import { warehouseZones, clients } from '@/data/warehouseData';

export const ZoneClientBreakdown: React.FC = () => {
  const zoneData = warehouseZones.map(zone => {
    const zoneClients = clients.filter(client => zone.clients.includes(client.name));
    const totalValue = zoneClients.reduce((sum, client) => sum + client.totalValue, 0);
    const totalOrders = zoneClients.reduce((sum, client) => sum + client.monthlyOrders, 0);
    
    return {
      ...zone,
      clientCount: zoneClients.length,
      totalValue,
      totalOrders,
      avgOrderValue: totalOrders > 0 ? totalValue / totalOrders : 0
    };
  }).filter(zone => zone.clientCount > 0);

  const maxValue = Math.max(...zoneData.map(z => z.totalValue));

  return (
    <div className="space-y-6">
      {/* Zone Overview Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart className="h-5 w-5" />
            <span>Zone Revenue Distribution</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={zoneData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="code" />
              <YAxis />
              <Tooltip 
                formatter={(value: number) => [`$${value.toLocaleString()}`, 'Revenue']}
                labelFormatter={(label) => `Zone ${label}`}
              />
              <Bar dataKey="totalValue" radius={[4, 4, 0, 0]}>
                {zoneData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Detailed Zone Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {zoneData.map(zone => {
          const zoneClients = clients.filter(client => zone.clients.includes(client.name));
          const valuePercentage = (zone.totalValue / maxValue) * 100;

          return (
            <Card key={zone.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: zone.color }}
                    />
                    <span>{zone.name} ({zone.code})</span>
                  </CardTitle>
                  <Badge 
                    variant="outline"
                    style={{ borderColor: zone.color, color: zone.color }}
                  >
                    {zone.utilization}% utilized
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Zone Metrics */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-lg font-bold text-gray-900">{zone.clientCount}</div>
                    <div className="text-sm text-gray-600 flex items-center justify-center space-x-1">
                      <Users className="h-3 w-3" />
                      <span>Clients</span>
                    </div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-lg font-bold text-gray-900">
                      ${(zone.totalValue / 1000).toFixed(0)}K
                    </div>
                    <div className="text-sm text-gray-600 flex items-center justify-center space-x-1">
                      <DollarSign className="h-3 w-3" />
                      <span>Revenue</span>
                    </div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-lg font-bold text-gray-900">{zone.totalItems}</div>
                    <div className="text-sm text-gray-600 flex items-center justify-center space-x-1">
                      <Package className="h-3 w-3" />
                      <span>Items</span>
                    </div>
                  </div>
                </div>

                {/* Revenue Progress */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Revenue Share</span>
                    <span className="font-medium">{valuePercentage.toFixed(1)}%</span>
                  </div>
                  <Progress value={valuePercentage} />
                </div>

                {/* Client List */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-900 flex items-center space-x-1">
                    <Users className="h-4 w-4" />
                    <span>Clients in Zone</span>
                  </h4>
                  <div className="space-y-2">
                    {zoneClients.map(client => (
                      <div key={client.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                        <div>
                          <div className="font-medium text-sm text-gray-900">{client.name}</div>
                          <div className="text-xs text-gray-500">{client.products.length} products</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-gray-900">
                            ${(client.totalValue / 1000).toFixed(0)}K
                          </div>
                          <div className="text-xs text-gray-500">
                            {client.monthlyOrders}/mo
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Product Categories */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-900 flex items-center space-x-1">
                    <Package className="h-4 w-4" />
                    <span>Product Categories</span>
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    {zone.productCategories.map(category => (
                      <Badge 
                        key={category}
                        variant="secondary"
                        className="text-xs"
                      >
                        {category}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
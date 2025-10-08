import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { MapPin, Users, DollarSign, Package } from 'lucide-react';

interface ZoneClientBreakdownProps {
  zones: any[];
  companies: any[];
}

export const ZoneClientBreakdown: React.FC<ZoneClientBreakdownProps> = ({ zones, companies }) => {
  // Filter to only show occupied zones
  const occupiedZones = zones.filter(zone => zone.is_occupied || zone.zone_type === 'shelf');
  const zoneData = occupiedZones.map(zone => {
    let zoneClients: any[] = [];
    let totalValue = 0;
    
    if (zone.zone_type === 'floor') {
      // For floor zones, find the single assigned company
      const company = companies.find(c => c.assigned_floor_zone_id === zone.id);
      if (company) {
        zoneClients = [{
          id: company.id,
          name: company.name,
          totalValue: (company.monthly_fee || 0) * 12, // Annualized
          monthlyOrders: 0, // Will be calculated from orders in future
          products: [] // Will be populated from client_products
        }];
        totalValue = (company.monthly_fee || 0) * 12;
      }
    } else if (zone.zone_type === 'shelf') {
      // For shelf zone, aggregate companies from occupied rows
      if (zone.rows) {
        const occupiedRows = zone.rows.filter((row: any) => row.is_occupied && row.assigned_company_id);
        const companyIds = [...new Set(occupiedRows.map((row: any) => row.assigned_company_id))];
        zoneClients = companies
          .filter(c => companyIds.includes(c.id))
          .map(company => ({
            id: company.id,
            name: company.name,
            totalValue: (company.monthly_fee || 0) * 12,
            monthlyOrders: 0,
            products: []
          }));
        totalValue = zoneClients.reduce((sum, client) => sum + client.totalValue, 0);
      }
    }
    
    return {
      ...zone,
      clientCount: zoneClients.length,
      totalValue,
      totalItems: zone.total_items || 0,
      zoneClients,
      productCategories: [] // Will be populated from client_products in future
    };
  }).filter(zone => zone.clientCount > 0);
  const maxValue = Math.max(...zoneData.map(z => z.totalValue));
  return <div className="space-y-6">
      {/* Zone Overview Chart */}
      

      {/* Detailed Zone Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {zoneData.map(zone => {
        const valuePercentage = maxValue > 0 ? zone.totalValue / maxValue * 100 : 0;
        return <Card key={zone.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <div className="w-4 h-4 rounded-full" style={{
                  backgroundColor: zone.color
                }} />
                    <span>{zone.name} ({zone.code})</span>
                  </CardTitle>
                  <Badge variant="outline" style={{
                borderColor: zone.color,
                color: zone.color
              }}>
                    {zone.utilization}% utilized
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Zone Type Badge */}
                <Badge variant={zone.zone_type === 'floor' ? 'default' : 'secondary'}>
                  {zone.zone_type === 'floor' ? 'Dedicated Floor Zone' : 'Shared Shelf Zone'}
                </Badge>

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
                      ${Math.round(zone.totalValue / 1000)}K
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
                    {zone.zoneClients.map((client: any) => <div key={client.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                        <div>
                          <div className="font-medium text-sm text-gray-900">{client.name}</div>
                          <div className="text-xs text-gray-500">Active client</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-gray-900">
                            ${Math.round(client.totalValue / 1000)}K
                          </div>
                          <div className="text-xs text-gray-500">
                            Annual value
                          </div>
                        </div>
                      </div>)}
                  </div>
                </div>
              </CardContent>
            </Card>;
      })}
      </div>
    </div>;
};
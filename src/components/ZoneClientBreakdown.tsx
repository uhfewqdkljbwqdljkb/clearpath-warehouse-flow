import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Users, Package, Box } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ZoneClientBreakdownProps {
  zones: any[];
  companies: any[];
}

export const ZoneClientBreakdown: React.FC<ZoneClientBreakdownProps> = ({ zones, companies }) => {
  const [clientMetrics, setClientMetrics] = useState<Record<string, { productCount: number; totalQuantity: number }>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClientMetrics();
  }, [companies]);

  const fetchClientMetrics = async () => {
    try {
      const { data: productData, error } = await supabase
        .from('client_products')
        .select(`
          company_id,
          id,
          inventory_items(quantity)
        `)
        .eq('is_active', true);

      if (error) {
        console.error('Error fetching product metrics:', error);
        return;
      }

      const metrics: Record<string, { productCount: number; totalQuantity: number }> = {};
      
      productData?.forEach(product => {
        const companyId = product.company_id;
        if (!metrics[companyId]) {
          metrics[companyId] = { productCount: 0, totalQuantity: 0 };
        }
        
        metrics[companyId].productCount += 1;
        
        const totalQuantity = (product.inventory_items as any)?.reduce((sum: number, item: any) => sum + item.quantity, 0) || 0;
        metrics[companyId].totalQuantity += totalQuantity;
      });

      setClientMetrics(metrics);
    } catch (error) {
      console.error('Error fetching client metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter to only show occupied zones
  const occupiedZones = zones.filter(zone => zone.is_occupied || zone.zone_type === 'shelf');
  const zoneData = occupiedZones.map(zone => {
    let zoneClients: any[] = [];
    let totalProducts = 0;
    let totalQuantity = 0;
    
    if (zone.zone_type === 'floor') {
      // For floor zones, find the single assigned company
      const company = companies.find(c => c.assigned_floor_zone_id === zone.id);
      if (company) {
        const metrics = clientMetrics[company.id] || { productCount: 0, totalQuantity: 0 };
        zoneClients = [{
          id: company.id,
          name: company.name,
          productCount: metrics.productCount,
          totalQuantity: metrics.totalQuantity
        }];
        totalProducts = metrics.productCount;
        totalQuantity = metrics.totalQuantity;
      }
    } else if (zone.zone_type === 'shelf') {
      // For shelf zone, aggregate companies from occupied rows
      if (zone.rows) {
        const occupiedRows = zone.rows.filter((row: any) => row.is_occupied && row.assigned_company_id);
        const companyIds = [...new Set(occupiedRows.map((row: any) => row.assigned_company_id))];
        zoneClients = companies
          .filter(c => companyIds.includes(c.id))
          .map(company => {
            const metrics = clientMetrics[company.id] || { productCount: 0, totalQuantity: 0 };
            return {
              id: company.id,
              name: company.name,
              productCount: metrics.productCount,
              totalQuantity: metrics.totalQuantity
            };
          });
        totalProducts = zoneClients.reduce((sum, client) => sum + client.productCount, 0);
        totalQuantity = zoneClients.reduce((sum, client) => sum + client.totalQuantity, 0);
      }
    }
    
    return {
      ...zone,
      clientCount: zoneClients.length,
      totalProducts,
      totalQuantity,
      zoneClients
    };
  }).filter(zone => zone.clientCount > 0);
  
  const maxProducts = Math.max(...zoneData.map(z => z.totalProducts), 1);
  return <div className="space-y-6">
      {/* Zone Overview Chart */}
      

      {/* Detailed Zone Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {zoneData.map(zone => {
        const productPercentage = maxProducts > 0 ? zone.totalProducts / maxProducts * 100 : 0;
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
                    <div className="text-lg font-bold text-gray-900">{zone.totalProducts}</div>
                    <div className="text-sm text-gray-600 flex items-center justify-center space-x-1">
                      <Package className="h-3 w-3" />
                      <span>Products</span>
                    </div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-lg font-bold text-gray-900">{zone.totalQuantity.toLocaleString()}</div>
                    <div className="text-sm text-gray-600 flex items-center justify-center space-x-1">
                      <Box className="h-3 w-3" />
                      <span>Total Qty</span>
                    </div>
                  </div>
                </div>

                {/* Product Share Progress */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Product Share</span>
                    <span className="font-medium">{productPercentage.toFixed(1)}%</span>
                  </div>
                  <Progress value={productPercentage} />
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
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="text-sm font-medium text-gray-900">
                              {client.productCount}
                            </div>
                            <div className="text-xs text-gray-500">
                              Products
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium text-gray-900">
                              {client.totalQuantity.toLocaleString()}
                            </div>
                            <div className="text-xs text-gray-500">
                              Total Qty
                            </div>
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
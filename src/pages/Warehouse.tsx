import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { 
  Warehouse as WarehouseIcon, 
  Package, 
  MapPin, 
  Search,
  Plus,
  TrendingUp,
  Users,
  Box
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { WarehouseMetricsCard } from '@/components/WarehouseMetricsCard';

export const Warehouse: React.FC = () => {
  const [zones, setZones] = useState<any[]>([]);
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchWarehouseData();
  }, []);

  const fetchWarehouseData = async () => {
    try {
      // Fetch zones
      const { data: zonesData, error: zonesError } = await supabase
        .from('warehouse_zones')
        .select('*')
        .order('code');

      if (zonesError) throw zonesError;

      // Fetch rows with zone information
      const { data: rowsData, error: rowsError } = await supabase
        .from('warehouse_rows')
        .select(`
          *,
          warehouse_zones (
            id,
            name,
            code,
            color
          ),
          companies:assigned_company_id (
            id,
            name,
            client_code
          )
        `)
        .order('row_number');

      if (rowsError) throw rowsError;

      setZones(zonesData || []);
      setRows(rowsData || []);
    } catch (error) {
      console.error('Error fetching warehouse data:', error);
      toast({
        title: "Error",
        description: "Failed to load warehouse data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Calculate metrics
  const totalZones = zones.length;
  const activeZones = zones.filter(z => z.is_active).length;
  const totalRows = rows.length;
  const occupiedRows = rows.filter(r => r.is_occupied).length;
  
  const totalCapacity = zones.reduce((sum, z) => sum + (z.total_capacity_cubic_feet || 0), 0);
  const totalUsage = zones.reduce((sum, z) => sum + (z.current_usage_sqft || 0), 0);
  const utilizationPercentage = totalCapacity > 0 ? Math.round((totalUsage / totalCapacity) * 100) : 0;

  const filteredZones = zones.filter(zone =>
    zone.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    zone.code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredRows = rows.filter(row =>
    row.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    row.row_number?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getUtilizationColor = (percentage: number) => {
    if (percentage >= 90) return 'text-red-600 bg-red-50';
    if (percentage >= 70) return 'text-yellow-600 bg-yellow-50';
    return 'text-green-600 bg-green-50';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Warehouse Operations</h1>
          <p className="text-muted-foreground">
            Manage warehouse zones, rows, and storage capacity
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <WarehouseMetricsCard
          title="Total Zones"
          value={totalZones.toString()}
          subtitle={`${activeZones} active`}
          icon={WarehouseIcon}
        />
        <WarehouseMetricsCard
          title="Total Rows"
          value={totalRows.toString()}
          subtitle={`${occupiedRows} occupied`}
          icon={Box}
        />
        <WarehouseMetricsCard
          title="Capacity"
          value={`${totalCapacity.toLocaleString()} ft³`}
          subtitle="Total cubic feet"
          icon={Package}
        />
        <WarehouseMetricsCard
          title="Utilization"
          value={`${utilizationPercentage}%`}
          subtitle={utilizationPercentage >= 80 ? "High capacity" : "Good space"}
          icon={TrendingUp}
          trend={utilizationPercentage >= 80 ? "↑" : "→"}
          trendType={utilizationPercentage >= 80 ? "negative" : "positive"}
        />
      </div>

      {/* Warehouse Tabs */}
      <Tabs defaultValue="zones" className="space-y-4">
        <TabsList>
          <TabsTrigger value="zones">Floor Zones</TabsTrigger>
          <TabsTrigger value="rows">Shelf Rows</TabsTrigger>
        </TabsList>

        {/* Search */}
        <div className="flex items-center space-x-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search warehouse..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>

        {/* Floor Zones Tab */}
        <TabsContent value="zones" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Floor Zones ({filteredZones.length})</CardTitle>
              <CardDescription>
                Dedicated floor zones for client storage
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-muted-foreground">Loading zones...</div>
                </div>
              ) : filteredZones.length === 0 ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-muted-foreground">
                    {searchTerm ? 'No zones found matching your search.' : 'No zones configured yet.'}
                  </div>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Capacity</TableHead>
                      <TableHead>Usage</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredZones.map((zone) => {
                      const utilization = zone.capacity_sqft > 0 
                        ? Math.round((zone.current_usage_sqft / zone.capacity_sqft) * 100)
                        : 0;
                      
                      return (
                        <TableRow key={zone.id}>
                          <TableCell className="font-medium">{zone.code}</TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <div 
                                className="w-3 h-3 rounded-full" 
                                style={{ backgroundColor: zone.color }}
                              />
                              <span>{zone.name}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{zone.zone_type}</Badge>
                          </TableCell>
                          <TableCell>
                            {zone.total_capacity_cubic_feet?.toLocaleString() || 0} ft³
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="flex items-center space-x-2">
                                <div className="w-24 bg-gray-200 rounded-full h-2">
                                  <div 
                                    className={`h-2 rounded-full ${
                                      utilization >= 90 ? 'bg-red-500' : 
                                      utilization >= 70 ? 'bg-yellow-500' : 'bg-green-500'
                                    }`}
                                    style={{ width: `${Math.min(utilization, 100)}%` }}
                                  />
                                </div>
                                <Badge className={getUtilizationColor(utilization)}>
                                  {utilization}%
                                </Badge>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={zone.is_active ? "default" : "secondary"}>
                              {zone.is_active ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Shelf Rows Tab */}
        <TabsContent value="rows" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Shelf Rows ({filteredRows.length})</CardTitle>
              <CardDescription>
                Individual shelf rows for shared client storage
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-muted-foreground">Loading rows...</div>
                </div>
              ) : filteredRows.length === 0 ? (
                <div className="flex items-center justify-center py-8">
                  <div className="text-muted-foreground">
                    {searchTerm ? 'No rows found matching your search.' : 'No rows configured yet.'}
                  </div>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Row Code</TableHead>
                      <TableHead>Row Number</TableHead>
                      <TableHead>Zone</TableHead>
                      <TableHead>Capacity</TableHead>
                      <TableHead>Usage</TableHead>
                      <TableHead>Assigned To</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRows.map((row) => {
                      const utilization = row.capacity_cubic_ft > 0 
                        ? Math.round((row.current_usage_cubic_ft / row.capacity_cubic_ft) * 100)
                        : 0;
                      
                      return (
                        <TableRow key={row.id}>
                          <TableCell className="font-medium">{row.code}</TableCell>
                          <TableCell>Row {row.row_number}</TableCell>
                          <TableCell>
                            {row.warehouse_zones ? (
                              <div className="flex items-center space-x-2">
                                <div 
                                  className="w-3 h-3 rounded-full" 
                                  style={{ backgroundColor: row.warehouse_zones.color }}
                                />
                                <span className="text-sm">{row.warehouse_zones.code}</span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {row.capacity_cubic_ft?.toLocaleString() || 0} ft³
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="flex items-center space-x-2">
                                <div className="w-24 bg-gray-200 rounded-full h-2">
                                  <div 
                                    className={`h-2 rounded-full ${
                                      utilization >= 90 ? 'bg-red-500' : 
                                      utilization >= 70 ? 'bg-yellow-500' : 'bg-green-500'
                                    }`}
                                    style={{ width: `${Math.min(utilization, 100)}%` }}
                                  />
                                </div>
                                <Badge className={getUtilizationColor(utilization)}>
                                  {utilization}%
                                </Badge>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {row.companies ? (
                              <div>
                                <div className="text-sm font-medium">{row.companies.name}</div>
                                <div className="text-xs text-muted-foreground">{row.companies.client_code}</div>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">Unassigned</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col space-y-1">
                              <Badge variant={row.is_active ? "default" : "secondary"}>
                                {row.is_active ? "Active" : "Inactive"}
                              </Badge>
                              {row.is_occupied && (
                                <Badge variant="outline" className="text-xs">
                                  Occupied
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
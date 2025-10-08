import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  Package, 
  Send, 
  RefreshCw, 
  FileText, 
  TrendingUp, 
  TrendingDown,
  Clock,
  MapPin,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { ZoneUtilizationChart } from '@/components/ZoneUtilizationChart';
import { WarehouseLocationMap } from '@/components/WarehouseLocationMap';
import { LocationsTable } from '@/components/LocationsTable';
import { WarehouseActivityFeed } from '@/components/WarehouseActivityFeed';
import { ClientPerformance } from '@/components/ClientPerformance';
import { ZoneClientBreakdown } from '@/components/ZoneClientBreakdown';
import { ReceiveInventoryModal } from '@/components/ReceiveInventoryModal';
import { ShipOrderModal } from '@/components/ShipOrderModal';
import { MoveInventoryModal } from '@/components/MoveInventoryModal';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const Warehouse: React.FC = () => {
  const [receiveModalOpen, setReceiveModalOpen] = useState(false);
  const [shipModalOpen, setShipModalOpen] = useState(false);
  const [moveModalOpen, setMoveModalOpen] = useState(false);
  const [warehouseZones, setWarehouseZones] = useState<any[]>([]);
  const [warehouseLocations, setWarehouseLocations] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchWarehouseData();
  }, []);

  const fetchWarehouseData = async () => {
    try {
      // Fetch all zones with their assigned companies
      const { data: zones, error: zonesError } = await supabase
        .from('warehouse_zones')
        .select(`
          *,
          warehouse_rows(*)
        `)
        .eq('is_active', true);

      if (zonesError) throw zonesError;

      // Fetch companies with their warehouse assignments
      const { data: companies, error: companiesError } = await supabase
        .from('companies')
        .select(`
          id,
          name,
          client_code,
          location_type,
          assigned_floor_zone_id,
          assigned_row_id
        `)
        .eq('is_active', true);

      if (companiesError) throw companiesError;

      // Store companies in state
      setCompanies(companies || []);

      // Fetch inventory data to calculate utilization
      const { data: inventory, error: inventoryError } = await supabase
        .from('inventory_items')
        .select('company_id, quantity');

      if (inventoryError) throw inventoryError;

      // Process zones and calculate utilization
      const processedZones = zones?.map(zone => {
        if (zone.zone_type === 'floor') {
          // Check if this floor zone is assigned to a company
          const assignedCompany = companies?.find(c => c.assigned_floor_zone_id === zone.id);
          const companyInventory = inventory?.filter(i => i.company_id === assignedCompany?.id) || [];
          const totalItems = companyInventory.reduce((sum, item) => sum + item.quantity, 0);
          
          return {
            ...zone,
            is_occupied: !!assignedCompany,
            client_name: assignedCompany?.name,
            client_code: assignedCompany?.client_code,
            utilization: assignedCompany ? Math.min((totalItems / (zone.total_capacity_cubic_feet || 1000)) * 100, 100) : 0,
          };
        } else if (zone.zone_type === 'shelf') {
          // For shelf zones, calculate based on occupied rows
          const rows = zone.warehouse_rows || [];
          const occupiedRows = rows.filter((r: any) => r.is_occupied).length;
          const utilization = rows.length > 0 ? (occupiedRows / rows.length) * 100 : 0;
          
          return {
            ...zone,
            rows: rows.map((row: any) => {
              const assignedCompany = companies?.find(c => c.assigned_row_id === row.id);
              const companyInventory = inventory?.filter(i => i.company_id === assignedCompany?.id) || [];
              const totalItems = companyInventory.reduce((sum, item) => sum + item.quantity, 0);
              
              return {
                ...row,
                client_name: assignedCompany?.name,
                client_code: assignedCompany?.client_code,
                utilization: assignedCompany ? Math.min((totalItems / (row.capacity_cubic_feet || 200)) * 100, 100) : 0,
              };
            }),
            utilization,
            total_locations: rows.length,
            occupied_locations: occupiedRows,
          };
        }
        return zone;
      }) || [];

      // Create locations array for LocationsTable and Map
      const locations: any[] = [];
      (processedZones as any[]).forEach((zone: any) => {
        if (zone.zone_type === 'floor') {
          locations.push({
            id: zone.id,
            code: `ZONE-${zone.code}`,
            zone: zone.code,
            type: 'floor',
            status: zone.is_occupied ? 'occupied' : 'available',
            utilization: zone.utilization || 0,
            client: zone.client_name,
            items: 0, // Will be calculated from inventory
          });
        } else if (zone.zone_type === 'shelf' && zone.rows) {
          zone.rows.forEach((row: any) => {
            locations.push({
              id: row.id,
              code: row.code,
              zone: zone.code,
              type: 'shelf',
              status: row.is_occupied ? 'occupied' : 'available',
              utilization: row.utilization || 0,
              client: row.client_name,
              items: 0, // Will be calculated from inventory
            });
          });
        }
      });

      setWarehouseZones(processedZones);
      setWarehouseLocations(locations);
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

  const totalOccupied = warehouseZones.reduce((sum, zone) => {
    if (zone.zone_type === 'floor') {
      return sum + (zone.is_occupied ? 1 : 0);
    } else if (zone.zone_type === 'shelf') {
      return sum + (zone.occupied_locations || 0);
    }
    return sum;
  }, 0);
  
  const totalLocations = warehouseZones.reduce((sum, zone) => {
    if (zone.zone_type === 'floor') {
      return sum + 1;
    } else if (zone.zone_type === 'shelf') {
      return sum + (zone.total_locations || 0);
    }
    return sum;
  }, 0);
  
  const totalItems = warehouseLocations.reduce((sum, loc) => sum + (loc.items || 0), 0);
  const capacityUsed = totalLocations > 0 ? Math.round((totalOccupied / totalLocations) * 100) : 0;

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-lg font-medium text-muted-foreground">Loading warehouse data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header Section */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Warehouse Operations</h1>
          <p className="text-gray-600 mt-1">Manage inventory, locations, and warehouse activities</p>
        </div>
        
        <div className="flex space-x-3">
          <Button 
            onClick={() => setReceiveModalOpen(true)}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <Package className="h-4 w-4 mr-2" />
            Receive Inventory
          </Button>
          <Button 
            onClick={() => setShipModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Send className="h-4 w-4 mr-2" />
            Ship Orders
          </Button>
          <Button 
            onClick={() => setMoveModalOpen(true)}
            variant="outline"
            className="border-gray-300 hover:bg-gray-50"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Move Inventory
          </Button>
          <Button variant="outline" className="border-blue-300 text-blue-600 hover:bg-blue-50">
            <FileText className="h-4 w-4 mr-2" />
            Generate Report
          </Button>
        </div>
      </div>

      {/* Top Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Storage Locations</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalLocations}</div>
            <div className="flex items-center pt-1 space-x-2">
              <Badge variant="outline" className="text-green-600 border-green-200">
                {totalLocations - totalOccupied} available
              </Badge>
              <Badge variant="outline" className="text-red-600 border-red-200">
                {totalOccupied} occupied
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              <span className="text-green-600 font-medium">+2 occupied</span> vs last week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Items in Stock</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalItems.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground flex items-center pt-1">
              <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
              <span className="text-green-600 font-medium">+12%</span> vs last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Capacity Used</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{capacityUsed}%</div>
            <Progress value={capacityUsed} className="mt-2" />
            <p className="text-xs text-muted-foreground flex items-center pt-1">
              <TrendingUp className="h-3 w-3 text-blue-600 mr-1" />
              <span className="text-blue-600 font-medium">+3.2%</span> warehouse full
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Second Row - Zone Utilization & Capacity Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ZoneUtilizationChart zones={warehouseZones} />
        
        <Card>
          <CardHeader>
            <CardTitle>Warehouse Capacity Overview</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <div className="relative w-48 h-48">
              <svg className="w-48 h-48 transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  className="text-gray-200"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={`${capacityUsed * 2.51} 251.2`}
                  className="text-blue-600"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900">{capacityUsed}%</div>
                  <div className="text-sm text-gray-600">Used</div>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mt-6 w-full">
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-700">{totalLocations - totalOccupied}</div>
                <div className="text-sm text-green-600">Available Locations</div>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-700">{totalOccupied}</div>
                <div className="text-sm text-blue-600">Occupied Locations</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Third Row - Zone-Client Relationships */}
      <ZoneClientBreakdown zones={warehouseZones} companies={companies} />

      {/* Fourth Row - Client Performance & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ClientPerformance />
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              Activity feed coming soon...
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Fifth Row - Location Table & Map */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LocationsTable locations={warehouseLocations} zones={warehouseZones.map(zone => ({
          ...zone,
          locations: zone.zone_type === 'shelf' && zone.rows 
            ? zone.rows.map(row => row.location_code)
            : [`ZONE-${zone.code}`]
        }))} />
        <div className="lg:col-span-1">
          <WarehouseLocationMap zones={warehouseZones.map(zone => ({
            ...zone,
            locations: zone.zone_type === 'shelf' && zone.rows 
              ? zone.rows.map(row => row.location_code)
              : [`ZONE-${zone.code}`]
          }))} locations={warehouseLocations} />
        </div>
      </div>

      {/* Bottom Row - Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions & Tasks</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="flex items-center space-x-3">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                <div>
                  <p className="text-sm font-medium text-yellow-800">Zone SUP at 67%</p>
                  <p className="text-xs text-yellow-600">Review capacity</p>
                </div>
              </div>
              <Button size="sm" variant="outline" className="border-yellow-300 text-yellow-700">
                Review
              </Button>
            </div>

            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center space-x-3">
                <Package className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-blue-800">3 orders pending pickup</p>
                  <p className="text-xs text-blue-600">Ready for shipping</p>
                </div>
              </div>
              <Button size="sm" variant="outline" className="border-blue-300 text-blue-700">
                Process
              </Button>
            </div>

            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-green-800">GAD zone optimized</p>
                  <p className="text-xs text-green-600">71% utilization</p>
                </div>
              </div>
              <Badge variant="outline" className="text-green-600 border-green-200">
                Complete
              </Badge>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-900">Pending Tasks</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <div className="flex items-center space-x-2 text-sm">
                <Clock className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600">Move inventory from CLPRW0007</span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <Clock className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600">Allocate CLPCB0001 to client</span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <Clock className="h-4 w-4 text-gray-400" />
                <span className="text-gray-600">Generate weekly report</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modals */}
      <ReceiveInventoryModal 
        open={receiveModalOpen} 
        onOpenChange={setReceiveModalOpen}
        locations={warehouseLocations}
        zones={warehouseZones}
      />
      <ShipOrderModal 
        open={shipModalOpen} 
        onOpenChange={setShipModalOpen}
        locations={warehouseLocations}
      />
      <MoveInventoryModal 
        open={moveModalOpen} 
        onOpenChange={setMoveModalOpen}
        locations={warehouseLocations}
        zones={warehouseZones}
      />
    </div>
  );
};
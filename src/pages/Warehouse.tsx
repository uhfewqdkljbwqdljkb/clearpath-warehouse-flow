import React, { useState } from 'react';
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
import { warehouseZones, warehouseLocations, warehouseMetrics, recentWarehouseActivities } from '@/data/warehouseData';
import { ZoneUtilizationChart } from '@/components/ZoneUtilizationChart';
import { WarehouseLocationMap } from '@/components/WarehouseLocationMap';
import { LocationsTable } from '@/components/LocationsTable';
import { WarehouseActivityFeed } from '@/components/WarehouseActivityFeed';
import { ReceiveInventoryModal } from '@/components/ReceiveInventoryModal';
import { ShipOrderModal } from '@/components/ShipOrderModal';
import { MoveInventoryModal } from '@/components/MoveInventoryModal';

export const Warehouse: React.FC = () => {
  const [receiveModalOpen, setReceiveModalOpen] = useState(false);
  const [shipModalOpen, setShipModalOpen] = useState(false);
  const [moveModalOpen, setMoveModalOpen] = useState(false);

  const totalOccupied = warehouseZones.reduce((sum, zone) => sum + zone.occupied_locations, 0);
  const totalLocations = warehouseZones.reduce((sum, zone) => sum + zone.total_locations, 0);
  const totalItems = warehouseLocations.reduce((sum, loc) => sum + (loc.items || 0), 0);

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
            <div className="text-2xl font-bold">{warehouseMetrics.capacityUsed}%</div>
            <Progress value={warehouseMetrics.capacityUsed} className="mt-2" />
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
                  strokeDasharray={`${warehouseMetrics.capacityUsed * 2.51} 251.2`}
                  className="text-blue-600"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900">{warehouseMetrics.capacityUsed}%</div>
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

      {/* Third Row - Location Table & Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LocationsTable locations={warehouseLocations} zones={warehouseZones} />
        <WarehouseActivityFeed activities={recentWarehouseActivities} />
      </div>

      {/* Bottom Row - Interactive Map & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <WarehouseLocationMap zones={warehouseZones} locations={warehouseLocations} />
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions & Tasks</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
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
              <div className="space-y-2">
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
      </div>

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
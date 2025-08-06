import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { MapPin, Package, User } from 'lucide-react';

interface Location {
  id: string;
  code: string;
  zone_id: string;
  zone_name: string;
  type: string;
  status: 'occupied' | 'available';
  utilization: number;
  client: string | null;
  items: number;
  capacity: number;
}

interface Zone {
  id: string;
  code: string;
  name: string;
  color: string;
  locations: string[];
}

interface WarehouseLocationMapProps {
  zones: Zone[];
  locations: Location[];
}

export const WarehouseLocationMap: React.FC<WarehouseLocationMapProps> = ({ 
  zones, 
  locations 
}) => {
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);

  const getLocationsByZone = (zoneId: string) => {
    return locations.filter(loc => loc.zone_id === zoneId);
  };

  const getStatusColor = (location: Location) => {
    if (location.status === 'available') return 'bg-green-100 border-green-300 hover:bg-green-200';
    if (location.utilization > 80) return 'bg-red-100 border-red-300 hover:bg-red-200';
    if (location.utilization > 50) return 'bg-yellow-100 border-yellow-300 hover:bg-yellow-200';
    return 'bg-blue-100 border-blue-300 hover:bg-blue-200';
  };

  const getStatusText = (location: Location) => {
    if (location.status === 'available') return 'Available';
    if (location.utilization > 80) return 'High';
    if (location.utilization > 50) return 'Medium';
    return 'Low';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <MapPin className="h-5 w-5" />
          <span>Warehouse Layout</span>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Interactive map of all 16 storage locations across 5 zones
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Legend */}
          <div className="flex flex-wrap gap-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-100 border border-green-300 rounded"></div>
              <span className="text-xs">Available</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-100 border border-blue-300 rounded"></div>
              <span className="text-xs">Low Utilization</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-yellow-100 border border-yellow-300 rounded"></div>
              <span className="text-xs">Medium Utilization</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-100 border border-red-300 rounded"></div>
              <span className="text-xs">High Utilization</span>
            </div>
          </div>

          {/* Zone Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {zones.map((zone) => {
              const zoneLocations = getLocationsByZone(zone.id);
              return (
                <div key={zone.id} className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: zone.color }}
                    />
                    <h4 className="font-medium text-sm">{zone.name}</h4>
                    <Badge variant="outline" className="text-xs">
                      {zone.code}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    {zoneLocations.map((location) => (
                      <Dialog key={location.id}>
                        <DialogTrigger asChild>
                          <div
                            className={`p-3 border-2 rounded-lg cursor-pointer transition-colors ${getStatusColor(location)}`}
                            onClick={() => setSelectedLocation(location)}
                          >
                            <div className="text-xs font-mono font-medium">
                              {location.code}
                            </div>
                            <div className="text-xs text-gray-600 mt-1">
                              {getStatusText(location)}
                            </div>
                            {location.status === 'occupied' && (
                              <div className="text-xs text-gray-500 mt-1">
                                {location.utilization}%
                              </div>
                            )}
                          </div>
                        </DialogTrigger>
                        
                        <DialogContent className="max-w-md">
                          <DialogHeader>
                            <DialogTitle className="flex items-center space-x-2">
                              <MapPin className="h-5 w-5" />
                              <span>Location {location.code}</span>
                            </DialogTitle>
                          </DialogHeader>
                          
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <p className="text-sm text-gray-600">Zone</p>
                                <p className="font-medium">{location.zone_name}</p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-600">Type</p>
                                <p className="font-medium">{location.type}</p>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <p className="text-sm text-gray-600">Status</p>
                                <Badge 
                                  variant="outline"
                                  className={
                                    location.status === 'available' 
                                      ? 'border-green-200 text-green-700'
                                      : 'border-blue-200 text-blue-700'
                                  }
                                >
                                  {location.status === 'available' ? 'Available' : 'Occupied'}
                                </Badge>
                              </div>
                              <div>
                                <p className="text-sm text-gray-600">Utilization</p>
                                <p className="font-medium">{location.utilization}%</p>
                              </div>
                            </div>

                            {location.status === 'occupied' && (
                              <>
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <p className="text-sm text-gray-600">Allocated Client</p>
                                    <div className="flex items-center space-x-1">
                                      <User className="h-4 w-4 text-gray-400" />
                                      <p className="font-medium">{location.client}</p>
                                    </div>
                                  </div>
                                  <div>
                                    <p className="text-sm text-gray-600">Items Stored</p>
                                    <div className="flex items-center space-x-1">
                                      <Package className="h-4 w-4 text-gray-400" />
                                      <p className="font-medium">{location.items}/{location.capacity}</p>
                                    </div>
                                  </div>
                                </div>
                              </>
                            )}

                            <div className="flex space-x-2 pt-4">
                              <Button variant="outline" size="sm" className="flex-1">
                                View Details
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="flex-1"
                                disabled={location.status === 'occupied'}
                              >
                                {location.status === 'available' ? 'Allocate' : 'Manage'}
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
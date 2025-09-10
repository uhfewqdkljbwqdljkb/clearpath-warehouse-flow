import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Warehouse, MapPin, DollarSign } from 'lucide-react';

interface StorageLocation {
  locationCode: string;
  zone: string;
  type: string;
  capacity: number;
  used: number;
  utilization: number;
  productsStored: number;
}

interface StorageAllocationProps {
  totalAllocated?: number;
  totalUsed?: number;
  utilizationPercentage?: number;
  monthlyCost?: number;
  locations?: StorageLocation[];
}

export const StorageAllocationCard: React.FC<StorageAllocationProps> = ({
  totalAllocated = 6.1,
  totalUsed = 4.2,
  utilizationPercentage = 68.5,
  monthlyCost = 1250,
  locations = []
}) => {
  const defaultLocations: StorageLocation[] = [
    {
      locationCode: 'CLPRW0004',
      zone: 'Gadgets',
      type: 'shelf_row',
      capacity: 1.8,
      used: 1.2,
      utilization: 67,
      productsStored: 45
    },
    {
      locationCode: 'CLPRW0005', 
      zone: 'Gadgets',
      type: 'shelf_row',
      capacity: 1.8,
      used: 1.3,
      utilization: 72,
      productsStored: 38
    },
    {
      locationCode: 'CLPCB0001',
      zone: 'General Goods',
      type: 'pallet_location',
      capacity: 2.5,
      used: 1.7,
      utilization: 68,
      productsStored: 12
    }
  ];

  const displayLocations = locations.length > 0 ? locations : defaultLocations;

  const getUtilizationColor = (utilization: number) => {
    if (utilization >= 90) return 'text-red-600';
    if (utilization >= 75) return 'text-orange-600';
    if (utilization >= 50) return 'text-yellow-600';
    return 'text-green-600';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Warehouse className="h-5 w-5" />
          Storage Allocation
        </CardTitle>
        <CardDescription>Your allocated warehouse space and usage</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold">{totalAllocated} m³</div>
            <div className="text-sm text-muted-foreground">Total Allocated</div>
          </div>
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold">{totalUsed} m³</div>
            <div className="text-sm text-muted-foreground">Currently Used</div>
          </div>
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold flex items-center justify-center gap-1">
              <DollarSign className="h-5 w-5" />
              {monthlyCost.toLocaleString()}
            </div>
            <div className="text-sm text-muted-foreground">Monthly Cost</div>
          </div>
        </div>

        {/* Overall Utilization */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Overall Utilization</span>
            <span className={`text-sm font-bold ${getUtilizationColor(utilizationPercentage)}`}>
              {utilizationPercentage.toFixed(1)}%
            </span>
          </div>
          <Progress value={utilizationPercentage} className="h-2" />
        </div>

        {/* Location Breakdown */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm">Allocated Locations</h4>
          {displayLocations.map((location, index) => (
            <div key={index} className="border rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium text-sm">{location.locationCode}</span>
                  <Badge variant="outline" className="text-xs">
                    {location.zone}
                  </Badge>
                </div>
                <span className={`text-sm font-medium ${getUtilizationColor(location.utilization)}`}>
                  {location.utilization}%
                </span>
              </div>
              
              <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                <div>
                  <span className="font-medium">Capacity:</span> {location.capacity} m³
                </div>
                <div>
                  <span className="font-medium">Used:</span> {location.used} m³
                </div>
                <div>
                  <span className="font-medium">Products:</span> {location.productsStored}
                </div>
              </div>
              
              <Progress value={location.utilization} className="h-1" />
            </div>
          ))}
        </div>

        {/* Cost Efficiency */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="flex items-center gap-2 text-green-700">
            <DollarSign className="h-4 w-4" />
            <span className="font-medium text-sm">Cost Efficiency</span>
          </div>
          <div className="text-xs text-green-600 mt-1">
            You're paying ${(monthlyCost / totalUsed).toFixed(0)}/m³ vs industry average of $310/m³
            <Badge variant="secondary" className="ml-2 text-green-700">
              15% below market
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
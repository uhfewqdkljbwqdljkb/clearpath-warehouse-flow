import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Eye, Edit, ArrowUpDown } from 'lucide-react';

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
  name: string;
  color: string;
}

interface LocationsTableProps {
  locations: Location[];
  zones: Zone[];
}

export const LocationsTable: React.FC<LocationsTableProps> = ({ 
  locations, 
  zones 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedZone, setSelectedZone] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredLocations = locations.filter(location => {
    const matchesSearch = location.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         location.zone_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (location.client && location.client.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesZone = selectedZone === 'all' || location.zone_id === selectedZone;
    const matchesStatus = statusFilter === 'all' || location.status === statusFilter;
    
    return matchesSearch && matchesZone && matchesStatus;
  });

  const getZoneColor = (zoneId: string) => {
    const zone = zones.find(z => z.id === zoneId);
    return zone?.color || '#6b7280';
  };

  const getStatusBadge = (location: Location) => {
    if (location.status === 'available') {
      return <Badge variant="outline" className="border-green-200 text-green-700">Available</Badge>;
    }
    
    if (location.utilization > 80) {
      return <Badge variant="outline" className="border-red-200 text-red-700">High</Badge>;
    }
    
    if (location.utilization > 50) {
      return <Badge variant="outline" className="border-yellow-200 text-yellow-700">Medium</Badge>;
    }
    
    return <Badge variant="outline" className="border-blue-200 text-blue-700">Low</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Storage Locations</CardTitle>
        <p className="text-sm text-muted-foreground">
          Manage all 16 warehouse storage locations
        </p>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search locations, zones, or clients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={selectedZone} onValueChange={setSelectedZone}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="All Zones" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Zones</SelectItem>
              {zones.map(zone => (
                <SelectItem key={zone.id} value={zone.id}>{zone.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="available">Available</SelectItem>
              <SelectItem value="occupied">Occupied</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-32">
                  <Button variant="ghost" size="sm" className="h-auto p-0 font-medium">
                    Location Code
                    <ArrowUpDown className="ml-2 h-3 w-3" />
                  </Button>
                </TableHead>
                <TableHead>Zone</TableHead>
                <TableHead className="hidden sm:table-cell">Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">Utilization</TableHead>
                <TableHead className="hidden lg:table-cell">Allocated Client</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLocations.map((location) => (
                <TableRow key={location.id}>
                  <TableCell className="font-mono font-medium">
                    {location.code}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: getZoneColor(location.zone_id) }}
                      />
                      <span className="text-sm">{location.zone_name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Badge variant="outline" className="text-xs">
                      {location.type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(location)}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {location.status === 'occupied' ? (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span>{location.utilization}%</span>
                          <span className="text-gray-500">{location.items}/{location.capacity}</span>
                        </div>
                        <Progress value={location.utilization} className="h-1" />
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm">-</span>
                    )}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {location.client ? (
                      <span className="text-sm">{location.client}</span>
                    ) : (
                      <span className="text-gray-400 text-sm">Unallocated</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-1">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {filteredLocations.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No locations found matching your filters.
          </div>
        )}
      </CardContent>
    </Card>
  );
};
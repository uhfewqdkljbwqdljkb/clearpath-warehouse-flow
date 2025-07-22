import React, { useState } from 'react';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Search, Plus, MapPin, Users, BarChart3, AlertTriangle } from 'lucide-react';
import { 
  mockClientAllocations, 
  mockClients, 
  warehouseZones, 
  getAllocationsByClient,
  getAvailableZones,
  calculateZoneUtilization
} from '@/data/mockData';
import { ClientAllocation, Client } from '@/types';
import { AllocationForm } from '@/components/AllocationForm';
import { WarehouseMap } from '@/components/WarehouseMap';

export const Allocations: React.FC = () => {
  const [allocations, setAllocations] = useState<ClientAllocation[]>(mockClientAllocations);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAllocation, setEditingAllocation] = useState<ClientAllocation | null>(null);

  const filteredAllocations = allocations.filter(allocation => {
    const client = mockClients.find(c => c.id === allocation.client_id);
    const clientName = client?.company_name || '';
    
    const matchesSearch = 
      clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      allocation.zone_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      allocation.allocation_type.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesClient = selectedClient === 'all' || allocation.client_id === selectedClient;
    
    return matchesSearch && matchesClient && allocation.is_active;
  });

  const handleAddAllocation = (allocationData: Omit<ClientAllocation, 'id' | 'created_at' | 'updated_at'>) => {
    const newAllocation: ClientAllocation = {
      ...allocationData,
      id: Date.now().toString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setAllocations([...allocations, newAllocation]);
    setIsDialogOpen(false);
  };

  const handleEditAllocation = (allocationData: Omit<ClientAllocation, 'id' | 'created_at' | 'updated_at'>) => {
    if (editingAllocation) {
      const updatedAllocation: ClientAllocation = {
        ...allocationData,
        id: editingAllocation.id,
        created_at: editingAllocation.created_at,
        updated_at: new Date().toISOString(),
      };
      setAllocations(allocations.map(a => a.id === editingAllocation.id ? updatedAllocation : a));
      setEditingAllocation(null);
      setIsDialogOpen(false);
    }
  };

  const openEditDialog = (allocation: ClientAllocation) => {
    setEditingAllocation(allocation);
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingAllocation(null);
  };

  const getClientName = (clientId: string) => {
    const client = mockClients.find(c => c.id === clientId);
    return client ? client.company_name : 'Unknown Client';
  };

  const getAllocationTypeColor = (type: string) => {
    switch (type) {
      case 'zone': return 'bg-green-100 text-green-800';
      case 'row_range': return 'bg-blue-100 text-blue-800';
      case 'specific_bins': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const totalAllocations = allocations.filter(a => a.is_active).length;
  const totalAllocatedSpace = allocations
    .filter(a => a.is_active)
    .reduce((sum, a) => sum + a.allocated_cubic_feet, 0);
  const availableZones = getAvailableZones().length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Location Allocations</h1>
          <p className="text-muted-foreground">
            Manage warehouse space allocation to clients
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingAllocation(null)} className="bg-green-600 hover:bg-green-700 text-white">
              <Plus className="h-4 w-4 mr-2" />
              New Allocation
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingAllocation ? 'Edit Allocation' : 'Create New Allocation'}
              </DialogTitle>
              <DialogDescription>
                {editingAllocation 
                  ? 'Update allocation details and check for conflicts.'
                  : 'Allocate warehouse zones, rows, or specific bins to a client.'
                }
              </DialogDescription>
            </DialogHeader>
            <AllocationForm
              allocation={editingAllocation}
              onSubmit={editingAllocation ? handleEditAllocation : handleAddAllocation}
              onCancel={closeDialog}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Allocations</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAllocations}</div>
            <p className="text-xs text-muted-foreground">
              across {warehouseZones.length} zones
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Allocated Space</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAllocatedSpace.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">cubic feet allocated</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Zones</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{availableZones}</div>
            <p className="text-xs text-muted-foreground">
              zones ready for allocation
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Utilization</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round((totalAllocatedSpace / warehouseZones.reduce((sum, z) => sum + z.total_cubic_feet, 0)) * 100)}%
            </div>
            <p className="text-xs text-muted-foreground">warehouse capacity used</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="allocations" className="space-y-4">
        <TabsList>
          <TabsTrigger value="allocations">Allocations</TabsTrigger>
          <TabsTrigger value="map">Warehouse Map</TabsTrigger>
          <TabsTrigger value="zones">Zone Overview</TabsTrigger>
        </TabsList>

        <TabsContent value="allocations" className="space-y-4">
          {/* Filters */}
          <div className="flex items-center space-x-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search allocations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={selectedClient} onValueChange={setSelectedClient}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by client" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Clients</SelectItem>
                {mockClients.filter(c => c.is_active).map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.company_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Allocations Table */}
          <Card>
            <CardHeader>
              <CardTitle>Client Allocations ({filteredAllocations.length})</CardTitle>
              <CardDescription>
                Current warehouse space allocations per client
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead>Zone</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Location Details</TableHead>
                    <TableHead>Space</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAllocations.map((allocation) => (
                    <TableRow key={allocation.id} className="animate-fade-in">
                      <TableCell className="font-medium">
                        {getClientName(allocation.client_id)}
                      </TableCell>
                      <TableCell>Zone {allocation.zone_id}</TableCell>
                      <TableCell>
                        <Badge className={getAllocationTypeColor(allocation.allocation_type)}>
                          {allocation.allocation_type.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {allocation.allocation_type === 'zone' && 'Entire Zone'}
                        {allocation.allocation_type === 'row_range' && 
                          `Rows ${allocation.start_row_id} - ${allocation.end_row_id}`}
                        {allocation.allocation_type === 'specific_bins' && 
                          `${allocation.specific_bin_ids?.length} bins`}
                      </TableCell>
                      <TableCell>
                        {allocation.allocated_cubic_feet.toLocaleString()} ft³
                      </TableCell>
                      <TableCell>
                        {new Date(allocation.allocation_date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(allocation)}
                        >
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="map">
          <Card>
            <CardHeader>
              <CardTitle>Interactive Warehouse Map</CardTitle>
              <CardDescription>
                Visual representation of warehouse zones and client allocations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <WarehouseMap allocations={allocations.filter(a => a.is_active)} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="zones" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {warehouseZones.map((zone) => {
              const utilization = calculateZoneUtilization(zone.id);
              const clientAllocation = allocations.find(a => 
                a.is_active && a.zone_id === zone.id
              );
              const client = clientAllocation ? 
                mockClients.find(c => c.id === clientAllocation.client_id) : null;

              return (
                <Card key={zone.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      {zone.name}
                      <Badge variant={utilization > 80 ? "destructive" : utilization > 50 ? "default" : "secondary"}>
                        {utilization}% used
                      </Badge>
                    </CardTitle>
                    <CardDescription>
                      {zone.total_rows} rows × {zone.bins_per_row} bins per row
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Space Utilization</span>
                        <span>{zone.allocated_cubic_feet.toLocaleString()} / {zone.total_cubic_feet.toLocaleString()} ft³</span>
                      </div>
                      <Progress value={utilization} className="h-2" />
                    </div>
                    
                    {client ? (
                      <div className="space-y-1">
                        <div className="text-sm font-medium">Allocated to:</div>
                        <div className="text-sm text-muted-foreground">
                          {client.company_name}
                        </div>
                        <Badge className={getAllocationTypeColor(clientAllocation!.allocation_type)}>
                          {clientAllocation!.allocation_type.replace('_', ' ')}
                        </Badge>
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground">
                        Available for allocation
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
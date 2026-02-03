import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  User, 
  Plus, 
  Edit, 
  Phone,
  Mail,
  Car,
  Star,
  Package,
  Truck
} from 'lucide-react';
import { useDeliveryDrivers, useDeliveryCarriers } from '@/hooks/useDeliveryCarriers';
import { Skeleton } from '@/components/ui/skeleton';
import type { DeliveryDriver } from '@/types/delivery';

const statusColors: Record<string, string> = {
  available: 'bg-green-100 text-green-800',
  on_delivery: 'bg-blue-100 text-blue-800',
  off_duty: 'bg-gray-100 text-gray-800',
  inactive: 'bg-red-100 text-red-800',
};

export default function DeliveryDrivers() {
  const { drivers, loading, createDriver, updateDriver, updateDriverStatus } = useDeliveryDrivers();
  const { carriers } = useDeliveryCarriers();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<DeliveryDriver | null>(null);

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    carrier_id: '',
    vehicle_type: '',
    vehicle_plate: '',
    status: 'available',
  });

  const handleOpenDialog = (driver?: DeliveryDriver) => {
    if (driver) {
      setEditingDriver(driver);
      setFormData({
        full_name: driver.full_name,
        email: driver.email || '',
        phone: driver.phone,
        carrier_id: driver.carrier_id || '',
        vehicle_type: driver.vehicle_type || '',
        vehicle_plate: driver.vehicle_plate || '',
        status: driver.status,
      });
    } else {
      setEditingDriver(null);
      setFormData({
        full_name: '',
        email: '',
        phone: '',
        carrier_id: '',
        vehicle_type: '',
        vehicle_plate: '',
        status: 'available',
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    const data = {
      full_name: formData.full_name,
      email: formData.email || undefined,
      phone: formData.phone,
      carrier_id: formData.carrier_id || undefined,
      vehicle_type: formData.vehicle_type || undefined,
      vehicle_plate: formData.vehicle_plate || undefined,
      status: formData.status as 'available' | 'on_delivery' | 'off_duty' | 'inactive',
    };
    
    if (editingDriver) {
      await updateDriver(editingDriver.id, data as any);
    } else {
      await createDriver(data);
    }
    setIsDialogOpen(false);
  };

  const groupedDrivers = {
    available: drivers.filter(d => d.status === 'available' && d.is_active),
    on_delivery: drivers.filter(d => d.status === 'on_delivery' && d.is_active),
    off_duty: drivers.filter(d => d.status === 'off_duty' && d.is_active),
    inactive: drivers.filter(d => !d.is_active),
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Delivery Drivers</h1>
          <p className="text-muted-foreground">Manage your delivery team</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          Add Driver
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-100">
                <User className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{groupedDrivers.available.length}</p>
                <p className="text-sm text-muted-foreground">Available</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-100">
                <Truck className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{groupedDrivers.on_delivery.length}</p>
                <p className="text-sm text-muted-foreground">On Delivery</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-gray-100">
                <User className="h-6 w-6 text-gray-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{groupedDrivers.off_duty.length}</p>
                <p className="text-sm text-muted-foreground">Off Duty</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-primary/10">
                <Package className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{drivers.length}</p>
                <p className="text-sm text-muted-foreground">Total Drivers</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Drivers Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      ) : drivers.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No drivers added yet</p>
            <Button className="mt-4" onClick={() => handleOpenDialog()}>
              Add Your First Driver
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Available Drivers */}
          {groupedDrivers.available.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-green-500" />
                Available ({groupedDrivers.available.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {groupedDrivers.available.map(driver => (
                  <DriverCard
                    key={driver.id}
                    driver={driver}
                    onEdit={() => handleOpenDialog(driver)}
                    onStatusChange={updateDriverStatus}
                  />
                ))}
              </div>
            </div>
          )}

          {/* On Delivery */}
          {groupedDrivers.on_delivery.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-blue-500" />
                On Delivery ({groupedDrivers.on_delivery.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {groupedDrivers.on_delivery.map(driver => (
                  <DriverCard
                    key={driver.id}
                    driver={driver}
                    onEdit={() => handleOpenDialog(driver)}
                    onStatusChange={updateDriverStatus}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Off Duty */}
          {groupedDrivers.off_duty.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-muted-foreground">
                <span className="w-3 h-3 rounded-full bg-gray-400" />
                Off Duty ({groupedDrivers.off_duty.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 opacity-60">
                {groupedDrivers.off_duty.map(driver => (
                  <DriverCard
                    key={driver.id}
                    driver={driver}
                    onEdit={() => handleOpenDialog(driver)}
                    onStatusChange={updateDriverStatus}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingDriver ? 'Edit Driver' : 'Add New Driver'}
            </DialogTitle>
            <DialogDescription>
              {editingDriver 
                ? 'Update driver information' 
                : 'Add a new driver to your delivery team'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name *</Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                placeholder="Driver name"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone *</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="carrier">Assigned Carrier</Label>
              <Select 
                value={formData.carrier_id} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, carrier_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select carrier (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No carrier</SelectItem>
                  {carriers.filter(c => c.is_active).map(carrier => (
                    <SelectItem key={carrier.id} value={carrier.id}>
                      {carrier.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="vehicle_type">Vehicle Type</Label>
                <Select 
                  value={formData.vehicle_type} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, vehicle_type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="motorcycle">Motorcycle</SelectItem>
                    <SelectItem value="car">Car</SelectItem>
                    <SelectItem value="van">Van</SelectItem>
                    <SelectItem value="truck">Truck</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="vehicle_plate">Vehicle Plate</Label>
                <Input
                  id="vehicle_plate"
                  value={formData.vehicle_plate}
                  onChange={(e) => setFormData(prev => ({ ...prev, vehicle_plate: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select 
                value={formData.status} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="on_delivery">On Delivery</SelectItem>
                  <SelectItem value="off_duty">Off Duty</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={!formData.full_name || !formData.phone}>
              {editingDriver ? 'Update Driver' : 'Add Driver'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface DriverCardProps {
  driver: DeliveryDriver;
  onEdit: () => void;
  onStatusChange: (driverId: string, status: DeliveryDriver['status']) => void;
}

function DriverCard({ driver, onEdit, onStatusChange }: DriverCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          <Avatar className="h-12 w-12">
            <AvatarImage src={driver.photo_url} />
            <AvatarFallback>
              {driver.full_name.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-semibold truncate">{driver.full_name}</h3>
              <Badge className={statusColors[driver.status]}>
                {driver.status.replace(/_/g, ' ')}
              </Badge>
            </div>
            
            {driver.carrier && (
              <p className="text-sm text-muted-foreground mb-2">
                {driver.carrier.name}
              </p>
            )}

            <div className="space-y-1 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Phone className="h-3 w-3" />
                <span>{driver.phone}</span>
              </div>
              {driver.vehicle_type && (
                <div className="flex items-center gap-2">
                  <Car className="h-3 w-3" />
                  <span>{driver.vehicle_type} {driver.vehicle_plate && `• ${driver.vehicle_plate}`}</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between mt-3 pt-3 border-t">
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                <span className="text-sm font-medium">{driver.average_rating}</span>
                <span className="text-xs text-muted-foreground">
                  ({driver.total_deliveries} deliveries)
                </span>
              </div>
              <Button variant="ghost" size="sm" onClick={onEdit}>
                <Edit className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

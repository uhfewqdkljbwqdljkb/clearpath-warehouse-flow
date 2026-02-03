import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
  Truck, 
  Plus, 
  Edit, 
  Eye,
  Phone,
  Mail,
  MapPin,
  Package,
  Settings
} from 'lucide-react';
import { useDeliveryCarriers } from '@/hooks/useDeliveryCarriers';
import { Skeleton } from '@/components/ui/skeleton';
import type { DeliveryCarrier } from '@/types/delivery';

export default function DeliveryCarriers() {
  const navigate = useNavigate();
  const { carriers, loading, createCarrier, updateCarrier, toggleCarrierStatus } = useDeliveryCarriers();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCarrier, setEditingCarrier] = useState<DeliveryCarrier | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    carrier_type: 'domestic',
    contact_name: '',
    contact_email: '',
    contact_phone: '',
    base_rate: 0,
    per_kg_rate: 0,
  });

  const handleOpenDialog = (carrier?: DeliveryCarrier) => {
    if (carrier) {
      setEditingCarrier(carrier);
      setFormData({
        name: carrier.name,
        code: carrier.code,
        carrier_type: carrier.carrier_type,
        contact_name: carrier.contact_name || '',
        contact_email: carrier.contact_email || '',
        contact_phone: carrier.contact_phone || '',
        base_rate: carrier.base_rate,
        per_kg_rate: carrier.per_kg_rate,
      });
    } else {
      setEditingCarrier(null);
      setFormData({
        name: '',
        code: '',
        carrier_type: 'domestic',
        contact_name: '',
        contact_email: '',
        contact_phone: '',
        base_rate: 0,
        per_kg_rate: 0,
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (editingCarrier) {
      await updateCarrier(editingCarrier.id, formData as any);
    } else {
      await createCarrier({
        ...formData,
        carrier_type: formData.carrier_type as 'international' | 'domestic' | 'local' | 'in_house'
      });
    }
    setIsDialogOpen(false);
  };

  const activeCarriers = carriers.filter(c => c.is_active);
  const inactiveCarriers = carriers.filter(c => !c.is_active);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Delivery Carriers</h1>
          <p className="text-muted-foreground">Manage your delivery carrier partners</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          Add Carrier
        </Button>
      </div>

      {/* Active Carriers */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Active Carriers ({activeCarriers.length})</h2>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-48 w-full" />
            ))}
          </div>
        ) : activeCarriers.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Truck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No active carriers</p>
              <Button className="mt-4" onClick={() => handleOpenDialog()}>
                Add Your First Carrier
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeCarriers.map(carrier => (
              <CarrierCard
                key={carrier.id}
                carrier={carrier}
                onEdit={() => handleOpenDialog(carrier)}
                onToggle={() => toggleCarrierStatus(carrier.id, !carrier.is_active)}
                onView={() => navigate(`/dashboard/delivery/carriers/${carrier.id}`)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Inactive Carriers */}
      {inactiveCarriers.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4 text-muted-foreground">
            Inactive Carriers ({inactiveCarriers.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 opacity-60">
            {inactiveCarriers.map(carrier => (
              <CarrierCard
                key={carrier.id}
                carrier={carrier}
                onEdit={() => handleOpenDialog(carrier)}
                onToggle={() => toggleCarrierStatus(carrier.id, !carrier.is_active)}
                onView={() => navigate(`/dashboard/delivery/carriers/${carrier.id}`)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingCarrier ? 'Edit Carrier' : 'Add New Carrier'}
            </DialogTitle>
            <DialogDescription>
              {editingCarrier 
                ? 'Update carrier information' 
                : 'Add a new delivery carrier to your network'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Carrier Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Aramex"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="code">Code</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toLowerCase() }))}
                  placeholder="e.g., aramex"
                  disabled={!!editingCarrier}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Carrier Type</Label>
              <Select 
                value={formData.carrier_type} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, carrier_type: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="international">International</SelectItem>
                  <SelectItem value="domestic">Domestic</SelectItem>
                  <SelectItem value="local">Local</SelectItem>
                  <SelectItem value="in_house">In-House</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact_name">Contact Name</Label>
              <Input
                id="contact_name"
                value={formData.contact_name}
                onChange={(e) => setFormData(prev => ({ ...prev, contact_name: e.target.value }))}
                placeholder="Account manager name"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contact_email">Email</Label>
                <Input
                  id="contact_email"
                  type="email"
                  value={formData.contact_email}
                  onChange={(e) => setFormData(prev => ({ ...prev, contact_email: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact_phone">Phone</Label>
                <Input
                  id="contact_phone"
                  value={formData.contact_phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, contact_phone: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="base_rate">Base Rate ($)</Label>
                <Input
                  id="base_rate"
                  type="number"
                  step="0.01"
                  value={formData.base_rate}
                  onChange={(e) => setFormData(prev => ({ ...prev, base_rate: parseFloat(e.target.value) || 0 }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="per_kg_rate">Per KG Rate ($)</Label>
                <Input
                  id="per_kg_rate"
                  type="number"
                  step="0.01"
                  value={formData.per_kg_rate}
                  onChange={(e) => setFormData(prev => ({ ...prev, per_kg_rate: parseFloat(e.target.value) || 0 }))}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              {editingCarrier ? 'Update Carrier' : 'Add Carrier'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface CarrierCardProps {
  carrier: DeliveryCarrier;
  onEdit: () => void;
  onToggle: () => void;
  onView: () => void;
}

function CarrierCard({ carrier, onEdit, onToggle, onView }: CarrierCardProps) {
  const typeColors: Record<string, string> = {
    international: 'bg-blue-100 text-blue-800',
    domestic: 'bg-green-100 text-green-800',
    local: 'bg-yellow-100 text-yellow-800',
    in_house: 'bg-purple-100 text-purple-800',
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-primary/10">
              <Truck className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">{carrier.name}</CardTitle>
              <Badge className={typeColors[carrier.carrier_type]}>
                {carrier.carrier_type}
              </Badge>
            </div>
          </div>
          <Switch
            checked={carrier.is_active}
            onCheckedChange={onToggle}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {carrier.contact_name && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Package className="h-4 w-4" />
            <span>{carrier.contact_name}</span>
          </div>
        )}
        {carrier.contact_email && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Mail className="h-4 w-4" />
            <span>{carrier.contact_email}</span>
          </div>
        )}
        {carrier.contact_phone && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Phone className="h-4 w-4" />
            <span>{carrier.contact_phone}</span>
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t">
          <div className="text-sm">
            <span className="text-muted-foreground">Base: </span>
            <span className="font-medium">${carrier.base_rate}</span>
            <span className="text-muted-foreground"> + </span>
            <span className="font-medium">${carrier.per_kg_rate}/kg</span>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button variant="outline" size="sm" className="flex-1" onClick={onEdit}>
            <Edit className="h-4 w-4 mr-1" />
            Edit
          </Button>
          <Button variant="outline" size="sm" className="flex-1" onClick={onView}>
            <Eye className="h-4 w-4 mr-1" />
            View
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

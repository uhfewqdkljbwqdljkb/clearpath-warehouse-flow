import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  RefreshCw, 
  Scan, 
  MapPin, 
  Package, 
  ArrowRight, 
  AlertCircle 
} from 'lucide-react';

interface Location {
  id: string;
  code: string;
  zone_id: string;
  zone_name: string;
  status: 'occupied' | 'available';
  client: string | null;
  items: number;
  capacity: number;
}

interface Zone {
  id: string;
  code: string;
  name: string;
}

interface MoveInventoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  locations: Location[];
  zones: Zone[];
}

export const MoveInventoryModal: React.FC<MoveInventoryModalProps> = ({
  open,
  onOpenChange,
  locations,
  zones
}) => {
  const [sourceLocation, setSourceLocation] = useState('');
  const [destinationLocation, setDestinationLocation] = useState('');
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [sourceBarcode, setSourceBarcode] = useState('');
  const [destBarcode, setDestBarcode] = useState('');

  const occupiedLocations = locations.filter(loc => loc.status === 'occupied' && loc.items > 0);
  const availableDestinations = locations.filter(loc => 
    loc.status === 'available' || 
    (loc.status === 'occupied' && loc.items < loc.capacity)
  );

  const sourceLocationData = locations.find(loc => loc.id === sourceLocation);
  const destLocationData = locations.find(loc => loc.id === destinationLocation);

  const maxQuantity = sourceLocationData?.items || 0;
  const availableSpace = destLocationData 
    ? destLocationData.capacity - destLocationData.items 
    : 0;

  const moveReasons = [
    'Rebalancing inventory',
    'Client reallocation', 
    'Zone optimization',
    'Maintenance requirement',
    'Product consolidation',
    'Quality control',
    'Other'
  ];

  const isValidMove = () => {
    if (!sourceLocation || !destinationLocation || !quantity || !reason) return false;
    if (sourceLocation === destinationLocation) return false;
    
    const qty = parseInt(quantity);
    if (qty <= 0 || qty > maxQuantity) return false;
    if (destLocationData && qty > availableSpace) return false;
    
    return true;
  };

  const handleSubmit = () => {
    if (!isValidMove()) return;
    
    console.log({
      sourceLocation,
      destinationLocation,
      quantity: parseInt(quantity),
      reason,
      notes,
      sourceBarcode,
      destBarcode
    });
    
    // Reset form
    setSourceLocation('');
    setDestinationLocation('');
    setQuantity('');
    setReason('');
    setNotes('');
    setSourceBarcode('');
    setDestBarcode('');
    
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <RefreshCw className="h-5 w-5 text-orange-600" />
            <span>Move Inventory</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Movement Overview */}
          {sourceLocationData && destLocationData && (
            <Card className="bg-orange-50 border-orange-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-orange-600" />
                    <div>
                      <p className="font-medium text-orange-800">{sourceLocationData.code}</p>
                      <p className="text-xs text-orange-600">{sourceLocationData.zone_name}</p>
                    </div>
                  </div>
                  
                  <ArrowRight className="h-5 w-5 text-orange-600" />
                  
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-orange-600" />
                    <div>
                      <p className="font-medium text-orange-800">{destLocationData.code}</p>
                      <p className="text-xs text-orange-600">{destLocationData.zone_name}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Source and Destination Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Source Location */}
            <div className="space-y-3">
              <Label className="text-base font-medium">From (Source Location)</Label>
              
              <Select value={sourceLocation} onValueChange={setSourceLocation}>
                <SelectTrigger>
                  <SelectValue placeholder="Select source location" />
                </SelectTrigger>
                <SelectContent>
                  {occupiedLocations.map(location => (
                    <SelectItem key={location.id} value={location.id}>
                      <div className="flex items-center justify-between w-full">
                        <span className="font-mono">{location.code}</span>
                        <div className="flex items-center space-x-2 ml-3">
                          <Badge variant="outline" className="text-xs">
                            {location.zone_name}
                          </Badge>
                          <span className="text-xs text-gray-500">
                            {location.items} items
                          </span>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="space-y-2">
                <Label htmlFor="sourceBarcode" className="text-sm">Source Barcode</Label>
                <div className="flex space-x-2">
                  <Input
                    id="sourceBarcode"
                    placeholder="Scan source location"
                    value={sourceBarcode}
                    onChange={(e) => setSourceBarcode(e.target.value)}
                  />
                  <Button variant="outline" size="icon">
                    <Scan className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {sourceLocationData && (
                <div className="p-3 bg-gray-50 rounded-lg space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span>Client:</span>
                    <span className="font-medium">{sourceLocationData.client || 'Unallocated'}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Current Items:</span>
                    <span className="font-medium">{sourceLocationData.items}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Destination Location */}
            <div className="space-y-3">
              <Label className="text-base font-medium">To (Destination Location)</Label>
              
              <Select value={destinationLocation} onValueChange={setDestinationLocation}>
                <SelectTrigger>
                  <SelectValue placeholder="Select destination location" />
                </SelectTrigger>
                <SelectContent>
                  {availableDestinations
                    .filter(loc => loc.id !== sourceLocation)
                    .map(location => (
                      <SelectItem key={location.id} value={location.id}>
                        <div className="flex items-center justify-between w-full">
                          <span className="font-mono">{location.code}</span>
                          <div className="flex items-center space-x-2 ml-3">
                            <Badge variant="outline" className="text-xs">
                              {location.zone_name}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {location.capacity - location.items} available
                            </span>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>

              <div className="space-y-2">
                <Label htmlFor="destBarcode" className="text-sm">Destination Barcode</Label>
                <div className="flex space-x-2">
                  <Input
                    id="destBarcode"
                    placeholder="Scan destination location"
                    value={destBarcode}
                    onChange={(e) => setDestBarcode(e.target.value)}
                  />
                  <Button variant="outline" size="icon">
                    <Scan className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {destLocationData && (
                <div className="p-3 bg-gray-50 rounded-lg space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span>Client:</span>
                    <span className="font-medium">{destLocationData.client || 'Unallocated'}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Available Space:</span>
                    <span className="font-medium">{availableSpace} items</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quantity and Reason */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity to Move</Label>
              <Input
                id="quantity"
                type="number"
                placeholder="Enter quantity"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                min="1"
                max={maxQuantity}
              />
              {sourceLocationData && (
                <p className="text-xs text-gray-500">
                  Maximum: {maxQuantity} items available
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Reason for Move</Label>
              <Select value={reason} onValueChange={setReason}>
                <SelectTrigger>
                  <SelectValue placeholder="Select reason" />
                </SelectTrigger>
                <SelectContent>
                  {moveReasons.map(reasonOption => (
                    <SelectItem key={reasonOption} value={reasonOption}>
                      {reasonOption}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Validation Warnings */}
          {quantity && destLocationData && parseInt(quantity) > availableSpace && (
            <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <span className="text-sm text-red-800">
                Quantity exceeds available space at destination ({availableSpace} items available)
              </span>
            </div>
          )}

          {sourceLocation === destinationLocation && sourceLocation && (
            <div className="flex items-center space-x-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <span className="text-sm text-yellow-800">
                Source and destination cannot be the same location
              </span>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any special instructions or notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit}
              className="bg-orange-600 hover:bg-orange-700"
              disabled={!isValidMove()}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Move Inventory
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
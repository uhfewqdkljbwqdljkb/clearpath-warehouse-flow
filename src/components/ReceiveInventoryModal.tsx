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
import { Package, Scan, MapPin } from 'lucide-react';
import { availableProducts } from '@/data/warehouseData';

interface Location {
  id: string;
  code: string;
  zone_name: string;
  status: 'occupied' | 'available';
  capacity: number;
  items: number;
}

interface Zone {
  id: string;
  code: string;
  name: string;
}

interface ReceiveInventoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  locations: Location[];
  zones: Zone[];
}

export const ReceiveInventoryModal: React.FC<ReceiveInventoryModalProps> = ({
  open,
  onOpenChange,
  locations,
  zones
}) => {
  const [selectedProduct, setSelectedProduct] = useState('');
  const [quantity, setQuantity] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [productBarcode, setProductBarcode] = useState('');
  const [locationBarcode, setLocationBarcode] = useState('');

  const selectedProductData = availableProducts.find(p => p.id === selectedProduct);
  
  const suggestedLocations = selectedProductData 
    ? locations.filter(loc => 
        loc.zone_name.toLowerCase().includes(selectedProductData.category.toLowerCase()) &&
        loc.status === 'available'
      )
    : locations.filter(loc => loc.status === 'available');

  const handleSubmit = () => {
    // Handle form submission
    console.log({
      product: selectedProduct,
      quantity,
      location: selectedLocation,
      notes,
      productBarcode,
      locationBarcode
    });
    
    // Reset form
    setSelectedProduct('');
    setQuantity('');
    setSelectedLocation('');
    setNotes('');
    setProductBarcode('');
    setLocationBarcode('');
    
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Package className="h-5 w-5 text-green-600" />
            <span>Receive Inventory</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Product Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="product">Product</Label>
              <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                <SelectTrigger>
                  <SelectValue placeholder="Select product" />
                </SelectTrigger>
                <SelectContent>
                  {availableProducts.map(product => (
                    <SelectItem key={product.id} value={product.id}>
                      <div className="flex items-center space-x-2">
                        <span>{product.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {product.sku}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                placeholder="Enter quantity"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                min="1"
              />
            </div>
          </div>

          {/* Barcode Scanning */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="productBarcode">Product Barcode</Label>
              <div className="flex space-x-2">
                <Input
                  id="productBarcode"
                  placeholder="Scan or enter barcode"
                  value={productBarcode}
                  onChange={(e) => setProductBarcode(e.target.value)}
                />
                <Button variant="outline" size="icon">
                  <Scan className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="locationBarcode">Location Barcode</Label>
              <div className="flex space-x-2">
                <Input
                  id="locationBarcode"
                  placeholder="Scan location barcode"
                  value={locationBarcode}
                  onChange={(e) => setLocationBarcode(e.target.value)}
                />
                <Button variant="outline" size="icon">
                  <Scan className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Location Assignment */}
          <div className="space-y-3">
            <Label>Storage Location</Label>
            
            {selectedProductData && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <MapPin className="inline h-4 w-4 mr-1" />
                  Suggested zone: <strong>{selectedProductData.suggestedZone}</strong> ({selectedProductData.category})
                </p>
              </div>
            )}

            <Select value={selectedLocation} onValueChange={setSelectedLocation}>
              <SelectTrigger>
                <SelectValue placeholder="Select storage location" />
              </SelectTrigger>
              <SelectContent>
                <div className="space-y-1">
                  {selectedProductData && suggestedLocations.length > 0 && (
                    <>
                      <div className="px-2 py-1 text-xs font-medium text-gray-500 bg-gray-50">
                        Suggested Locations
                      </div>
                      {suggestedLocations.map(location => (
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
                      <div className="px-2 py-1 text-xs font-medium text-gray-500 bg-gray-50">
                        Other Locations
                      </div>
                    </>
                  )}
                  
                  {locations
                    .filter(loc => loc.status === 'available' && !suggestedLocations.includes(loc))
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
                </div>
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any special notes or instructions..."
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
              className="bg-green-600 hover:bg-green-700"
              disabled={!selectedProduct || !quantity || !selectedLocation}
            >
              Receive Inventory
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
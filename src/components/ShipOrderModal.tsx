import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Truck, Package, MapPin, Clock, AlertCircle } from 'lucide-react';
import { pendingOrders } from '@/data/warehouseData';

interface Location {
  id: string;
  code: string;
  zone_name: string;
}

interface ShipOrderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  locations: Location[];
}

export const ShipOrderModal: React.FC<ShipOrderModalProps> = ({
  open,
  onOpenChange,
  locations
}) => {
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [pickingMode, setPickingMode] = useState<'zone' | 'order'>('zone');

  const handleOrderSelect = (orderId: string) => {
    setSelectedOrders(prev => 
      prev.includes(orderId) 
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'border-red-200 text-red-700 bg-red-50';
      case 'normal':
        return 'border-blue-200 text-blue-700 bg-blue-50';
      default:
        return 'border-gray-200 text-gray-700 bg-gray-50';
    }
  };

  const getOptimizedPickPath = () => {
    if (selectedOrders.length === 0) return [];
    
    const allItems = selectedOrders.flatMap(orderId => {
      const order = pendingOrders.find(o => o.id === orderId);
      return order?.items.map(item => ({
        ...item,
        orderId,
        locationData: locations.find(loc => loc.code === item.location)
      })) || [];
    });

    // Group by zone for optimized picking
    const groupedByZone = allItems.reduce((acc, item) => {
      const zone = item.locationData?.zone_name || 'Unknown';
      if (!acc[zone]) acc[zone] = [];
      acc[zone].push(item);
      return acc;
    }, {} as Record<string, typeof allItems>);

    return Object.entries(groupedByZone);
  };

  const handleStartPicking = () => {
    if (selectedOrders.length === 0) return;
    
    console.log('Starting pick process for orders:', selectedOrders);
    console.log('Pick path:', getOptimizedPickPath());
    
    // Reset and close
    setSelectedOrders([]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Truck className="h-5 w-5 text-blue-600" />
            <span>Ship Orders</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Mode Selection */}
          <div className="flex space-x-2">
            <Button
              variant={pickingMode === 'zone' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPickingMode('zone')}
            >
              Zone-Based Picking
            </Button>
            <Button
              variant={pickingMode === 'order' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPickingMode('order')}
            >
              Order-Based Picking
            </Button>
          </div>

          {/* Pending Orders */}
          <div className="space-y-3">
            <h3 className="text-lg font-medium">Pending Orders</h3>
            
            {pendingOrders.map((order) => (
              <Card key={order.id} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <Checkbox
                      checked={selectedOrders.includes(order.id)}
                      onCheckedChange={() => handleOrderSelect(order.id)}
                    />
                    
                    <div className="flex-1 space-y-3">
                      {/* Order Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <h4 className="font-medium">{order.id}</h4>
                          <Badge variant="outline">{order.client}</Badge>
                          <Badge 
                            variant="outline" 
                            className={getPriorityColor(order.priority)}
                          >
                            {order.priority} priority
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                          <Clock className="h-4 w-4" />
                          <span>{new Date(order.created).toLocaleDateString()}</span>
                        </div>
                      </div>

                      {/* Order Items */}
                      <div className="space-y-2">
                        {order.items.map((item, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <div className="flex items-center space-x-2">
                              <Package className="h-4 w-4 text-gray-400" />
                              <span className="text-sm">{item.product}</span>
                              <Badge variant="outline" className="text-xs">
                                Qty: {item.quantity}
                              </Badge>
                            </div>
                            <div className="flex items-center space-x-2 text-sm text-gray-600">
                              <MapPin className="h-4 w-4" />
                              <span className="font-mono">{item.location}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Optimized Pick Path */}
          {selectedOrders.length > 0 && (
            <div className="space-y-3">
              <Separator />
              
              <h3 className="text-lg font-medium flex items-center space-x-2">
                <MapPin className="h-5 w-5" />
                <span>Optimized Pick Path</span>
              </h3>

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center space-x-2 mb-3">
                  <AlertCircle className="h-4 w-4 text-blue-600" />
                  <span className="text-sm text-blue-800 font-medium">
                    Pick {selectedOrders.length} order(s) by visiting zones in this order:
                  </span>
                </div>

                <div className="space-y-3">
                  {getOptimizedPickPath().map(([zone, items], zoneIndex) => (
                    <div key={zone} className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Badge className="bg-blue-600 text-white">
                          {zoneIndex + 1}
                        </Badge>
                        <span className="font-medium">{zone}</span>
                        <span className="text-sm text-gray-600">
                          ({items.length} item{items.length > 1 ? 's' : ''})
                        </span>
                      </div>
                      
                      <div className="ml-8 space-y-1">
                        {items.map((item, itemIndex) => (
                          <div key={itemIndex} className="flex items-center justify-between text-sm">
                            <span>{item.product} (x{item.quantity})</span>
                            <div className="flex items-center space-x-2">
                              <span className="font-mono text-xs">{item.location}</span>
                              <Badge variant="outline" className="text-xs">
                                {item.orderId}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleStartPicking}
              className="bg-blue-600 hover:bg-blue-700"
              disabled={selectedOrders.length === 0}
            >
              <Truck className="h-4 w-4 mr-2" />
              Start Picking ({selectedOrders.length} order{selectedOrders.length > 1 ? 's' : ''})
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
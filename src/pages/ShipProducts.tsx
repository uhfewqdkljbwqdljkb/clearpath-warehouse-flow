import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Package, TruckIcon, Search } from 'lucide-react';

interface Company {
  id: string;
  name: string;
  address: string;
  client_code: string;
}

interface Product {
  id: string;
  name: string;
  sku: string;
  variants: any;
  available_quantity: number;
}

interface ShipmentItem {
  product_id: string;
  product_name: string;
  variant_attribute?: string;
  variant_value?: string;
  quantity: number;
  available: number;
}

interface Shipment {
  id: string;
  shipment_number: string;
  company_id: string;
  company_name: string;
  shipment_date: string;
  tracking_number: string;
  carrier: string;
  status: string;
  destination_address: string;
  items_count: number;
}

export const ShipProducts: React.FC = () => {
  const { profile } = useAuth();
  const { toast } = useToast();

  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
  const [products, setProducts] = useState<Product[]>([]);
  const [shipmentItems, setShipmentItems] = useState<ShipmentItem[]>([]);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Form fields
  const [destinationAddress, setDestinationAddress] = useState('');
  const [destinationContact, setDestinationContact] = useState('');
  const [destinationPhone, setDestinationPhone] = useState('');
  const [carrier, setCarrier] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    fetchCompanies();
    fetchShipments();
  }, []);

  useEffect(() => {
    if (selectedCompanyId) {
      fetchProducts();
      const selectedCompany = companies.find(c => c.id === selectedCompanyId);
      if (selectedCompany?.address) {
        setDestinationAddress(selectedCompany.address);
      }
    }
  }, [selectedCompanyId]);

  const fetchCompanies = async () => {
    const { data, error } = await supabase
      .from('companies')
      .select('id, name, address, client_code')
      .eq('is_active', true)
      .order('name');

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to load companies',
        variant: 'destructive',
      });
      return;
    }

    setCompanies(data || []);
  };

  const fetchProducts = async () => {
    if (!selectedCompanyId) return;

    const { data: productsData, error: productsError } = await supabase
      .from('client_products')
      .select('id, name, sku, variants')
      .eq('company_id', selectedCompanyId)
      .eq('is_active', true);

    if (productsError) {
      toast({
        title: 'Error',
        description: 'Failed to load products',
        variant: 'destructive',
      });
      return;
    }

    // Fetch inventory quantities for each product
    const productsWithInventory = await Promise.all(
      (productsData || []).map(async (product) => {
        const { data: inventoryData } = await supabase
          .from('inventory_items')
          .select('quantity')
          .eq('product_id', product.id)
          .eq('company_id', selectedCompanyId);

        const totalQuantity = inventoryData?.reduce((sum, item) => sum + item.quantity, 0) || 0;

        return {
          ...product,
          available_quantity: totalQuantity,
        };
      })
    );

    setProducts(productsWithInventory);
  };

  const fetchShipments = async () => {
    const { data, error } = await supabase
      .from('shipments')
      .select(`
        id,
        shipment_number,
        company_id,
        shipment_date,
        tracking_number,
        carrier,
        status,
        destination_address,
        companies!inner(name),
        shipment_items(id)
      `)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Error fetching shipments:', error);
      return;
    }

    const formattedShipments = data?.map((shipment: any) => ({
      id: shipment.id,
      shipment_number: shipment.shipment_number,
      company_id: shipment.company_id,
      company_name: shipment.companies?.name || 'Unknown',
      shipment_date: shipment.shipment_date,
      tracking_number: shipment.tracking_number,
      carrier: shipment.carrier,
      status: shipment.status,
      destination_address: shipment.destination_address,
      items_count: shipment.shipment_items?.length || 0,
    })) || [];

    setShipments(formattedShipments);
  };

  const addShipmentItem = (productId: string, variantAttribute?: string, variantValue?: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const existingItem = shipmentItems.find(
      item => item.product_id === productId &&
        item.variant_attribute === variantAttribute &&
        item.variant_value === variantValue
    );

    if (existingItem) {
      toast({
        title: 'Item Already Added',
        description: 'This product is already in the shipment list',
        variant: 'destructive',
      });
      return;
    }

    setShipmentItems([...shipmentItems, {
      product_id: productId,
      product_name: product.name,
      variant_attribute: variantAttribute,
      variant_value: variantValue,
      quantity: 1,
      available: product.available_quantity,
    }]);
  };

  const updateItemQuantity = (index: number, quantity: number) => {
    const updatedItems = [...shipmentItems];
    updatedItems[index].quantity = Math.max(1, Math.min(quantity, updatedItems[index].available));
    setShipmentItems(updatedItems);
  };

  const removeItem = (index: number) => {
    setShipmentItems(shipmentItems.filter((_, i) => i !== index));
  };

  const createShipment = async () => {
    if (!selectedCompanyId || shipmentItems.length === 0 || !destinationAddress) {
      toast({
        title: 'Validation Error',
        description: 'Please select a client, add products, and provide a destination address',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      // Generate shipment number
      const { data: shipmentNumberData, error: shipmentNumberError } = await supabase
        .rpc('generate_shipment_number');

      if (shipmentNumberError) throw shipmentNumberError;

      // Create shipment
      const { data: shipmentData, error: shipmentError } = await supabase
        .from('shipments')
        .insert({
          shipment_number: shipmentNumberData,
          company_id: selectedCompanyId,
          shipment_date: new Date().toISOString(),
          tracking_number: trackingNumber || null,
          carrier: carrier || null,
          destination_address: destinationAddress,
          destination_contact: destinationContact || null,
          destination_phone: destinationPhone || null,
          notes: notes || null,
          shipped_by: profile?.id,
          status: 'pending',
        })
        .select()
        .single();

      if (shipmentError) throw shipmentError;

      // Create shipment items and update inventory
      for (const item of shipmentItems) {
        // Insert shipment item
        const { error: itemError } = await supabase
          .from('shipment_items')
          .insert({
            shipment_id: shipmentData.id,
            product_id: item.product_id,
            variant_attribute: item.variant_attribute || null,
            variant_value: item.variant_value || null,
            quantity: item.quantity,
          });

        if (itemError) throw itemError;

        // Reduce inventory quantity
        const { data: inventoryItems, error: fetchError } = await supabase
          .from('inventory_items')
          .select('id, quantity')
          .eq('product_id', item.product_id)
          .eq('company_id', selectedCompanyId)
          .gt('quantity', 0)
          .order('received_date', { ascending: true });

        if (fetchError) throw fetchError;

        let remainingToShip = item.quantity;
        for (const invItem of inventoryItems || []) {
          if (remainingToShip <= 0) break;

          const deductAmount = Math.min(invItem.quantity, remainingToShip);
          const newQuantity = invItem.quantity - deductAmount;

          if (newQuantity > 0) {
            await supabase
              .from('inventory_items')
              .update({ quantity: newQuantity })
              .eq('id', invItem.id);
          } else {
            await supabase
              .from('inventory_items')
              .delete()
              .eq('id', invItem.id);
          }

          remainingToShip -= deductAmount;
        }
      }

      toast({
        title: 'Shipment Created',
        description: `Shipment ${shipmentNumberData} created successfully`,
      });

      // Reset form
      resetForm();
      fetchShipments();
      fetchProducts();

    } catch (error: any) {
      console.error('Error creating shipment:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create shipment',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setShipmentItems([]);
    setDestinationAddress('');
    setDestinationContact('');
    setDestinationPhone('');
    setCarrier('');
    setTrackingNumber('');
    setNotes('');
  };

  const filteredShipments = shipments.filter(s =>
    s.shipment_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.tracking_number?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Ship Products</h1>
          <p className="text-muted-foreground mt-1">Create outbound shipments for clients</p>
        </div>
        <TruckIcon className="h-8 w-8 text-primary" />
      </div>

      {/* Create Shipment Form */}
      <Card>
        <CardHeader>
          <CardTitle>Create New Shipment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Client Selection */}
          <div className="space-y-2">
            <Label htmlFor="client">Select Client *</Label>
            <Select value={selectedCompanyId} onValueChange={setSelectedCompanyId}>
              <SelectTrigger id="client">
                <SelectValue placeholder="Choose a client" />
              </SelectTrigger>
              <SelectContent>
                {companies.map(company => (
                  <SelectItem key={company.id} value={company.id}>
                    {company.name} ({company.client_code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedCompanyId && (
            <>
              {/* Product Selection */}
              <div className="space-y-2">
                <Label>Add Products to Shipment</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {products.map(product => (
                    <Card key={product.id} className="p-3">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{product.name}</p>
                          <p className="text-xs text-muted-foreground">{product.sku}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Available: <span className="font-semibold">{product.available_quantity}</span>
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => addShipmentItem(product.id)}
                          disabled={product.available_quantity === 0}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Shipment Items List */}
              {shipmentItems.length > 0 && (
                <div className="space-y-2">
                  <Label>Items to Ship</Label>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>Available</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead className="w-[100px]">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {shipmentItems.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <div>
                              <p className="font-medium text-sm">{item.product_name}</p>
                              {item.variant_value && (
                                <p className="text-xs text-muted-foreground">
                                  {item.variant_attribute}: {item.variant_value}
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{item.available}</TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="1"
                              max={item.available}
                              value={item.quantity}
                              onChange={(e) => updateItemQuantity(index, parseInt(e.target.value) || 1)}
                              className="w-20"
                            />
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => removeItem(index)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* Shipping Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="carrier">Carrier</Label>
                  <Select value={carrier} onValueChange={setCarrier}>
                    <SelectTrigger id="carrier">
                      <SelectValue placeholder="Select carrier" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FedEx">FedEx</SelectItem>
                      <SelectItem value="UPS">UPS</SelectItem>
                      <SelectItem value="DHL">DHL</SelectItem>
                      <SelectItem value="USPS">USPS</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tracking">Tracking Number</Label>
                  <Input
                    id="tracking"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    placeholder="Optional"
                  />
                </div>
              </div>

              {/* Destination Details */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="address">Destination Address *</Label>
                  <Textarea
                    id="address"
                    value={destinationAddress}
                    onChange={(e) => setDestinationAddress(e.target.value)}
                    rows={3}
                    placeholder="Enter shipping address"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="contact">Contact Name</Label>
                    <Input
                      id="contact"
                      value={destinationContact}
                      onChange={(e) => setDestinationContact(e.target.value)}
                      placeholder="Optional"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Contact Phone</Label>
                    <Input
                      id="phone"
                      value={destinationPhone}
                      onChange={(e) => setDestinationPhone(e.target.value)}
                      placeholder="Optional"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Additional notes or special instructions"
                />
              </div>

              <Button
                onClick={createShipment}
                disabled={isLoading || shipmentItems.length === 0}
                className="w-full"
                size="lg"
              >
                <Package className="mr-2 h-4 w-4" />
                {isLoading ? 'Creating Shipment...' : 'Create Shipment'}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Shipment History */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Recent Shipments</CardTitle>
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search shipments..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Shipment #</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Carrier</TableHead>
                <TableHead>Tracking</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredShipments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    No shipments found
                  </TableCell>
                </TableRow>
              ) : (
                filteredShipments.map(shipment => (
                  <TableRow key={shipment.id}>
                    <TableCell className="font-medium">{shipment.shipment_number}</TableCell>
                    <TableCell>{shipment.company_name}</TableCell>
                    <TableCell>{shipment.items_count}</TableCell>
                    <TableCell>{new Date(shipment.shipment_date).toLocaleDateString()}</TableCell>
                    <TableCell>{shipment.carrier || '-'}</TableCell>
                    <TableCell className="font-mono text-xs">{shipment.tracking_number || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={shipment.status === 'delivered' ? 'default' : 'secondary'}>
                        {shipment.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

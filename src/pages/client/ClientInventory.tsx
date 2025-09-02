import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search, Package, MapPin } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface InventoryItem {
  id: string;
  quantity: number;
  location_zone?: string;
  location_row?: string;
  location_bin?: string;
  location_code?: string;
  last_movement_date?: string;
  movement_type?: string;
  notes?: string;
  client_products: {
    id: string;
    sku: string;
    name: string;
    category?: string;
    unit_value?: number;
  };
}

export const ClientInventory: React.FC = () => {
  const { profile } = useAuth();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchInventory = async () => {
      if (!profile?.company_id) return;

      try {
        const { data, error } = await supabase
          .from('inventory_items')
          .select(`
            *,
            client_products!inner (
              id,
              sku,
              name,
              category,
              unit_value
            )
          `)
          .eq('company_id', profile.company_id)
          .gt('quantity', 0)
          .order('last_movement_date', { ascending: false, nullsFirst: false });

        if (error) throw error;
        setInventory(data || []);
      } catch (error) {
        console.error('Error fetching inventory:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInventory();
  }, [profile?.company_id]);

  const filteredInventory = inventory.filter(item =>
    item.client_products.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.client_products.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.location_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.client_products.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalItems = inventory.reduce((sum, item) => sum + item.quantity, 0);
  const totalValue = inventory.reduce((sum, item) => {
    return sum + (item.quantity * (item.client_products.unit_value || 0));
  }, 0);
  const uniqueProducts = new Set(inventory.map(item => item.client_products.id)).size;

  if (isLoading) {
    return <div>Loading inventory...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Inventory</h1>
        <p className="text-muted-foreground">
          View your products currently stored in the warehouse
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalItems}</div>
            <p className="text-xs text-muted-foreground">
              Units in warehouse
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{uniqueProducts}</div>
            <p className="text-xs text-muted-foreground">
              Different product types
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalValue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Estimated inventory value
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search inventory..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Current Inventory</CardTitle>
          <CardDescription>
            Products currently stored in the warehouse
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredInventory.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Unit Value</TableHead>
                  <TableHead>Total Value</TableHead>
                  <TableHead>Last Movement</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInventory.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">
                      {item.client_products.name}
                    </TableCell>
                    <TableCell>{item.client_products.sku}</TableCell>
                    <TableCell>
                      {item.client_products.category && (
                        <Badge variant="secondary">
                          {item.client_products.category}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{item.quantity}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm">
                          {item.location_code || 'Unassigned'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      ${(item.client_products.unit_value || 0).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      ${((item.client_products.unit_value || 0) * item.quantity).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {item.last_movement_date ? (
                          <>
                            <div>{new Date(item.last_movement_date).toLocaleDateString()}</div>
                            {item.movement_type && (
                              <Badge variant="outline" className="text-xs">
                                {item.movement_type}
                              </Badge>
                            )}
                          </>
                        ) : (
                          <span className="text-muted-foreground">No movement</span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <Package className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {searchTerm ? 'No Items Found' : 'No Inventory Items'}
              </h3>
              <p className="text-muted-foreground text-center">
                {searchTerm 
                  ? "No inventory items match your search criteria."
                  : "You don't have any items stored in the warehouse yet."
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
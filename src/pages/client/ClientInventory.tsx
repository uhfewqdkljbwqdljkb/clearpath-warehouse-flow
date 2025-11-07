import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useIntegration } from '@/contexts/IntegrationContext';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Package, Warehouse } from 'lucide-react';
import { useInventorySync } from '@/hooks/useRealTimeSync';

interface InventoryItem {
  id: string;
  quantity: number;
  location_id?: string;
  batch_number?: string;
  received_date?: string;
  last_updated?: string;
  expiry_date?: string;
  client_products: {
    name: string;
  };
}

export const ClientInventory: React.FC = () => {
  const { profile } = useAuth();
  const { logActivity } = useIntegration();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Real-time inventory sync
  useInventorySync(() => {
    fetchInventory();
  });

  useEffect(() => {
    if (profile?.company_id) {
      fetchInventory();
      // Log inventory access
      logActivity('inventory_access', 'User accessed inventory page', {
        timestamp: new Date().toISOString()
      });
    }
  }, [profile?.company_id]);

  const fetchInventory = async () => {
    if (!profile?.company_id) return;

    try {
      const { data, error } = await supabase
        .from('inventory_items')
        .select(`
          *,
          client_products!inner (
            name
          )
        `)
        .eq('company_id', profile.company_id)
        .gt('quantity', 0)
        .order('last_updated', { ascending: false });

      if (error) throw error;
      setInventory(data || []);
    } catch (error) {
      console.error('Error fetching inventory:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredInventory = inventory.filter(item =>
    item.client_products.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.batch_number && item.batch_number.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Calculate summary stats
  const totalItems = filteredInventory.reduce((sum, item) => sum + item.quantity, 0);
  const uniqueProducts = filteredInventory.length;

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Inventory</h1>
        <p className="text-muted-foreground">View your warehouse inventory items</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalItems}</div>
            <p className="text-xs text-muted-foreground">
              Items in stock
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique Products</CardTitle>
            <Warehouse className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{uniqueProducts}</div>
            <p className="text-xs text-muted-foreground">
              Different product types
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search inventory..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Inventory Table */}
      <Card>
        <CardHeader>
          <CardTitle>Inventory Items</CardTitle>
          <CardDescription>Current stock levels and locations</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredInventory.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Last Movement</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInventory.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">
                      {item.client_products.name}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{item.quantity}</Badge>
                    </TableCell>
                    <TableCell>
                      {item.location_id ? (
                        <span className="text-sm">{item.location_id}</span>
                      ) : (
                        <span className="text-muted-foreground">Not assigned</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {item.last_updated 
                        ? new Date(item.last_updated).toLocaleDateString()
                        : item.received_date
                        ? new Date(item.received_date).toLocaleDateString()
                        : 'N/A'
                      }
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <Warehouse className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No Inventory Found</h3>
              <p className="text-muted-foreground">
                {searchTerm ? 'No items match your search criteria.' : 'No inventory items available.'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
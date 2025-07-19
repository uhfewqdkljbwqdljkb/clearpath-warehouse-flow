import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Plus, Package, AlertTriangle, MapPin } from 'lucide-react';
import { getInventoryWithProducts, getLowStockItems } from '@/data/mockData';
import { BarcodeInput } from '@/components/BarcodeInput';

export const Inventory: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [barcodeSearch, setBarcodeSearch] = useState('');
  
  const inventoryItems = getInventoryWithProducts();
  const lowStockItems = getLowStockItems();
  
  const filteredItems = inventoryItems.filter(item => {
    const searchValue = searchTerm.toLowerCase();
    const barcodeValue = barcodeSearch.toLowerCase();
    
    return (
      (!searchValue || 
       item.product?.name.toLowerCase().includes(searchValue) ||
       item.product?.sku.toLowerCase().includes(searchValue) ||
       item.product?.category.toLowerCase().includes(searchValue)) &&
      (!barcodeValue || 
       item.product?.sku.toLowerCase().includes(barcodeValue))
    );
  });

  const getStockStatus = (item: any) => {
    if (!item.product) return 'unknown';
    if (item.quantity <= item.product.reorderLevel) return 'low';
    if (item.quantity <= item.product.reorderLevel * 2) return 'medium';
    return 'good';
  };

  const getStockBadge = (status: string, quantity: number) => {
    switch (status) {
      case 'low':
        return <Badge variant="destructive">{quantity} - Low Stock</Badge>;
      case 'medium':
        return <Badge variant="secondary">{quantity} - Medium Stock</Badge>;
      case 'good':
        return <Badge variant="default">{quantity} - In Stock</Badge>;
      default:
        return <Badge variant="outline">{quantity}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Inventory Management</h1>
          <p className="text-muted-foreground">Track and manage warehouse inventory</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Product
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inventoryItems.length}</div>
            <p className="text-xs text-muted-foreground">
              Active inventory items
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{lowStockItems.length}</div>
            <p className="text-xs text-muted-foreground">
              Items need reordering
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inventoryItems.reduce((sum, item) => sum + item.quantity, 0)}</div>
            <p className="text-xs text-muted-foreground">
              Total units in stock
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Search Inventory</CardTitle>
          <CardDescription>Find products by name, SKU, category, or barcode</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search by Name/SKU/Category</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <BarcodeInput
              value={barcodeSearch}
              onChange={setBarcodeSearch}
              label="Search by Barcode"
              placeholder="Scan or enter barcode"
            />
          </div>
        </CardContent>
      </Card>

      {/* Inventory Table */}
      <Card>
        <CardHeader>
          <CardTitle>Inventory Items</CardTitle>
          <CardDescription>
            Showing {filteredItems.length} of {inventoryItems.length} items
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Stock Level</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.map((item) => {
                const stockStatus = getStockStatus(item);
                return (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{item.product?.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {item.product?.description}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono">{item.product?.sku}</TableCell>
                    <TableCell>{item.product?.category}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-1 text-muted-foreground" />
                        Row {item.locationRow}, Bin {item.locationBin}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStockBadge(stockStatus, item.quantity)}
                      {stockStatus === 'low' && (
                        <div className="text-xs text-muted-foreground mt-1">
                          Reorder at: {item.product?.reorderLevel}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(item.lastUpdated).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm">
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          
          {filteredItems.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No items found matching your search criteria.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
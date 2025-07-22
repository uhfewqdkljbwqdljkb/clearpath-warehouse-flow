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
import { Search, Plus, MoreHorizontal, Package, Barcode, AlertTriangle, ArrowLeft, Building2, Users } from 'lucide-react';
import { mockClientProducts, mockClients, getProductsByClient } from '@/data/mockData';
import { ClientProduct, Client } from '@/types';
import { ProductForm } from '@/components/ProductForm';

export const Products: React.FC = () => {
  const [products, setProducts] = useState<ClientProduct[]>(mockClientProducts);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ClientProduct | null>(null);
  const [clientSearchTerm, setClientSearchTerm] = useState('');

  const filteredClients = mockClients.filter(client =>
    client.is_active && 
    client.company_name.toLowerCase().includes(clientSearchTerm.toLowerCase())
  );

  const filteredProducts = selectedClient 
    ? products.filter(product => {
        const matchesSearch = 
          product.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.internal_barcode.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.category.toLowerCase().includes(searchTerm.toLowerCase());
        
        return matchesSearch && product.client_id === selectedClient.id;
      })
    : [];

  const handleAddProduct = (productData: Omit<ClientProduct, 'id' | 'created_at' | 'updated_at'>) => {
    const newProduct: ClientProduct = {
      ...productData,
      id: Date.now().toString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setProducts([...products, newProduct]);
    setIsDialogOpen(false);
  };

  const handleEditProduct = (productData: Omit<ClientProduct, 'id' | 'created_at' | 'updated_at'>) => {
    if (editingProduct) {
      const updatedProduct: ClientProduct = {
        ...productData,
        id: editingProduct.id,
        created_at: editingProduct.created_at,
        updated_at: new Date().toISOString(),
      };
      setProducts(products.map(p => p.id === editingProduct.id ? updatedProduct : p));
      setEditingProduct(null);
      setIsDialogOpen(false);
    }
  };

  const openEditDialog = (product: ClientProduct) => {
    setEditingProduct(product);
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingProduct(null);
  };

  const selectClient = (client: Client) => {
    setSelectedClient(client);
    setSearchTerm('');
  };

  const goBackToClients = () => {
    setSelectedClient(null);
    setSearchTerm('');
  };

  const getStorageRequirementColor = (requirement: string) => {
    switch (requirement) {
      case 'ambient': return 'bg-green-100 text-green-800';
      case 'refrigerated': return 'bg-blue-100 text-blue-800';
      case 'fragile': return 'bg-yellow-100 text-yellow-800';
      case 'hazardous': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };


  const totalProducts = products.filter(p => p.is_active).length;
  const totalClients = new Set(products.map(p => p.client_id)).size;
  const lowStockProducts = products.filter(p => p.reorder_level > 0).length;

  // If no client is selected, show client selection view
  if (!selectedClient) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Product Catalog</h1>
            <p className="text-muted-foreground">
              Select a client to view and manage their product inventory
            </p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{filteredClients.length}</div>
              <p className="text-xs text-muted-foreground">
                active clients
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Products</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalProducts}</div>
              <p className="text-xs text-muted-foreground">
                across all clients
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">SKUs Managed</CardTitle>
              <Barcode className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{products.length}</div>
              <p className="text-xs text-muted-foreground">
                unique products
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Client Search */}
        <div className="flex items-center space-x-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search clients..."
              value={clientSearchTerm}
              onChange={(e) => setClientSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>

        {/* Clients Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredClients.map((client) => {
            const clientProducts = products.filter(p => p.client_id === client.id);
            const activeProducts = clientProducts.filter(p => p.is_active);
            
            return (
              <Card key={client.id} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardHeader 
                  className="pb-2"
                  onClick={() => selectClient(client)}
                >
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{client.company_name}</CardTitle>
                    <Users className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <CardDescription>
                    {client.storage_plan} plan • {client.contact_name}
                  </CardDescription>
                </CardHeader>
                <CardContent onClick={() => selectClient(client)}>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Products:</span>
                      <span className="font-medium">{activeProducts.length}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Total SKUs:</span>
                      <span className="font-medium">{clientProducts.length}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Status:</span>
                      <Badge variant={client.is_active ? "default" : "secondary"}>
                        {client.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    );
  }

  // Show products for selected client
  return (
    <div className="space-y-6">
      {/* Header with back button */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" onClick={goBackToClients}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Clients
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{selectedClient.company_name} Products</h1>
            <p className="text-muted-foreground">
              Manage product inventory and barcodes for {selectedClient.company_name}
            </p>
          </div>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingProduct(null)} className="bg-green-600 hover:bg-green-700 text-white">
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </DialogTitle>
              <DialogDescription>
                {editingProduct 
                  ? 'Update product information and specifications.'
                  : `Enter product details for ${selectedClient.company_name}.`
                }
              </DialogDescription>
            </DialogHeader>
            <ProductForm
              product={editingProduct}
              onSubmit={editingProduct ? handleEditProduct : handleAddProduct}
              onCancel={closeDialog}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards for Selected Client */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Client Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredProducts.filter(p => p.is_active).length}</div>
            <p className="text-xs text-muted-foreground">
              active products
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">SKUs Managed</CardTitle>
            <Barcode className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredProducts.length}</div>
            <p className="text-xs text-muted-foreground">
              total SKUs
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reorder Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filteredProducts.filter(p => p.reorder_level > 0).length}
            </div>
            <p className="text-xs text-muted-foreground">
              products with reorder levels
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Product Search */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products, SKU, or barcode..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle>Products ({filteredProducts.length})</CardTitle>
          <CardDescription>
            Product catalog for {selectedClient.company_name}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>SKU</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Storage</TableHead>
                <TableHead>Dimensions</TableHead>
                <TableHead>Barcode</TableHead>
                <TableHead>Cost</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => (
                <TableRow key={product.id} className="animate-fade-in">
                  <TableCell className="font-medium">{product.sku}</TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{product.product_name}</div>
                      <div className="text-sm text-muted-foreground">
                        {product.description.substring(0, 50)}...
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{product.category}</TableCell>
                  <TableCell>
                    <Badge className={getStorageRequirementColor(product.storage_requirements)}>
                      {product.storage_requirements}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {product.dimensions_length}" × {product.dimensions_width}" × {product.dimensions_height}"
                      <div className="text-muted-foreground">
                        {product.cubic_feet} ft³, {product.weight_lbs} lbs
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div className="font-mono">{product.internal_barcode}</div>
                      <div className="text-muted-foreground font-mono">
                        {product.product_barcode}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>${product.cost_per_unit}</TableCell>
                  <TableCell>
                    <Badge variant={product.is_active ? "default" : "secondary"}>
                      {product.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditDialog(product)}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
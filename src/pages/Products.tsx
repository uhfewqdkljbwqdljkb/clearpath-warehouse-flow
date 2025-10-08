import React, { useState, useEffect } from 'react';
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Plus, MoreHorizontal, Package, Barcode, AlertTriangle, ArrowLeft, Building2, Users } from 'lucide-react';
import { Client, ClientProduct } from '@/types';
import { ClientCreationProductForm } from '@/components/ClientCreationProductForm';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useParams, useNavigate } from 'react-router-dom';

export const Products: React.FC = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ClientProduct | null>(null);
  const [clientSearchTerm, setClientSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { clientId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    fetchClients();
    if (clientId) {
      // If a specific client ID is provided in the URL, load that client's products
      fetchClientById(clientId);
    }
  }, [clientId]);

  useEffect(() => {
    if (selectedClient) {
      fetchProducts(selectedClient.id);
    }
  }, [selectedClient]);

  const fetchClients = async () => {
    try {
      const { data: companies, error } = await supabase
        .from('companies')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) {
        console.error('Error fetching companies:', error);
        return;
      }

      const clientsData: Client[] = companies?.map(company => ({
        id: company.id,
        client_code: company.client_code || '',
        company_name: company.name,
        contact_name: company.contact_person || '',
        email: company.email || '',
        phone: company.phone || '',
        address: company.address || '',
        billing_address: company.billing_address || '',
        contract_start_date: company.contract_start_date || '',
        contract_end_date: company.contract_end_date || '',
        storage_plan: (company.storage_plan as 'basic' | 'premium' | 'enterprise') || 'basic',
        max_storage_cubic_feet: company.max_storage_cubic_feet || 0,
        monthly_fee: parseFloat(company.monthly_fee?.toString() || '0'),
        is_active: company.is_active ?? true,
        created_at: company.created_at,
        updated_at: company.updated_at,
      })) || [];

      setClients(clientsData);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchClientById = async (id: string) => {
    try {
      const { data: company, error } = await supabase
        .from('companies')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching company:', error);
        toast({
          title: "Error",
          description: "Failed to load client data",
          variant: "destructive",
        });
        return;
      }

      const clientData: Client = {
        id: company.id,
        client_code: company.client_code || '',
        company_name: company.name,
        contact_name: company.contact_person || '',
        email: company.email || '',
        phone: company.phone || '',
        address: company.address || '',
        billing_address: company.billing_address || '',
        contract_start_date: company.contract_start_date || '',
        contract_end_date: company.contract_end_date || '',
        storage_plan: (company.storage_plan as 'basic' | 'premium' | 'enterprise') || 'basic',
        max_storage_cubic_feet: company.max_storage_cubic_feet || 0,
        monthly_fee: parseFloat(company.monthly_fee?.toString() || '0'),
        is_active: company.is_active ?? true,
        created_at: company.created_at,
        updated_at: company.updated_at,
      };

      setSelectedClient(clientData);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchProducts = async (companyId: string) => {
    try {
      const { data: productsData, error } = await supabase
        .from('client_products')
        .select(`
          *,
          inventory_items(
            quantity,
            location_zone,
            location_row,
            location_bin
          )
        `)
        .eq('company_id', companyId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching products:', error);
        return;
      }

      const formattedProducts: any[] = productsData?.map(product => ({
        id: product.id,
        company_id: product.company_id,
        sku: product.sku,
        name: product.name,
        description: product.description,
        category: product.category,
        dimensions_length: product.dimensions_length,
        dimensions_width: product.dimensions_width,
        dimensions_height: product.dimensions_height,
        weight: product.weight,
        unit_value: product.unit_value,
        storage_requirements: product.storage_requirements,
        variants: product.variants || [], // Include variants from JSONB column
        is_active: product.is_active,
        created_at: product.created_at,
        updated_at: product.updated_at,
        inventory_quantity: product.inventory_items?.reduce((sum, item) => sum + item.quantity, 0) || 0,
        location_info: product.inventory_items?.[0] 
          ? `${product.inventory_items[0].location_zone || 'N/A'}-${product.inventory_items[0].location_row || 'N/A'}-${product.inventory_items[0].location_bin || 'N/A'}`
          : 'No location',
      })) || [];

      setProducts(formattedProducts);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const filteredClients = clients.filter(client =>
    client.company_name.toLowerCase().includes(clientSearchTerm.toLowerCase())
  );

  const filteredProducts = selectedClient 
    ? products.filter(product => {
        const matchesSearch = 
          product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (product.category || '').toLowerCase().includes(searchTerm.toLowerCase());
        
        return matchesSearch;
      })
    : [];

  const handleAddProduct = async (products: any[]) => {
    if (!selectedClient) return;

    try {
      // Insert all products from the form
      const productsToInsert = products.map(product => ({
        company_id: selectedClient.id,
        sku: `${selectedClient.client_code}-${product.name.substring(0, 3).toUpperCase()}-${Date.now()}`,
        name: product.name,
        variants: product.variants || [],
      }));

      const { error } = await supabase
        .from('client_products')
        .insert(productsToInsert);

      if (error) {
        console.error('Error adding products:', error);
        toast({
          title: "Error",
          description: "Failed to add products",
          variant: "destructive",
        });
        return;
      }

      await fetchProducts(selectedClient.id);
      setIsDialogOpen(false);
      toast({
        title: "Success",
        description: `${products.length} product(s) added successfully`,
      });
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleEditProduct = async (products: any[]) => {
    if (!editingProduct || products.length === 0) return;

    try {
      // Update only the first product (since we're editing one at a time)
      const product = products[0];
      const { error } = await supabase
        .from('client_products')
        .update({
          name: product.name,
          variants: product.variants || [],
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingProduct.id);

      if (error) {
        console.error('Error updating product:', error);
        toast({
          title: "Error",
          description: "Failed to update product",
          variant: "destructive",
        });
        return;
      }

      if (selectedClient) {
        await fetchProducts(selectedClient.id);
      }
      setEditingProduct(null);
      setIsDialogOpen(false);
      toast({
        title: "Success",
        description: "Product updated successfully",
      });
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const openEditDialog = (product: any) => {
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
    if (clientId) {
      // If we came from a specific client route, go back to clients page
      navigate('/dashboard/clients');
    } else {
      setSelectedClient(null);
      setSearchTerm('');
    }
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
  const totalClients = clients.length;

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
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">Loading clients...</div>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredClients.map((client) => (
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
                      <span>Client Code:</span>
                      <span className="font-medium">{client.client_code}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Storage:</span>
                      <span className="font-medium">{client.max_storage_cubic_feet.toLocaleString()} ft³</span>
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
            ))}
          </div>
        )}
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
                Manage product catalog for {selectedClient.company_name} ({selectedClient.client_code})
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
            <ClientCreationProductForm
              initialProduct={editingProduct}
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
            <CardTitle className="text-sm font-medium">Total Inventory</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filteredProducts.reduce((sum, p) => sum + (p.inventory_quantity || 0), 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              units in stock
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
                <TableHead>Variants</TableHead>
                <TableHead>Storage</TableHead>
                <TableHead>Dimensions</TableHead>
                <TableHead>Unit Value</TableHead>
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
                      <div className="font-medium">{product.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {product.description && product.description.substring(0, 50)}
                        {product.description && product.description.length > 50 && '...'}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{product.category || 'N/A'}</TableCell>
                  <TableCell>
                    {product.variants && product.variants.length > 0 ? (
                      <div className="space-y-1">
                        {product.variants.map((variant: any, idx: number) => (
                          <div key={idx} className="text-sm">
                            <div className="font-medium text-xs text-muted-foreground">
                              {variant.attribute}:
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {variant.values.map((val: any, vIdx: number) => (
                                <Badge key={vIdx} variant="outline" className="text-xs">
                                  {val.value} ({val.quantity})
                                </Badge>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">No variants</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge className={getStorageRequirementColor(product.storage_requirements || 'ambient')}>
                      {product.storage_requirements || 'ambient'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {product.dimensions_length ? `${product.dimensions_length}" × ${product.dimensions_width}" × ${product.dimensions_height}"` : 'N/A'}
                      {product.weight && (
                        <div className="text-muted-foreground">
                          {product.weight} lbs
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>${product.unit_value || 0}</TableCell>
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
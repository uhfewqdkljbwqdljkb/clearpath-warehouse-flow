import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Search, Package, TrendingUp, Box, Plus, ArrowLeft, Upload } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ProductForm } from '@/components/ProductForm';
import { useParams, useNavigate } from 'react-router-dom';
import { ProductImportDialog } from '@/components/ProductImportDialog';

interface Product {
  id: string;
  name: string;
  sku?: string;
  variants?: any;
  is_active: boolean;
  company_id: string;
  companies?: {
    id: string;
    name: string;
    client_code: string;
  };
}

export const Products: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState<string>('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const { toast } = useToast();
  const { clientId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    // Auto-select client if clientId is in URL
    if (clientId) {
      setSelectedClient(clientId);
    }
  }, [clientId]);

  const fetchData = async () => {
    try {
      // Fetch products with company info
      const { data: productsData, error: productsError } = await supabase
        .from('client_products')
        .select(`
          *,
          companies (
            id,
            name,
            client_code
          )
        `)
        .order('created_at', { ascending: false });

      if (productsError) throw productsError;

      // Fetch clients for filter
      const { data: clientsData, error: clientsError } = await supabase
        .from('companies')
        .select('id, name, client_code')
        .eq('is_active', true)
        .order('name');

      if (clientsError) throw clientsError;

      setProducts(productsData || []);
      setClients(clientsData || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast({
        title: "Error",
        description: "Failed to load products",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Calculate metrics
  const totalProducts = products.length;
  const activeProducts = products.filter(p => p.is_active).length;
  const uniqueClients = new Set(products.map(p => p.company_id)).size;

  // Filter products
  const filteredProducts = products.filter(product => {
    const matchesSearch = 
      product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.companies?.name?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesClient = 
      selectedClient === 'all' || product.company_id === selectedClient;

    return matchesSearch && matchesClient;
  });

  const selectedClientInfo = clients.find(c => c.id === clientId);

  return (
    <div className="space-y-6">
      {showAddForm ? (
        <ProductForm 
          clients={clients}
          onSuccess={() => {
            setShowAddForm(false);
            fetchData();
          }}
          onCancel={() => setShowAddForm(false)}
        />
      ) : (
        <>
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <div className="flex items-center gap-2">
                {clientId && (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => navigate('/dashboard/clients')}
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                )}
                <div>
                  <h1 className="text-2xl font-bold tracking-tight">
                    {clientId && selectedClientInfo 
                      ? `${selectedClientInfo.name} - Products`
                      : 'Product Catalog'
                    }
                  </h1>
                  <p className="text-muted-foreground">
                    {clientId && selectedClientInfo
                      ? `Viewing products for ${selectedClientInfo.client_code}`
                      : 'Manage products across all clients'
                    }
                  </p>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              {clientId && selectedClientInfo && (
                <Button variant="outline" onClick={() => setShowImportDialog(true)}>
                  <Upload className="h-4 w-4 mr-2" />
                  Import Products
                </Button>
              )}
              <Button onClick={() => setShowAddForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Product
              </Button>
            </div>
          </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProducts}</div>
            <p className="text-xs text-muted-foreground">
              {activeProducts} active
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Products</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeProducts}</div>
            <p className="text-xs text-muted-foreground">
              {totalProducts - activeProducts} inactive
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clients</CardTitle>
            <Box className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{uniqueClients}</div>
            <p className="text-xs text-muted-foreground">
              With products
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products or client..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <Select value={selectedClient} onValueChange={setSelectedClient}>
          <SelectTrigger className="w-full sm:w-[250px]">
            <SelectValue placeholder="Filter by client" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Clients</SelectItem>
            {clients.map((client) => (
              <SelectItem key={client.id} value={client.id}>
                {client.name} ({client.client_code})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle>Products ({filteredProducts.length})</CardTitle>
          <CardDescription>
            Product catalog across all warehouse clients
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">Loading products...</div>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">
                {searchTerm || selectedClient !== 'all' 
                  ? 'No products found matching your filters.' 
                  : 'No products found. Products will appear here once clients add them.'}
              </div>
            </div>
          ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>SKU</TableHead>
                    <TableHead>Product Name</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Variants</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-mono text-sm font-medium">
                        {product.sku || 'Pending...'}
                      </TableCell>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell>
                        <div>
                          <div className="text-sm font-medium">
                            {product.companies?.name || 'Unknown'}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {product.companies?.client_code}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {product.variants && Array.isArray(product.variants) && product.variants.length > 0 ? (
                          <div className="space-y-1">
                            <Badge variant="secondary">
                              {product.variants.length} variant{product.variants.length > 1 ? 's' : ''}
                            </Badge>
                            {product.variants.map((variant: any, idx: number) => (
                              <div key={idx} className="text-xs text-muted-foreground">
                                {variant.sku && (
                                  <span className="font-mono">{variant.sku}</span>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">No variants</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={product.is_active ? "default" : "secondary"}>
                          {product.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
          )}
        </CardContent>
      </Card>
        </>
      )}

      {clientId && selectedClientInfo && (
        <ProductImportDialog
          open={showImportDialog}
          onOpenChange={setShowImportDialog}
          clientId={clientId}
          clientName={selectedClientInfo.name}
          clientCode={selectedClientInfo.client_code || ''}
          onImportComplete={fetchData}
        />
      )}
    </div>
  );
};
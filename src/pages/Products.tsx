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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Package, TrendingUp, Plus, ArrowLeft, Upload, Boxes, Building2, Tag, Hash, Download, FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ProductForm } from '@/components/ProductForm';
import { useParams, useNavigate } from 'react-router-dom';
import { ProductImportDialog } from '@/components/ProductImportDialog';
import { ProductHistoryExportDialog } from '@/components/ProductHistoryExportDialog';
import { exportProductListPDF } from '@/utils/productListPdfExport';

interface Product {
  id: string;
  name: string;
  sku?: string;
  variants?: any;
  is_active: boolean;
  company_id: string;
  minimum_quantity?: number;
  companies?: {
    id: string;
    name: string;
    client_code: string;
  };
}

interface InventoryData {
  product_id: string;
  quantity: number;
}

// Helper to calculate quantity from variants
const calculateVariantQuantity = (variants: any): number => {
  if (!variants || !Array.isArray(variants)) return 0;
  
  let total = 0;
  
  const processVariant = (variant: any) => {
    if (variant.values && Array.isArray(variant.values)) {
      variant.values.forEach((value: any) => {
        if (value.quantity !== undefined) {
          total += Number(value.quantity) || 0;
        }
        if (value.children && Array.isArray(value.children)) {
          value.children.forEach(processVariant);
        }
      });
    }
  };
  
  variants.forEach(processVariant);
  return total;
};

export const Products: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [inventoryData, setInventoryData] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState<string>('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [selectedProductForVariants, setSelectedProductForVariants] = useState<Product | null>(null);
  const [selectedProductForExport, setSelectedProductForExport] = useState<Product | null>(null);
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

      // Fetch inventory data for quantities
      const { data: inventoryItems, error: inventoryError } = await supabase
        .from('inventory_items')
        .select('product_id, quantity');

      if (inventoryError) throw inventoryError;

      // Aggregate inventory by product
      const inventoryMap: Record<string, number> = {};
      inventoryItems?.forEach((item: InventoryData) => {
        if (!inventoryMap[item.product_id]) {
          inventoryMap[item.product_id] = 0;
        }
        inventoryMap[item.product_id] += item.quantity;
      });
      setInventoryData(inventoryMap);

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

  // Get quantity for a product - prioritize variants, fallback to inventory
  const getProductQuantity = (product: Product): number => {
    // First try to calculate from variants
    if (product.variants && Array.isArray(product.variants) && product.variants.length > 0) {
      const variantTotal = calculateVariantQuantity(product.variants);
      if (variantTotal > 0) return variantTotal;
    }
    // Fallback to inventory_items
    return inventoryData[product.id] || 0;
  };

  // Calculate metrics
  const totalProducts = products.length;
  const activeProducts = products.filter(p => p.is_active).length;
  const uniqueClients = new Set(products.map(p => p.company_id)).size;
  const totalQuantity = products.reduce((acc, p) => acc + getProductQuantity(p), 0);

  // Filter products
  const filteredProducts = products.filter(product => {
    const matchesSearch = 
      product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.companies?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.companies?.client_code?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesClient = 
      selectedClient === 'all' || product.company_id === selectedClient;

    return matchesSearch && matchesClient;
  });

  const selectedClientInfo = clients.find(c => c.id === clientId);

  // Get variant count
  const getVariantCount = (variants: any): number => {
    if (!variants || !Array.isArray(variants)) return 0;
    
    let count = 0;
    const countVariants = (variant: any) => {
      if (variant.values && Array.isArray(variant.values)) {
        count += variant.values.length;
        variant.values.forEach((value: any) => {
          if (value.children && Array.isArray(value.children)) {
            value.children.forEach(countVariants);
          }
        });
      }
    };
    
    variants.forEach(countVariants);
    return count || variants.length;
  };

  // Flatten variants for display
  const flattenVariants = (variants: any): Array<{ path: string; quantity: number; sku?: string }> => {
    if (!variants || !Array.isArray(variants)) return [];
    
    const result: Array<{ path: string; quantity: number; sku?: string }> = [];
    
    const processVariant = (variant: any, parentPath: string = '') => {
      if (variant.values && Array.isArray(variant.values)) {
        const attribute = variant.attribute || 'Variant';
        variant.values.forEach((value: any) => {
          const currentPath = parentPath 
            ? `${parentPath} → ${attribute}: ${value.value || 'N/A'}`
            : `${attribute}: ${value.value || 'N/A'}`;
          
          if (value.children && Array.isArray(value.children) && value.children.length > 0) {
            value.children.forEach((child: any) => processVariant(child, currentPath));
          } else {
            result.push({
              path: currentPath,
              quantity: Number(value.quantity) || 0,
              sku: value.sku
            });
          }
        });
      }
    };
    
    variants.forEach((v: any) => processVariant(v));
    return result;
  };

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
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
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
              <Button 
                variant="outline" 
                onClick={() => {
                  const clientInfo = clientId ? clients.find(c => c.id === clientId) : undefined;
                  const prods = filteredProducts.length > 0 ? filteredProducts : products;
                  const filename = exportProductListPDF({
                    products: prods,
                    inventoryData,
                    title: clientInfo ? `${clientInfo.name} - Products` : 'Product Catalog',
                    clientName: clientInfo?.name,
                    clientCode: clientInfo?.client_code,
                    isAdmin: true,
                  });
                  toast({ title: "Export Complete", description: `Exported to ${filename}` });
                }}
              >
                <FileText className="h-4 w-4 mr-2" />
                Export PDF
              </Button>
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
          <div className="grid gap-4 md:grid-cols-4">
            <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Products</CardTitle>
                <Package className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalProducts}</div>
                <p className="text-xs text-muted-foreground">
                  {activeProducts} active
                </p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-green-500/5 to-green-500/10 border-green-500/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Quantity</CardTitle>
                <Boxes className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalQuantity.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  Units in stock
                </p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-blue-500/5 to-blue-500/10 border-blue-500/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Products</CardTitle>
                <TrendingUp className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{activeProducts}</div>
                <p className="text-xs text-muted-foreground">
                  {totalProducts - activeProducts} inactive
                </p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-amber-500/5 to-amber-500/10 border-amber-500/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Clients</CardTitle>
                <Building2 className="h-4 w-4 text-amber-600" />
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
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by product name, SKU, or client..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={selectedClient} onValueChange={setSelectedClient}>
                  <SelectTrigger className="w-full sm:w-[280px]">
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
            </CardContent>
          </Card>

          {/* Products Table */}
          <Card>
            <CardHeader className="border-b bg-muted/30">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Products</CardTitle>
                  <CardDescription>
                    Showing {filteredProducts.length} of {totalProducts} products
                  </CardDescription>
                </div>
                {filteredProducts.length > 0 && (
                  <Badge variant="outline" className="text-sm">
                    {filteredProducts.reduce((acc, p) => acc + getProductQuantity(p), 0).toLocaleString()} total units
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-muted-foreground">Loading products...</div>
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Package className="h-12 w-12 text-muted-foreground/50 mb-4" />
                  <div className="text-muted-foreground font-medium">
                    {searchTerm || selectedClient !== 'all' 
                      ? 'No products found matching your filters.' 
                      : 'No products found.'}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Products will appear here once clients add them.
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30 hover:bg-muted/30">
                      <TableHead className="font-semibold">Product</TableHead>
                      <TableHead className="font-semibold">SKU</TableHead>
                      <TableHead className="font-semibold">Client</TableHead>
                      <TableHead className="font-semibold text-center">Variants</TableHead>
                      <TableHead className="font-semibold text-right">Quantity</TableHead>
                      <TableHead className="font-semibold text-center">Status</TableHead>
                      <TableHead className="font-semibold text-center w-[80px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProducts.map((product) => {
                      const quantity = getProductQuantity(product);
                      const variantCount = getVariantCount(product.variants);
                      const isLowStock = product.minimum_quantity && quantity <= product.minimum_quantity;
                      
                      return (
                        <TableRow key={product.id} className="group">
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                <Package className="h-5 w-5 text-primary" />
                              </div>
                              <div className="min-w-0">
                                <div className="font-medium truncate max-w-[200px]">
                                  {product.name}
                                </div>
                                {product.minimum_quantity && product.minimum_quantity > 0 && (
                                  <div className="text-xs text-muted-foreground">
                                    Min: {product.minimum_quantity}
                                  </div>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <code className="text-sm bg-muted px-2 py-1 rounded font-mono">
                              {product.sku || 'N/A'}
                            </code>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="h-8 w-8 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0">
                                <Building2 className="h-4 w-4 text-amber-600" />
                              </div>
                              <div className="min-w-0">
                                <div className="font-medium text-sm truncate max-w-[150px]">
                                  {product.companies?.name || 'Unknown'}
                                </div>
                                <div className="text-xs text-muted-foreground font-mono">
                                  {product.companies?.client_code || '-'}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            {variantCount > 0 ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-auto p-1"
                                onClick={() => setSelectedProductForVariants(product)}
                              >
                                <Badge variant="secondary" className="font-medium cursor-pointer hover:bg-secondary/80">
                                  {variantCount} variant{variantCount > 1 ? 's' : ''}
                                </Badge>
                              </Button>
                            ) : (
                              <span className="text-muted-foreground text-sm">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <span className={`font-semibold text-base ${
                                isLowStock ? 'text-destructive' : 'text-foreground'
                              }`}>
                                {quantity.toLocaleString()}
                              </span>
                              {isLowStock && (
                                <Badge variant="destructive" className="text-xs">
                                  Low
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge 
                              variant={product.is_active ? "default" : "secondary"}
                              className={product.is_active 
                                ? "bg-green-500/10 text-green-600 hover:bg-green-500/20 border-green-500/20" 
                                : ""
                              }
                            >
                              {product.is_active ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedProductForExport(product)}
                              title="Export History"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
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

      {/* Variants Dialog */}
      <Dialog open={!!selectedProductForVariants} onOpenChange={(open) => !open && setSelectedProductForVariants(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              {selectedProductForVariants?.name} - Variants
            </DialogTitle>
          </DialogHeader>
          
          {selectedProductForVariants && (
            <div className="space-y-4">
              {/* Product Info */}
              <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                <div className="flex-1 grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Hash className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="text-xs text-muted-foreground">SKU</div>
                      <code className="text-sm font-mono">{selectedProductForVariants.sku || 'N/A'}</code>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="text-xs text-muted-foreground">Client</div>
                      <div className="text-sm font-medium">{selectedProductForVariants.companies?.name}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Boxes className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="text-xs text-muted-foreground">Total Quantity</div>
                      <div className="text-sm font-bold">{getProductQuantity(selectedProductForVariants).toLocaleString()}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="text-xs text-muted-foreground">Status</div>
                      <Badge variant={selectedProductForVariants.is_active ? "default" : "secondary"} className="mt-0.5">
                        {selectedProductForVariants.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              {/* Variants Table */}
              <div className="border rounded-lg">
                <div className="p-3 border-b bg-muted/30">
                  <h4 className="font-medium text-sm">Variant Details</h4>
                </div>
                <ScrollArea className="max-h-[300px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Variant</TableHead>
                        <TableHead>SKU</TableHead>
                        <TableHead className="text-right">Quantity</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {flattenVariants(selectedProductForVariants.variants).map((variant, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="h-2 w-2 rounded-full bg-primary/60" />
                              <span className="text-sm">{variant.path}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {variant.sku ? (
                              <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">
                                {variant.sku}
                              </code>
                            ) : (
                              <span className="text-muted-foreground text-xs">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {variant.quantity.toLocaleString()}
                          </TableCell>
                        </TableRow>
                      ))}
                      {flattenVariants(selectedProductForVariants.variants).length === 0 && (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                            No variant details available
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Export Dialog */}
      <ProductHistoryExportDialog
        open={!!selectedProductForExport}
        onOpenChange={(open) => !open && setSelectedProductForExport(null)}
        product={selectedProductForExport}
        isAdmin={true}
      />
    </div>
  );
};

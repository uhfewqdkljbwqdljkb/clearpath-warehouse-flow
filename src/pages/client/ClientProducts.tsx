import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useIntegration } from '@/contexts/IntegrationContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, Package, MoreVertical, X, Upload, PackageOpen } from 'lucide-react';
import { ProductImportDialog } from '@/components/ProductImportDialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

interface Product {
  id: string;
  name: string;
  sku: string | null;
  variants: any;
  is_active: boolean;
  created_at: string;
}

interface VariantValue {
  value: string;
  quantity: number;
}

interface Variant {
  attribute: string;
  values: VariantValue[];
}

export const ClientProducts: React.FC = () => {
  const { profile } = useAuth();
  const { logActivity } = useIntegration();
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [productName, setProductName] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [quantity, setQuantity] = useState(0);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [companyInfo, setCompanyInfo] = useState<{ name: string; client_code: string } | null>(null);

  useEffect(() => {
    if (profile?.company_id) {
      fetchProducts();
      fetchCompanyInfo();
      logActivity('products_access', 'User accessed products page', {
        timestamp: new Date().toISOString()
      });
    }
  }, [profile?.company_id]);

  const fetchCompanyInfo = async () => {
    if (!profile?.company_id) return;

    try {
      const { data, error } = await supabase
        .from('companies')
        .select('name, client_code')
        .eq('id', profile.company_id)
        .single();

      if (error) throw error;
      setCompanyInfo(data);
    } catch (error) {
      console.error('Error fetching company info:', error);
    }
  };

  const fetchProducts = async () => {
    if (!profile?.company_id) return;

    try {
      const { data, error } = await supabase
        .from('client_products')
        .select('*')
        .eq('company_id', profile.company_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast({
        title: "Error",
        description: "Failed to load products",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (product.sku && product.sku.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getVariantCount = (variants: any) => {
    if (!variants || !Array.isArray(variants)) return 0;
    return variants.reduce((total: number, variant: any) => {
      if (variant.values && Array.isArray(variant.values)) {
        return total + variant.values.length;
      }
      return total;
    }, 0);
  };

  const addVariant = () => {
    setVariants([...variants, { attribute: '', values: [{ value: '', quantity: 0 }] }]);
  };

  const removeVariant = (index: number) => {
    setVariants(variants.filter((_, i) => i !== index));
  };

  const updateVariant = (index: number, field: string, value: any) => {
    const updated = [...variants];
    updated[index] = { ...updated[index], [field]: value };
    setVariants(updated);
  };

  const addValueToVariant = (variantIndex: number) => {
    const updated = [...variants];
    updated[variantIndex].values.push({ value: '', quantity: 0 });
    setVariants(updated);
  };

  const removeValueFromVariant = (variantIndex: number, valueIndex: number) => {
    const updated = [...variants];
    updated[variantIndex].values = updated[variantIndex].values.filter((_, i) => i !== valueIndex);
    setVariants(updated);
  };

  const updateVariantValue = (variantIndex: number, valueIndex: number, field: string, value: any) => {
    const updated = [...variants];
    updated[variantIndex].values[valueIndex] = {
      ...updated[variantIndex].values[valueIndex],
      [field]: value
    };
    setVariants(updated);
  };

  const calculateTotalQuantity = () => {
    if (variants.length > 0) {
      return variants.reduce((sum, variant) => 
        sum + variant.values.reduce((vSum, val) => vSum + (val.quantity || 0), 0), 0
      );
    }
    return quantity;
  };

  const handleAddProduct = async () => {
    if (!productName.trim()) {
      toast({
        title: "Error",
        description: "Product name is required",
        variant: "destructive",
      });
      return;
    }

    if (!profile?.company_id) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('client_products')
        .insert([{
          company_id: profile.company_id,
          name: productName,
          is_active: isActive,
          variants: variants as any,
        }]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Product added successfully",
      });

      resetForm();
      fetchProducts();

      logActivity('product_created', 'User created a new product', {
        product_name: productName,
      });
    } catch (error) {
      console.error('Error adding product:', error);
      toast({
        title: "Error",
        description: "Failed to add product",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const resetForm = () => {
    setIsDialogOpen(false);
    setProductName('');
    setIsActive(true);
    setVariants([]);
    setQuantity(0);
  };

  const handleViewDetails = (product: Product) => {
    setSelectedProduct(product);
    setIsViewDialogOpen(true);
  };

  const handleEdit = (product: Product) => {
    setSelectedProduct(product);
    setProductName(product.name);
    setIsActive(product.is_active);
    setVariants(product.variants || []);
    setIsEditDialogOpen(true);
  };

  const handleUpdateProduct = async () => {
    if (!productName.trim() || !selectedProduct) {
      toast({
        title: "Error",
        description: "Product name is required",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('client_products')
        .update({
          name: productName,
          is_active: isActive,
          variants: variants as any,
        })
        .eq('id', selectedProduct.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Product updated successfully",
      });

      setIsEditDialogOpen(false);
      resetForm();
      setSelectedProduct(null);
      fetchProducts();

      logActivity('product_updated', 'User updated a product', {
        product_id: selectedProduct.id,
        product_name: productName,
      });
    } catch (error) {
      console.error('Error updating product:', error);
      toast({
        title: "Error",
        description: "Failed to update product",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (product: Product) => {
    if (!confirm(`Are you sure you want to delete "${product.name}"?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('client_products')
        .delete()
        .eq('id', product.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Product deleted successfully",
      });

      fetchProducts();

      logActivity('product_deleted', 'User deleted a product', {
        product_id: product.id,
        product_name: product.name,
      });
    } catch (error) {
      console.error('Error deleting product:', error);
      toast({
        title: "Error",
        description: "Failed to delete product",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Products</h1>
          <p className="text-muted-foreground">View your product catalog and manage check-in/check-out requests</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.location.href = '/client/check-out'}>
            <PackageOpen className="h-4 w-4 mr-2" />
            Check Out Products
          </Button>
          <Button onClick={() => window.location.href = '/client/check-in'}>
            <Package className="h-4 w-4 mr-2" />
            Check In Products
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search products..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle>Product Catalog</CardTitle>
          <CardDescription>View and manage all your products</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredProducts.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product Name</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Variants</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>
                      <code className="text-sm bg-muted px-2 py-1 rounded">
                        {product.sku || 'N/A'}
                      </code>
                    </TableCell>
                    <TableCell>
                      {getVariantCount(product.variants) > 0 ? (
                        <Badge variant="secondary">
                          {getVariantCount(product.variants)} variants
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">No variants</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        className={product.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                        }
                      >
                        {product.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(product.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewDetails(product)}>
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEdit(product)}>
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-destructive"
                            onClick={() => handleDelete(product)}
                          >
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No Products Found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm ? 'No products match your search criteria.' : 'Submit a check-in request to add products to your inventory.'}
              </p>
              <Button onClick={() => window.location.href = '/client/check-in'}>
                <Package className="h-4 w-4 mr-2" />
                Check In Products
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Product Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Product</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="productName">Product Name *</Label>
              <Input
                id="productName"
                placeholder="Enter product name"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">
                Total Quantity
                {variants.length > 0 && (
                  <span className="text-xs text-muted-foreground ml-2">(Auto-calculated from variants)</span>
                )}
              </Label>
              <Input
                id="quantity"
                type="number"
                min="0"
                value={variants.length > 0 ? calculateTotalQuantity() : quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                placeholder="Enter quantity"
                disabled={variants.length > 0}
                className={variants.length > 0 ? 'bg-muted cursor-not-allowed' : ''}
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Variants</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addVariant}
                >
                  Add Variant
                </Button>
              </div>

              {variants.map((variant, variantIndex) => (
                <div key={variantIndex} className="border rounded-lg p-4 space-y-3 bg-muted/30">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1">
                      <Label className="text-xs text-muted-foreground block mb-1">
                        Attribute Name
                      </Label>
                      <Input
                        value={variant.attribute}
                        onChange={(e) => updateVariant(variantIndex, 'attribute', e.target.value)}
                        placeholder="e.g., Color, Size, Material"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeVariant(variantIndex)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="space-y-2 pl-3 border-l-2">
                    <Label className="text-xs text-muted-foreground">Values</Label>
                    {variant.values.map((val, valueIndex) => (
                      <div key={valueIndex} className="flex gap-2 items-center">
                        <Input
                          value={val.value}
                          onChange={(e) => updateVariantValue(variantIndex, valueIndex, 'value', e.target.value)}
                          placeholder="e.g., Red, Large"
                          className="flex-1"
                        />
                        <Input
                          type="number"
                          min="0"
                          value={val.quantity}
                          onChange={(e) => updateVariantValue(variantIndex, valueIndex, 'quantity', parseInt(e.target.value) || 0)}
                          placeholder="Qty"
                          className="w-24"
                        />
                        {variant.values.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeValueFromVariant(variantIndex, valueIndex)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addValueToVariant(variantIndex)}
                      className="w-full"
                    >
                      + Add Value
                    </Button>
                  </div>
                </div>
              ))}

              {variants.length === 0 && (
                <p className="text-xs text-muted-foreground pl-4">
                  No variants added. Add variants to group values by attribute (e.g., Color with Red, Blue, Green).
                </p>
              )}
            </div>

            <div className="bg-muted/50 p-3 rounded-lg">
              <p className="text-xs text-muted-foreground">
                💡 <strong>Tip:</strong> For products with variants, add an attribute (e.g., "Color"), then add multiple values (Red: 5, Blue: 3). Total quantity auto-calculates from all variant values.
              </p>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label className="text-base">Active Product</Label>
                <div className="text-sm text-muted-foreground">
                  Product is available for use
                </div>
              </div>
              <Switch
                checked={isActive}
                onCheckedChange={setIsActive}
              />
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={resetForm}
            >
              Cancel
            </Button>
            <Button onClick={handleAddProduct} disabled={isSaving}>
              {isSaving ? 'Adding...' : 'Add Product'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Product Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="editProductName">Product Name *</Label>
              <Input
                id="editProductName"
                placeholder="Enter product name"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="editQuantity">
                Total Quantity
                {variants.length > 0 && (
                  <span className="text-xs text-muted-foreground ml-2">(Auto-calculated from variants)</span>
                )}
              </Label>
              <Input
                id="editQuantity"
                type="number"
                min="0"
                value={variants.length > 0 ? calculateTotalQuantity() : quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                placeholder="Enter quantity"
                disabled={variants.length > 0}
                className={variants.length > 0 ? 'bg-muted cursor-not-allowed' : ''}
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Variants</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addVariant}
                >
                  Add Variant
                </Button>
              </div>

              {variants.map((variant, variantIndex) => (
                <div key={variantIndex} className="border rounded-lg p-4 space-y-3 bg-muted/30">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1">
                      <Label className="text-xs text-muted-foreground block mb-1">
                        Attribute Name
                      </Label>
                      <Input
                        value={variant.attribute}
                        onChange={(e) => updateVariant(variantIndex, 'attribute', e.target.value)}
                        placeholder="e.g., Color, Size, Material"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeVariant(variantIndex)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="space-y-2 pl-3 border-l-2">
                    <Label className="text-xs text-muted-foreground">Values</Label>
                    {variant.values.map((val, valueIndex) => (
                      <div key={valueIndex} className="flex gap-2 items-center">
                        <Input
                          value={val.value}
                          onChange={(e) => updateVariantValue(variantIndex, valueIndex, 'value', e.target.value)}
                          placeholder="e.g., Red, Large"
                          className="flex-1"
                        />
                        <Input
                          type="number"
                          min="0"
                          value={val.quantity}
                          onChange={(e) => updateVariantValue(variantIndex, valueIndex, 'quantity', parseInt(e.target.value) || 0)}
                          placeholder="Qty"
                          className="w-24"
                        />
                        {variant.values.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeValueFromVariant(variantIndex, valueIndex)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addValueToVariant(variantIndex)}
                      className="w-full"
                    >
                      + Add Value
                    </Button>
                  </div>
                </div>
              ))}

              {variants.length === 0 && (
                <p className="text-xs text-muted-foreground pl-4">
                  No variants added. Add variants to group values by attribute.
                </p>
              )}
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label className="text-base">Active Product</Label>
                <div className="text-sm text-muted-foreground">
                  Product is available for use
                </div>
              </div>
              <Switch
                checked={isActive}
                onCheckedChange={setIsActive}
              />
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setIsEditDialogOpen(false);
                resetForm();
                setSelectedProduct(null);
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdateProduct} disabled={isSaving}>
              {isSaving ? 'Updating...' : 'Update Product'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Details Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Product Details</DialogTitle>
          </DialogHeader>
          {selectedProduct && (
            <div className="space-y-4 py-4">
              <div>
                <Label className="text-muted-foreground">Product Name</Label>
                <p className="text-lg font-medium">{selectedProduct.name}</p>
              </div>

              <div>
                <Label className="text-muted-foreground">SKU</Label>
                <code className="text-sm bg-muted px-2 py-1 rounded block mt-1">
                  {selectedProduct.sku || 'N/A'}
                </code>
              </div>

              <div>
                <Label className="text-muted-foreground">Status</Label>
                <div className="mt-1">
                  <Badge className={selectedProduct.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                    {selectedProduct.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>

              <div>
                <Label className="text-muted-foreground">Created</Label>
                <p>{new Date(selectedProduct.created_at).toLocaleString()}</p>
              </div>

              {selectedProduct.variants && Array.isArray(selectedProduct.variants) && selectedProduct.variants.length > 0 && (
                <div>
                  <Label className="text-muted-foreground">Variants</Label>
                  <div className="mt-2 space-y-3">
                    {selectedProduct.variants.map((variant: any, index: number) => (
                      <div key={index} className="border rounded-lg p-3 bg-muted/30">
                        <div className="font-medium mb-2">{variant.attribute}</div>
                        <div className="space-y-1">
                          {variant.values?.map((val: any, vIndex: number) => (
                            <div key={vIndex} className="flex justify-between text-sm">
                              <span>{val.value}</span>
                              <span className="text-muted-foreground">Qty: {val.quantity}</span>
                            </div>
                          ))}
                        </div>
                        {variant.sku && (
                          <div className="mt-2 text-xs text-muted-foreground">
                            SKU: <code className="bg-background px-1 py-0.5 rounded">{variant.sku}</code>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          <div className="flex justify-end">
            <Button onClick={() => setIsViewDialogOpen(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Import Products Dialog */}
      {profile?.company_id && companyInfo && (
        <ProductImportDialog
          open={showImportDialog}
          onOpenChange={setShowImportDialog}
          clientId={profile.company_id}
          clientName={companyInfo.name}
          clientCode={companyInfo.client_code || ''}
          onImportComplete={fetchProducts}
        />
      )}
    </div>
  );
};

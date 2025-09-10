import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ClientProductForm } from '@/components/ClientProductForm';
import { Plus, Search, Edit, Trash2, Package } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ClientProduct {
  id: string;
  name: string;
  sku: string;
  description?: string;
  category?: string;
  dimensions_length?: number;
  dimensions_width?: number;
  dimensions_height?: number;
  weight?: number;
  unit_value?: number;
  storage_requirements?: string;
  is_active: boolean;
}

export const ClientProducts: React.FC = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [products, setProducts] = useState<ClientProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ClientProduct | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (profile?.company_id) {
      fetchProducts();
    }
  }, [profile?.company_id]);

  const fetchProducts = async () => {
    if (!profile?.company_id) return;

    try {
      const { data, error } = await supabase
        .from('client_products')
        .select('*')
        .eq('company_id', profile.company_id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast({
        title: "Error",
        description: "Failed to fetch products",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateProduct = async (productData: Omit<ClientProduct, 'id'>) => {
    if (!profile?.company_id) return;

    try {
      const { error } = await supabase
        .from('client_products')
        .insert([{
          ...productData,
          company_id: profile.company_id
        }]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Product created successfully",
      });
      
      setShowForm(false);
      fetchProducts();
    } catch (error) {
      console.error('Error creating product:', error);
      toast({
        title: "Error",
        description: "Failed to create product",
        variant: "destructive",
      });
    }
  };

  const handleUpdateProduct = async (productData: Omit<ClientProduct, 'id'>) => {
    if (!editingProduct) return;

    try {
      const { error } = await supabase
        .from('client_products')
        .update(productData)
        .eq('id', editingProduct.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Product updated successfully",
      });
      
      setEditingProduct(null);
      setShowForm(false);
      fetchProducts();
    } catch (error) {
      console.error('Error updating product:', error);
      toast({
        title: "Error",
        description: "Failed to update product",
        variant: "destructive",
      });
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    try {
      const { error } = await supabase
        .from('client_products')
        .update({ is_active: false })
        .eq('id', productId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Product deactivated successfully",
      });
      
      fetchProducts();
    } catch (error) {
      console.error('Error deactivating product:', error);
      toast({
        title: "Error",
        description: "Failed to deactivate product",
        variant: "destructive",
      });
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (product.category && product.category.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  if (showForm) {
    return (
      <ClientProductForm
        product={editingProduct}
        onSubmit={editingProduct ? handleUpdateProduct : handleCreateProduct}
        onCancel={() => {
          setShowForm(false);
          setEditingProduct(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Products</h1>
          <p className="text-muted-foreground">Manage your product catalog</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Product
        </Button>
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

      {/* Products Grid */}
      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <Card key={product.id} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <Package className="h-8 w-8 text-primary" />
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingProduct(product);
                        setShowForm(true);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteProduct(product.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div>
                  <CardTitle className="text-lg">{product.name}</CardTitle>
                  <CardDescription>{product.sku}</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {product.category && (
                  <Badge variant="secondary">{product.category}</Badge>
                )}
                
                {product.description && (
                  <p className="text-sm text-muted-foreground">{product.description}</p>
                )}

                <div className="grid grid-cols-2 gap-2 text-sm">
                  {product.unit_value && (
                    <div>
                      <span className="font-medium">Value:</span> ${product.unit_value}
                    </div>
                  )}
                  {product.weight && (
                    <div>
                      <span className="font-medium">Weight:</span> {product.weight} kg
                    </div>
                  )}
                </div>

                {(product.dimensions_length || product.dimensions_width || product.dimensions_height) && (
                  <div className="text-sm">
                    <span className="font-medium">Dimensions:</span>{' '}
                    {product.dimensions_length}×{product.dimensions_width}×{product.dimensions_height} cm
                  </div>
                )}

                {product.storage_requirements && (
                  <div className="text-sm">
                    <span className="font-medium">Storage:</span> {product.storage_requirements}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="text-center py-12">
          <CardContent>
            <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Products Found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm ? 'No products match your search criteria.' : "You haven't added any products yet."}
            </p>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Your First Product
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
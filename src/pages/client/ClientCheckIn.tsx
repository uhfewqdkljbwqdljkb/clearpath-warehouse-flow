import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Upload, Plus, X, Package } from 'lucide-react';
import { ProductImportDialog } from '@/components/ProductImportDialog';
import { ExistingProductsDialog } from '@/components/ExistingProductsDialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { NestedVariantEditor } from '@/components/NestedVariantEditor';
import { Variant, calculateNestedVariantQuantity } from '@/types/variants';

interface ProductEntry {
  name: string;
  quantity: number;
  variants: Variant[];
  existingProductId?: string; // For existing products
  supplierId?: string; // B2B: assigned supplier
  customerId?: string; // B2B: designated customer
}

export const ClientCheckIn: React.FC = () => {
  const navigate = useNavigate();
  const { profile, company } = useAuth();
  const { toast } = useToast();
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [products, setProducts] = useState<ProductEntry[]>([]);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showExistingProductsDialog, setShowExistingProductsDialog] = useState(false);
  
  // B2B-specific state
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [requiredDate, setRequiredDate] = useState('');
  const isB2B = company?.client_type === 'b2b';

  // Fetch suppliers and customers for B2B clients
  useEffect(() => {
    if (isB2B && profile?.company_id) {
      fetchSuppliers();
      fetchCustomers();
    }
  }, [isB2B, profile?.company_id]);

  const fetchSuppliers = async () => {
    if (!profile?.company_id) return;

    try {
      const { data, error } = await supabase
        .from('b2b_suppliers')
        .select('*')
        .eq('company_id', profile.company_id)
        .eq('is_active', true)
        .order('supplier_name');

      if (error) throw error;
      setSuppliers(data || []);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
    }
  };

  const fetchCustomers = async () => {
    if (!profile?.company_id) return;

    try {
      const { data, error } = await supabase
        .from('b2b_customers')
        .select('*')
        .eq('company_id', profile.company_id)
        .eq('is_active', true)
        .order('customer_name');

      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const addProduct = () => {
    setProducts([...products, { 
      name: '', 
      quantity: 0,
      variants: [],
      supplierId: '',
      customerId: '',
    }]);
  };

  const removeProduct = (index: number) => {
    setProducts(products.filter((_, i) => i !== index));
  };

  const updateProduct = (index: number, field: string, value: any) => {
    const updated = [...products];
    updated[index] = { ...updated[index], [field]: value };
    setProducts(updated);
  };

  const updateProductVariants = (productIndex: number, newVariants: Variant[]) => {
    const updated = [...products];
    updated[productIndex].variants = newVariants;
    // Auto-update total quantity using nested calculation
    updated[productIndex].quantity = calculateNestedVariantQuantity(newVariants);
    setProducts(updated);
  };

  const calculateTotalQuantity = (productIndex: number) => {
    const product = products[productIndex];
    if (product.variants.length > 0) {
      return calculateNestedVariantQuantity(product.variants);
    }
    return product.quantity || 0;
  };

  const handleImportComplete = () => {
    setShowImportDialog(false);
    toast({
      title: "Success",
      description: "Products imported successfully. They will be added after approval.",
    });
  };

  const handleExistingProductsSelected = async (newProducts: ProductEntry[]) => {
    try {
      // For B2B, fetch existing supplier/customer assignments for existing products
      if (isB2B && newProducts && newProducts.length > 0) {
        const productIds = newProducts
          .filter(p => p?.existingProductId)
          .map(p => p.existingProductId);
        
        if (productIds.length > 0) {
          const { data: existingProducts, error } = await supabase
            .from('client_products')
            .select('id, supplier_id, customer_id')
            .in('id', productIds);
          
          if (error) {
            console.error('Error fetching existing products:', error);
            throw error;
          }
          
          const enrichedProducts = newProducts.map(p => {
            if (p?.existingProductId) {
              const existing = existingProducts?.find(ep => ep.id === p.existingProductId);
              if (existing) {
                return {
                  ...p,
                  supplierId: existing.supplier_id || '',
                  customerId: existing.customer_id || '',
                };
              }
            }
            return p;
          });
          
          setProducts([...products, ...enrichedProducts]);
          return;
        }
      }
      setProducts([...products, ...(newProducts || [])]);
    } catch (error) {
      console.error('Error processing existing products:', error);
      toast({
        title: "Error",
        description: "Failed to process selected products. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async () => {
    if (products.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one product",
        variant: "destructive",
      });
      return;
    }

    // Validate all products
    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      
      if (!product.name || product.name.trim() === '') {
        toast({
          title: "Error",
          description: `Product ${i + 1}: Please enter a product name`,
          variant: "destructive",
        });
        return;
      }

      const totalQty = calculateTotalQuantity(i);
      if (totalQty <= 0) {
        toast({
          title: "Error",
          description: `Product "${product.name}": Quantity must be greater than 0. ${product.variants.length > 0 ? 'Please add quantities to variant values.' : ''}`,
          variant: "destructive",
        });
        return;
      }

      // Validate variants if they exist
      if (product.variants.length > 0) {
        for (let j = 0; j < product.variants.length; j++) {
          const variant = product.variants[j];
          
          if (!variant.attribute || variant.attribute.trim() === '') {
            toast({
              title: "Error",
              description: `Product "${product.name}": Variant ${j + 1} must have an attribute name`,
              variant: "destructive",
            });
            return;
          }

          if (variant.values.length === 0) {
            toast({
              title: "Error",
              description: `Product "${product.name}": Variant "${variant.attribute}" must have at least one value`,
              variant: "destructive",
            });
            return;
          }

          for (let k = 0; k < variant.values.length; k++) {
            const value = variant.values[k];
            if (!value.value || value.value.trim() === '') {
              toast({
                title: "Error",
                description: `Product "${product.name}": Variant "${variant.attribute}" has an empty value at position ${k + 1}`,
                variant: "destructive",
              });
              return;
            }
          }
        }
      }
    }

    if (!profile?.company_id) return;

    setIsSubmitting(true);
    try {
      console.log('Submitting check-in request with products:', products);
      
      // Generate request number
      const { data: requestNumber, error: fnError } = await supabase
        .rpc('generate_check_in_request_number');

      if (fnError) {
        console.error('Error generating request number:', fnError);
        throw fnError;
      }

      console.log('Generated request number:', requestNumber);

      // Create check-in request - include supplier/customer info per product for B2B
      const requestData: any = {
        company_id: profile.company_id,
        request_number: requestNumber,
        requested_products: products as any,
        notes: notes || null,
        requested_by: profile.id,
        status: 'pending',
        request_type: isB2B ? 'supplier_sourcing' : 'standard',
        required_date: isB2B && requiredDate ? requiredDate : null,
      };

      const { error } = await supabase
        .from('check_in_requests')
        .insert([requestData]);

      if (error) {
        console.error('Error inserting check-in request:', error);
        throw error;
      }

      console.log('Check-in request submitted successfully');

      toast({
        title: "Success",
        description: "Check-in request submitted successfully",
      });

      navigate('/client/requests');
    } catch (error) {
      console.error('Error submitting check-in request:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit check-in request",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate('/client/products')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Products
        </Button>
      </div>

      <div>
        <h1 className="text-3xl font-bold text-foreground">Check In Products</h1>
        <p className="text-muted-foreground">Submit a request to add new products to your inventory</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Product Details</CardTitle>
          <CardDescription>Add products manually or import from Excel</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {isB2B && (
            <div className="p-4 border rounded-lg bg-muted/50 space-y-2">
              <h3 className="font-medium text-sm">B2B Check-In</h3>
              <p className="text-xs text-muted-foreground">
                For each product below, assign a supplier (source) and customer (destination).
              </p>
              <div className="space-y-2">
                <Label>Required Date (Optional)</Label>
                <Input 
                  type="date" 
                  value={requiredDate}
                  onChange={(e) => setRequiredDate(e.target.value)}
                />
              </div>
            </div>
          )}
          
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" onClick={() => setShowImportDialog(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Import from Excel
            </Button>
            <Button variant="outline" onClick={() => setShowExistingProductsDialog(true)}>
              <Package className="h-4 w-4 mr-2" />
              Check In Existing Products
            </Button>
            <Button onClick={addProduct}>
              <Plus className="h-4 w-4 mr-2" />
              Add Product Manually
            </Button>
          </div>

          {products.map((product, productIndex) => (
            <Card key={productIndex} className="border-2">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <CardTitle className="text-base">Product {productIndex + 1}</CardTitle>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => removeProduct(productIndex)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Product Name *</Label>
                  <Input
                    placeholder="Enter product name"
                    value={product.name}
                    onChange={(e) => updateProduct(productIndex, 'name', e.target.value)}
                  />
                </div>

                {/* B2B: Per-product supplier and customer selection */}
                {isB2B && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3 border rounded-lg bg-muted/30">
                    <div className="space-y-2">
                      <Label>Supplier (Source) {product.existingProductId ? '' : '*'}</Label>
                      <Select 
                        value={product.supplierId || ''} 
                        onValueChange={(value) => updateProduct(productIndex, 'supplierId', value)}
                        disabled={!!product.existingProductId && !!product.supplierId}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select supplier" />
                        </SelectTrigger>
                        <SelectContent>
                          {suppliers.map((supplier) => (
                            <SelectItem key={supplier.id} value={supplier.id}>
                              {supplier.supplier_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {product.existingProductId && product.supplierId && (
                        <p className="text-xs text-muted-foreground">Locked to original supplier</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>Customer (Destination) {product.existingProductId ? '' : '*'}</Label>
                      <Select 
                        value={product.customerId || ''} 
                        onValueChange={(value) => updateProduct(productIndex, 'customerId', value)}
                        disabled={!!product.existingProductId && !!product.customerId}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select customer" />
                        </SelectTrigger>
                        <SelectContent>
                          {customers.map((customer) => (
                            <SelectItem key={customer.id} value={customer.id}>
                              {customer.customer_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {product.existingProductId && product.customerId && (
                        <p className="text-xs text-muted-foreground">Locked to original customer</p>
                      )}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Quantity {product.variants.length > 0 && '(Auto-calculated from variants)'}</Label>
                  <Input
                    type="number"
                    placeholder="Enter quantity"
                    value={calculateTotalQuantity(productIndex)}
                    onChange={(e) => updateProduct(productIndex, 'quantity', parseInt(e.target.value) || 0)}
                    disabled={product.variants.length > 0}
                  />
                </div>

                <NestedVariantEditor
                  variants={product.variants}
                  onChange={(newVariants) => updateProductVariants(productIndex, newVariants)}
                  maxDepth={3}
                />
              </CardContent>
            </Card>
          ))}

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any additional notes or special instructions..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => navigate('/client/products')}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit Check-In Request'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {showImportDialog && profile?.company_id && (
        <ProductImportDialog
          open={showImportDialog}
          onOpenChange={setShowImportDialog}
          clientId={profile.company_id}
          clientName=""
          clientCode=""
          onImportComplete={handleImportComplete}
        />
      )}

      {showExistingProductsDialog && profile?.company_id && (
        <ExistingProductsDialog
          open={showExistingProductsDialog}
          onOpenChange={setShowExistingProductsDialog}
          companyId={profile.company_id}
          onProductsSelected={handleExistingProductsSelected}
        />
      )}
    </div>
  );
};
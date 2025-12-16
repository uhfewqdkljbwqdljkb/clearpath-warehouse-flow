import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search, ArrowRight, Package } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';

interface Product {
  id: string;
  name: string;
  sku: string | null;
  supplier_id: string | null;
  customer_id: string | null;
}

interface Supplier {
  id: string;
  supplier_name: string;
}

interface Customer {
  id: string;
  customer_name: string;
}

interface ReassignProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
  onReassignComplete: () => void;
}

export const ReassignProductDialog: React.FC<ReassignProductDialogProps> = ({
  open,
  onOpenChange,
  companyId,
  onReassignComplete,
}) => {
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [newSupplierId, setNewSupplierId] = useState<string>('');
  const [newCustomerId, setNewCustomerId] = useState<string>('');

  useEffect(() => {
    if (open && companyId) {
      fetchData();
    }
  }, [open, companyId]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [productsRes, suppliersRes, customersRes] = await Promise.all([
        supabase
          .from('client_products')
          .select('id, name, sku, supplier_id, customer_id')
          .eq('company_id', companyId)
          .eq('is_active', true)
          .order('name'),
        supabase
          .from('b2b_suppliers')
          .select('id, supplier_name')
          .eq('company_id', companyId)
          .eq('is_active', true)
          .order('supplier_name'),
        supabase
          .from('b2b_customers')
          .select('id, customer_name')
          .eq('company_id', companyId)
          .eq('is_active', true)
          .order('customer_name'),
      ]);

      if (productsRes.error) throw productsRes.error;
      if (suppliersRes.error) throw suppliersRes.error;
      if (customersRes.error) throw customersRes.error;

      setProducts(productsRes.data || []);
      setSuppliers(suppliersRes.data || []);
      setCustomers(customersRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load data',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.sku && p.sku.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const toggleProduct = (productId: string) => {
    setSelectedProducts((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  const selectAll = () => {
    if (selectedProducts.length === filteredProducts.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(filteredProducts.map((p) => p.id));
    }
  };

  const getSupplierName = (supplierId: string | null) => {
    if (!supplierId) return 'Not assigned';
    return suppliers.find((s) => s.id === supplierId)?.supplier_name || 'Unknown';
  };

  const getCustomerName = (customerId: string | null) => {
    if (!customerId) return 'Not assigned';
    return customers.find((c) => c.id === customerId)?.customer_name || 'Unknown';
  };

  const handleReassign = async () => {
    if (selectedProducts.length === 0) {
      toast({
        title: 'Error',
        description: 'Please select at least one product',
        variant: 'destructive',
      });
      return;
    }

    if (!newSupplierId && !newCustomerId) {
      toast({
        title: 'Error',
        description: 'Please select a supplier or customer to assign',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      const updates: { supplier_id?: string; customer_id?: string } = {};
      if (newSupplierId) updates.supplier_id = newSupplierId;
      if (newCustomerId) updates.customer_id = newCustomerId;

      const { error } = await supabase
        .from('client_products')
        .update(updates)
        .in('id', selectedProducts);

      if (error) throw error;

      toast({
        title: 'Success',
        description: `${selectedProducts.length} product(s) reassigned successfully`,
      });

      resetForm();
      onReassignComplete();
      onOpenChange(false);
    } catch (error) {
      console.error('Error reassigning products:', error);
      toast({
        title: 'Error',
        description: 'Failed to reassign products',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const resetForm = () => {
    setSelectedProducts([]);
    setNewSupplierId('');
    setNewCustomerId('');
    setSearchTerm('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Reassign Products</DialogTitle>
          <DialogDescription>
            Select products and assign them to a different supplier or customer
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">Loading...</div>
        ) : (
          <div className="flex flex-col gap-4 flex-1 overflow-hidden">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products by name or SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Product Selection */}
            <div className="flex-1 overflow-hidden border rounded-lg">
              <div className="flex items-center justify-between p-3 border-b bg-muted/30">
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={
                      filteredProducts.length > 0 &&
                      selectedProducts.length === filteredProducts.length
                    }
                    onCheckedChange={selectAll}
                  />
                  <span className="text-sm font-medium">
                    {selectedProducts.length} of {filteredProducts.length} selected
                  </span>
                </div>
              </div>
              <ScrollArea className="h-[250px]">
                {filteredProducts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                    <Package className="h-8 w-8 mb-2" />
                    <p>No products found</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {filteredProducts.map((product) => (
                      <div
                        key={product.id}
                        className={`flex items-center gap-3 p-3 hover:bg-muted/50 cursor-pointer ${
                          selectedProducts.includes(product.id) ? 'bg-primary/5' : ''
                        }`}
                        onClick={() => toggleProduct(product.id)}
                      >
                        <Checkbox
                          checked={selectedProducts.includes(product.id)}
                          onCheckedChange={() => toggleProduct(product.id)}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{product.name}</div>
                          <div className="text-xs text-muted-foreground">
                            SKU: {product.sku || 'N/A'}
                          </div>
                        </div>
                        <div className="text-right text-xs space-y-1">
                          <div>
                            <span className="text-muted-foreground">Supplier: </span>
                            <Badge variant="outline" className="text-xs">
                              {getSupplierName(product.supplier_id)}
                            </Badge>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Customer: </span>
                            <Badge variant="outline" className="text-xs">
                              {getCustomerName(product.customer_id)}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>

            {/* Assignment Section */}
            <div className="border rounded-lg p-4 bg-muted/30">
              <div className="flex items-center gap-2 mb-3">
                <ArrowRight className="h-4 w-4 text-primary" />
                <span className="font-medium">Assign To</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Supplier</Label>
                  <Select value={newSupplierId} onValueChange={setNewSupplierId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select supplier..." />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers.map((supplier) => (
                        <SelectItem key={supplier.id} value={supplier.id}>
                          {supplier.supplier_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Customer</Label>
                  <Select value={newCustomerId} onValueChange={setNewCustomerId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select customer..." />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.customer_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Leave a field empty to keep the current assignment
              </p>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleReassign}
                disabled={isSaving || selectedProducts.length === 0}
              >
                {isSaving ? 'Reassigning...' : `Reassign ${selectedProducts.length} Product(s)`}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

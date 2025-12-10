import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Package, Truck, Users, Building2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Client } from '@/types';

interface B2BClientDetailDialogProps {
  client: Client | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Product {
  id: string;
  name: string;
  sku: string | null;
  is_active: boolean;
  variants: any;
  supplier_id: string | null;
  customer_id: string | null;
}

interface Supplier {
  id: string;
  supplier_name: string;
  representative_name: string;
  location: string;
  phone: string;
  is_active: boolean;
}

interface Customer {
  id: string;
  customer_name: string;
  representative_name: string;
  location: string;
  phone: string;
  is_active: boolean;
}

export const B2BClientDetailDialog: React.FC<B2BClientDetailDialogProps> = ({
  client,
  open,
  onOpenChange,
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (client && open) {
      fetchData();
    }
  }, [client, open]);

  const fetchData = async () => {
    if (!client) return;
    setLoading(true);

    try {
      const [productsRes, suppliersRes, customersRes] = await Promise.all([
        supabase
          .from('client_products')
          .select('id, name, sku, is_active, variants, supplier_id, customer_id')
          .eq('company_id', client.id)
          .order('name'),
        supabase
          .from('b2b_suppliers')
          .select('*')
          .eq('company_id', client.id)
          .order('supplier_name'),
        supabase
          .from('b2b_customers')
          .select('*')
          .eq('company_id', client.id)
          .order('customer_name'),
      ]);

      setProducts(productsRes.data || []);
      setSuppliers(suppliersRes.data || []);
      setCustomers(customersRes.data || []);
    } catch (error) {
      console.error('Error fetching B2B client data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Create maps for supplier/customer names
  const suppliersMap = suppliers.reduce((acc, s) => {
    acc[s.id] = s.supplier_name;
    return acc;
  }, {} as Record<string, string>);

  const customersMap = customers.reduce((acc, c) => {
    acc[c.id] = c.customer_name;
    return acc;
  }, {} as Record<string, string>);

  if (!client) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            {client.company_name}
            <Badge variant="outline" className="ml-2">B2B</Badge>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="products" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="products" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Products ({products.length})
            </TabsTrigger>
            <TabsTrigger value="suppliers" className="flex items-center gap-2">
              <Truck className="h-4 w-4" />
              Suppliers ({suppliers.length})
            </TabsTrigger>
            <TabsTrigger value="customers" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Customers ({customers.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="products" className="mt-4">
            <ScrollArea className="h-[400px]">
              {loading ? (
                <div className="flex items-center justify-center py-8 text-muted-foreground">
                  Loading products...
                </div>
              ) : products.length === 0 ? (
                <div className="flex items-center justify-center py-8 text-muted-foreground">
                  No products found
                </div>
              ) : (
                <div className="space-y-3 pr-4">
                  {products.map((product) => (
                    <Card key={product.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{product.name}</span>
                              <Badge variant={product.is_active ? "default" : "secondary"} className="text-xs">
                                {product.is_active ? "Active" : "Inactive"}
                              </Badge>
                            </div>
                            {product.sku && (
                              <p className="text-sm text-muted-foreground">SKU: {product.sku}</p>
                            )}
                            <div className="flex flex-wrap gap-2 mt-2">
                              {product.supplier_id && suppliersMap[product.supplier_id] && (
                                <Badge variant="outline" className="text-xs">
                                  <Truck className="h-3 w-3 mr-1" />
                                  {suppliersMap[product.supplier_id]}
                                </Badge>
                              )}
                              {product.customer_id && customersMap[product.customer_id] && (
                                <Badge variant="outline" className="text-xs">
                                  <Users className="h-3 w-3 mr-1" />
                                  {customersMap[product.customer_id]}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="suppliers" className="mt-4">
            <ScrollArea className="h-[400px]">
              {loading ? (
                <div className="flex items-center justify-center py-8 text-muted-foreground">
                  Loading suppliers...
                </div>
              ) : suppliers.length === 0 ? (
                <div className="flex items-center justify-center py-8 text-muted-foreground">
                  No suppliers found
                </div>
              ) : (
                <div className="space-y-3 pr-4">
                  {suppliers.map((supplier) => (
                    <Card key={supplier.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{supplier.supplier_name}</span>
                              <Badge variant={supplier.is_active ? "default" : "secondary"} className="text-xs">
                                {supplier.is_active ? "Active" : "Inactive"}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Rep: {supplier.representative_name}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {supplier.location} • {supplier.phone}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="customers" className="mt-4">
            <ScrollArea className="h-[400px]">
              {loading ? (
                <div className="flex items-center justify-center py-8 text-muted-foreground">
                  Loading customers...
                </div>
              ) : customers.length === 0 ? (
                <div className="flex items-center justify-center py-8 text-muted-foreground">
                  No customers found
                </div>
              ) : (
                <div className="space-y-3 pr-4">
                  {customers.map((customer) => (
                    <Card key={customer.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{customer.customer_name}</span>
                              <Badge variant={customer.is_active ? "default" : "secondary"} className="text-xs">
                                {customer.is_active ? "Active" : "Inactive"}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Rep: {customer.representative_name}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {customer.location} • {customer.phone}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

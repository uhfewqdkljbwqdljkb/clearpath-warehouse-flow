import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight, DollarSign, Package, Building2, Layers, TrendingUp, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface VariantValue {
  value: string;
  quantity: number;
  sku?: string;
  subVariants?: {
    attribute: string;
    values: VariantValue[];
  }[];
}

interface Variant {
  attribute: string;
  values: VariantValue[];
}

interface ProductData {
  id: string;
  name: string;
  sku: string | null;
  value: number | null;
  variants: Variant[];
  totalQuantity: number;
  totalValue: number;
}

interface ClientData {
  id: string;
  name: string;
  clientCode: string;
  products: ProductData[];
  totalProducts: number;
  totalQuantity: number;
  totalValue: number;
}

// Calculate quantity from nested variants
const calculateVariantQuantity = (variants: Variant[]): number => {
  if (!variants || variants.length === 0) return 0;
  
  let total = 0;
  for (const variant of variants) {
    if (!variant.values) continue;
    for (const val of variant.values) {
      if (val.subVariants && val.subVariants.length > 0) {
        // Has sub-variants, sum their quantities
        for (const subVar of val.subVariants) {
          for (const subVal of subVar.values) {
            total += subVal.quantity || 0;
          }
        }
      } else {
        // No sub-variants, use this quantity
        total += val.quantity || 0;
      }
    }
  }
  return total;
};

export const InventoryValueDrilldown: React.FC = () => {
  const [clients, setClients] = useState<ClientData[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedClients, setExpandedClients] = useState<Set<string>>(new Set());
  const [expandedProducts, setExpandedProducts] = useState<Set<string>>(new Set());
  const [expandedVariants, setExpandedVariants] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchInventoryData();
  }, []);

  const fetchInventoryData = async () => {
    try {
      // Fetch all companies
      const { data: companies, error: companiesError } = await supabase
        .from('companies')
        .select('id, name, client_code')
        .eq('is_active', true)
        .order('name');

      if (companiesError) throw companiesError;

      // Fetch all products with their values and variants
      const { data: products, error: productsError } = await supabase
        .from('client_products')
        .select('id, name, sku, value, variants, company_id')
        .eq('is_active', true);

      if (productsError) throw productsError;

      // Fetch inventory items for base quantities
      const { data: inventoryItems, error: inventoryError } = await supabase
        .from('inventory_items')
        .select('product_id, quantity, variant_attribute, variant_value');

      if (inventoryError) throw inventoryError;

      // Build client data with aggregated values
      const clientDataMap = new Map<string, ClientData>();

      companies?.forEach(company => {
        clientDataMap.set(company.id, {
          id: company.id,
          name: company.name,
          clientCode: company.client_code || '',
          products: [],
          totalProducts: 0,
          totalQuantity: 0,
          totalValue: 0,
        });
      });

      // Process products
      products?.forEach(product => {
        const client = clientDataMap.get(product.company_id);
        if (!client) return;

        const variants = (product.variants as unknown as Variant[]) || [];
        let totalQuantity = 0;

        // Calculate quantity from variants if they exist
        if (variants.length > 0) {
          totalQuantity = calculateVariantQuantity(variants);
        } else {
          // Sum from inventory_items for non-variant products
          const productInventory = inventoryItems?.filter(i => i.product_id === product.id) || [];
          totalQuantity = productInventory.reduce((sum, item) => sum + (item.quantity || 0), 0);
        }

        const productValue = product.value || 0;
        const totalValue = productValue * totalQuantity;

        const productData: ProductData = {
          id: product.id,
          name: product.name,
          sku: product.sku,
          value: productValue,
          variants,
          totalQuantity,
          totalValue,
        };

        client.products.push(productData);
        client.totalProducts++;
        client.totalQuantity += totalQuantity;
        client.totalValue += totalValue;
      });

      // Convert to array and sort by total value descending
      const clientsArray = Array.from(clientDataMap.values())
        .filter(c => c.totalProducts > 0)
        .sort((a, b) => b.totalValue - a.totalValue);

      setClients(clientsArray);
    } catch (error) {
      console.error('Error fetching inventory data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleClient = (clientId: string) => {
    setExpandedClients(prev => {
      const newSet = new Set(prev);
      if (newSet.has(clientId)) {
        newSet.delete(clientId);
      } else {
        newSet.add(clientId);
      }
      return newSet;
    });
  };

  const toggleProduct = (productId: string) => {
    setExpandedProducts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
      }
      return newSet;
    });
  };

  const toggleVariant = (variantKey: string) => {
    setExpandedVariants(prev => {
      const newSet = new Set(prev);
      if (newSet.has(variantKey)) {
        newSet.delete(variantKey);
      } else {
        newSet.add(variantKey);
      }
      return newSet;
    });
  };

  const grandTotal = clients.reduce((sum, c) => sum + c.totalValue, 0);
  const grandQuantity = clients.reduce((sum, c) => sum + c.totalQuantity, 0);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(value);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              Inventory Value Overview
            </CardTitle>
            <CardDescription>
              Total value across all clients with detailed breakdown
            </CardDescription>
          </div>
          <Badge variant="outline" className="text-lg px-4 py-2">
            <TrendingUp className="h-4 w-4 mr-2" />
            {formatCurrency(grandTotal)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-primary/10 rounded-lg p-4 text-center">
            <div className="text-3xl font-bold text-primary">{formatCurrency(grandTotal)}</div>
            <div className="text-sm text-muted-foreground">Total Inventory Value</div>
          </div>
          <div className="bg-muted rounded-lg p-4 text-center">
            <div className="text-3xl font-bold">{grandQuantity.toLocaleString()}</div>
            <div className="text-sm text-muted-foreground">Total Units</div>
          </div>
          <div className="bg-muted rounded-lg p-4 text-center">
            <div className="text-3xl font-bold">{clients.length}</div>
            <div className="text-sm text-muted-foreground">Clients with Inventory</div>
          </div>
        </div>

        {/* Client List with Drill-down */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm text-muted-foreground px-4 py-2 bg-muted rounded-t-lg font-medium">
            <span>Client</span>
            <div className="flex items-center gap-8">
              <span className="w-20 text-right">Products</span>
              <span className="w-24 text-right">Quantity</span>
              <span className="w-28 text-right">Value</span>
            </div>
          </div>

          {clients.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No inventory data found
            </div>
          ) : (
            clients.map((client) => (
              <Collapsible
                key={client.id}
                open={expandedClients.has(client.id)}
                onOpenChange={() => toggleClient(client.id)}
              >
                <CollapsibleTrigger asChild>
                  <div className="flex items-center justify-between px-4 py-3 bg-card border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      {expandedClients.has(client.id) ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )}
                      <Building2 className="h-4 w-4 text-primary" />
                      <div>
                        <div className="font-medium">{client.name}</div>
                        <div className="text-xs text-muted-foreground">{client.clientCode}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-8">
                      <span className="w-20 text-right text-sm">{client.totalProducts}</span>
                      <span className="w-24 text-right text-sm">{client.totalQuantity.toLocaleString()}</span>
                      <span className="w-28 text-right font-medium text-primary">{formatCurrency(client.totalValue)}</span>
                    </div>
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="ml-8 mt-1 space-y-1">
                    {client.products
                      .sort((a, b) => b.totalValue - a.totalValue)
                      .map((product) => (
                        <Collapsible
                          key={product.id}
                          open={expandedProducts.has(product.id)}
                          onOpenChange={() => toggleProduct(product.id)}
                        >
                          <CollapsibleTrigger asChild>
                            <div className="flex items-center justify-between px-4 py-2 bg-muted/30 border-l-2 border-primary/20 rounded-r-lg cursor-pointer hover:bg-muted/50 transition-colors">
                              <div className="flex items-center gap-3">
                                {product.variants.length > 0 ? (
                                  expandedProducts.has(product.id) ? (
                                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                  )
                                ) : (
                                  <div className="w-4" />
                                )}
                                <Package className="h-4 w-4 text-muted-foreground" />
                                <div>
                                  <div className="text-sm font-medium">{product.name}</div>
                                  <div className="flex items-center gap-2">
                                    {product.sku && (
                                      <Badge variant="outline" className="text-xs">{product.sku}</Badge>
                                    )}
                                    {product.value && product.value > 0 && (
                                      <span className="text-xs text-muted-foreground">@ {formatCurrency(product.value)}/unit</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-8">
                                <span className="w-20 text-right text-sm">
                                  {product.variants.length > 0 && (
                                    <Badge variant="secondary" className="text-xs">
                                      <Layers className="h-3 w-3 mr-1" />
                                      {product.variants.length}
                                    </Badge>
                                  )}
                                </span>
                                <span className="w-24 text-right text-sm">{product.totalQuantity.toLocaleString()}</span>
                                <span className="w-28 text-right text-sm font-medium">{formatCurrency(product.totalValue)}</span>
                              </div>
                            </div>
                          </CollapsibleTrigger>

                          {product.variants.length > 0 && (
                            <CollapsibleContent>
                              <div className="ml-8 mt-1 space-y-1">
                                {product.variants.map((variant, vIdx) => (
                                  <div key={`${product.id}-${variant.attribute}-${vIdx}`} className="space-y-1">
                                    <div className="px-3 py-1 text-xs font-medium text-muted-foreground bg-muted/20 rounded">
                                      {variant.attribute}
                                    </div>
                                    {variant.values?.map((val, valIdx) => {
                                      const variantKey = `${product.id}-${variant.attribute}-${val.value}`;
                                      const hasSubVariants = val.subVariants && val.subVariants.length > 0;
                                      
                                      // Calculate variant value
                                      let variantQty = 0;
                                      if (hasSubVariants) {
                                        for (const subVar of val.subVariants!) {
                                          for (const subVal of subVar.values) {
                                            variantQty += subVal.quantity || 0;
                                          }
                                        }
                                      } else {
                                        variantQty = val.quantity || 0;
                                      }
                                      const variantValue = variantQty * (product.value || 0);

                                      return (
                                        <Collapsible
                                          key={variantKey}
                                          open={expandedVariants.has(variantKey)}
                                          onOpenChange={() => hasSubVariants && toggleVariant(variantKey)}
                                        >
                                          <CollapsibleTrigger asChild>
                                            <div className={cn(
                                              "flex items-center justify-between px-4 py-2 border-l-2 border-muted rounded-r-lg",
                                              hasSubVariants && "cursor-pointer hover:bg-muted/30"
                                            )}>
                                              <div className="flex items-center gap-3">
                                                {hasSubVariants ? (
                                                  expandedVariants.has(variantKey) ? (
                                                    <ChevronDown className="h-3 w-3 text-muted-foreground" />
                                                  ) : (
                                                    <ChevronRight className="h-3 w-3 text-muted-foreground" />
                                                  )
                                                ) : (
                                                  <div className="w-3" />
                                                )}
                                                <span className="text-sm">{val.value}</span>
                                                {val.sku && (
                                                  <Badge variant="outline" className="text-xs">{val.sku}</Badge>
                                                )}
                                              </div>
                                              <div className="flex items-center gap-8">
                                                <span className="w-20" />
                                                <span className="w-24 text-right text-sm text-muted-foreground">
                                                  {variantQty.toLocaleString()}
                                                </span>
                                                <span className="w-28 text-right text-sm text-muted-foreground">
                                                  {formatCurrency(variantValue)}
                                                </span>
                                              </div>
                                            </div>
                                          </CollapsibleTrigger>

                                          {hasSubVariants && (
                                            <CollapsibleContent>
                                              <div className="ml-8 mt-1 space-y-1">
                                                {val.subVariants!.map((subVar, subVarIdx) => (
                                                  <div key={`${variantKey}-${subVar.attribute}-${subVarIdx}`}>
                                                    <div className="px-3 py-1 text-xs font-medium text-muted-foreground bg-muted/10 rounded">
                                                      {subVar.attribute}
                                                    </div>
                                                    {subVar.values?.map((subVal, subValIdx) => {
                                                      const subValue = (subVal.quantity || 0) * (product.value || 0);
                                                      return (
                                                        <div
                                                          key={`${variantKey}-${subVar.attribute}-${subVal.value}-${subValIdx}`}
                                                          className="flex items-center justify-between px-4 py-1 border-l-2 border-muted/50 rounded-r-lg ml-4"
                                                        >
                                                          <div className="flex items-center gap-3">
                                                            <span className="text-xs">{subVal.value}</span>
                                                            {subVal.sku && (
                                                              <Badge variant="outline" className="text-xs">{subVal.sku}</Badge>
                                                            )}
                                                          </div>
                                                          <div className="flex items-center gap-8">
                                                            <span className="w-20" />
                                                            <span className="w-24 text-right text-xs text-muted-foreground">
                                                              {(subVal.quantity || 0).toLocaleString()}
                                                            </span>
                                                            <span className="w-28 text-right text-xs text-muted-foreground">
                                                              {formatCurrency(subValue)}
                                                            </span>
                                                          </div>
                                                        </div>
                                                      );
                                                    })}
                                                  </div>
                                                ))}
                                              </div>
                                            </CollapsibleContent>
                                          )}
                                        </Collapsible>
                                      );
                                    })}
                                  </div>
                                ))}
                              </div>
                            </CollapsibleContent>
                          )}
                        </Collapsible>
                      ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

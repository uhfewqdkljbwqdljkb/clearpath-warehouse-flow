import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Package, Plus, X, ChevronDown, ChevronRight } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface Product {
  id: string;
  name: string;
  sku: string | null;
  variants: any;
  supplier_id?: string | null;
  customer_id?: string | null;
}

interface VariantSelection {
  attribute: string;
  value: string;
  quantity: number;
  subVariants?: SubVariantSelection[];
}

interface SubVariantSelection {
  attribute: string;
  value: string;
  quantity: number;
}

interface CheckOutItemDraft {
  product_id: string;
  product_name: string;
  customer_id?: string;
  customer_name?: string;
  selectedVariants: VariantSelection[];
  noVariantQuantity: number; // For products without variants
}

interface CheckOutItem {
  product_id: string;
  product_name: string;
  variant_attribute?: string;
  variant_value?: string;
  sub_variant_attribute?: string;
  sub_variant_value?: string;
  quantity: number;
  customer_id?: string;
  customer_name?: string;
}

interface InventoryItem {
  product_id: string;
  quantity: number;
  variant_attribute: string | null;
  variant_value: string | null;
}

export const ClientCheckOut: React.FC = () => {
  const navigate = useNavigate();
  const { profile, company } = useAuth();
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [itemDrafts, setItemDrafts] = useState<CheckOutItemDraft[]>([]);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedVariants, setExpandedVariants] = useState<Record<string, boolean>>({});
  
  // B2B-specific state
  const [customers, setCustomers] = useState<any[]>([]);
  const [deliveryDate, setDeliveryDate] = useState('');
  const isB2B = company?.client_type === 'b2b';

  useEffect(() => {
    if (profile?.company_id) {
      fetchProducts();
      fetchInventory();
      if (isB2B) {
        fetchCustomers();
      }
    }
  }, [profile?.company_id, isB2B]);

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

  const fetchInventory = async () => {
    if (!profile?.company_id) return;

    try {
      const { data, error } = await supabase
        .from('inventory_items')
        .select('product_id, quantity, variant_attribute, variant_value')
        .eq('company_id', profile.company_id);

      if (error) throw error;
      setInventory(data || []);
    } catch (error) {
      console.error('Error fetching inventory:', error);
    }
  };

  const fetchProducts = async () => {
    if (!profile?.company_id) return;

    try {
      const { data, error } = await supabase
        .from('client_products')
        .select('id, name, sku, variants, supplier_id, customer_id')
        .eq('company_id', profile.company_id)
        .eq('is_active', true)
        .order('name');

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

  // Get available quantity for a product (base level - no variant)
  const getProductAvailableQuantity = (productId: string): number => {
    // First check for base inventory (no variant)
    const baseInventory = inventory.find(
      i => i.product_id === productId && !i.variant_attribute && !i.variant_value
    );
    if (baseInventory) return baseInventory.quantity;

    // Sum all variant inventory for this product
    const variantTotal = inventory
      .filter(i => i.product_id === productId)
      .reduce((sum, i) => sum + i.quantity, 0);
    return variantTotal;
  };

  // Get available quantity for a specific variant from client_products.variants
  const getVariantAvailableQuantity = (
    productId: string, 
    variantAttr: string, 
    variantVal: string
  ): number => {
    const product = products.find(p => p.id === productId);
    if (!product?.variants || !Array.isArray(product.variants)) return 0;
    
    // Find the variant attribute
    const variant = product.variants.find((v: any) => v.attribute === variantAttr);
    if (!variant?.values) return 0;
    
    // Find the specific value
    const value = variant.values.find((val: any) => val.value === variantVal);
    if (!value) return 0;
    
    // If has sub-variants, sum all sub-variant quantities
    if (value.subVariants && value.subVariants.length > 0) {
      let total = 0;
      for (const subVar of value.subVariants) {
        if (subVar.values) {
          total += subVar.values.reduce((sum: number, sv: any) => sum + (sv.quantity || 0), 0);
        }
      }
      return total;
    }
    
    return value.quantity || 0;
  };

  // Get available quantity for a specific sub-variant
  const getSubVariantAvailableQuantity = (
    productId: string,
    variantAttr: string,
    variantVal: string,
    subVariantAttr: string,
    subVariantVal: string
  ): number => {
    const product = products.find(p => p.id === productId);
    if (!product?.variants || !Array.isArray(product.variants)) return 0;
    
    const variant = product.variants.find((v: any) => v.attribute === variantAttr);
    if (!variant?.values) return 0;
    
    const value = variant.values.find((val: any) => val.value === variantVal);
    if (!value?.subVariants) return 0;
    
    const subVariant = value.subVariants.find((sv: any) => sv.attribute === subVariantAttr);
    if (!subVariant?.values) return 0;
    
    const subValue = subVariant.values.find((sv: any) => sv.value === subVariantVal);
    return subValue?.quantity || 0;
  };

  const addItemDraft = () => {
    setItemDrafts([
      ...itemDrafts,
      {
        product_id: '',
        product_name: '',
        selectedVariants: [],
        noVariantQuantity: 0,
      },
    ]);
  };

  const removeItemDraft = (index: number) => {
    setItemDrafts(itemDrafts.filter((_, i) => i !== index));
  };

  const updateItemProduct = (index: number, productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const customer = isB2B && product.customer_id 
      ? customers.find(c => c.id === product.customer_id) 
      : null;

    const updated = [...itemDrafts];
    updated[index] = {
      product_id: productId,
      product_name: product.name,
      customer_id: product.customer_id || undefined,
      customer_name: customer?.customer_name || undefined,
      selectedVariants: [],
      noVariantQuantity: 0,
    };
    setItemDrafts(updated);
  };

  const getProductVariants = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product || !product.variants || !Array.isArray(product.variants)) return [];
    return product.variants;
  };

  const toggleVariantSelection = (
    itemIndex: number, 
    variantAttr: string, 
    variantVal: string
  ) => {
    const updated = [...itemDrafts];
    const draft = updated[itemIndex];
    const existingIndex = draft.selectedVariants.findIndex(
      sv => sv.attribute === variantAttr && sv.value === variantVal
    );

    if (existingIndex >= 0) {
      // Remove variant
      draft.selectedVariants.splice(existingIndex, 1);
    } else {
      // Add variant
      draft.selectedVariants.push({
        attribute: variantAttr,
        value: variantVal,
        quantity: 0,
        subVariants: [],
      });
    }
    setItemDrafts(updated);
  };

  const updateVariantQuantity = (
    itemIndex: number,
    variantAttr: string,
    variantVal: string,
    quantity: number
  ) => {
    const updated = [...itemDrafts];
    const draft = updated[itemIndex];
    const variant = draft.selectedVariants.find(
      sv => sv.attribute === variantAttr && sv.value === variantVal
    );
    if (variant) {
      variant.quantity = quantity;
    }
    setItemDrafts(updated);
  };

  const toggleSubVariantSelection = (
    itemIndex: number,
    variantAttr: string,
    variantVal: string,
    subAttr: string,
    subVal: string
  ) => {
    const updated = [...itemDrafts];
    const draft = updated[itemIndex];
    const variant = draft.selectedVariants.find(
      sv => sv.attribute === variantAttr && sv.value === variantVal
    );
    
    if (!variant) return;
    
    if (!variant.subVariants) {
      variant.subVariants = [];
    }
    
    const existingIndex = variant.subVariants.findIndex(
      sub => sub.attribute === subAttr && sub.value === subVal
    );

    if (existingIndex >= 0) {
      variant.subVariants.splice(existingIndex, 1);
    } else {
      variant.subVariants.push({
        attribute: subAttr,
        value: subVal,
        quantity: 0,
      });
    }
    setItemDrafts(updated);
  };

  const updateSubVariantQuantity = (
    itemIndex: number,
    variantAttr: string,
    variantVal: string,
    subAttr: string,
    subVal: string,
    quantity: number
  ) => {
    const updated = [...itemDrafts];
    const draft = updated[itemIndex];
    const variant = draft.selectedVariants.find(
      sv => sv.attribute === variantAttr && sv.value === variantVal
    );
    if (!variant || !variant.subVariants) return;
    
    const subVariant = variant.subVariants.find(
      sub => sub.attribute === subAttr && sub.value === subVal
    );
    if (subVariant) {
      subVariant.quantity = quantity;
    }
    setItemDrafts(updated);
  };

  const updateNoVariantQuantity = (index: number, quantity: number) => {
    const updated = [...itemDrafts];
    updated[index].noVariantQuantity = quantity;
    setItemDrafts(updated);
  };

  const isVariantSelected = (itemIndex: number, variantAttr: string, variantVal: string) => {
    return itemDrafts[itemIndex].selectedVariants.some(
      sv => sv.attribute === variantAttr && sv.value === variantVal
    );
  };

  const isSubVariantSelected = (
    itemIndex: number, 
    variantAttr: string, 
    variantVal: string, 
    subAttr: string, 
    subVal: string
  ) => {
    const variant = itemDrafts[itemIndex].selectedVariants.find(
      sv => sv.attribute === variantAttr && sv.value === variantVal
    );
    return variant?.subVariants?.some(
      sub => sub.attribute === subAttr && sub.value === subVal
    ) || false;
  };

  const getSelectedVariantData = (itemIndex: number, variantAttr: string, variantVal: string) => {
    return itemDrafts[itemIndex].selectedVariants.find(
      sv => sv.attribute === variantAttr && sv.value === variantVal
    );
  };

  // Convert draft items to final checkout items
  const buildCheckOutItems = (): CheckOutItem[] => {
    const items: CheckOutItem[] = [];

    for (const draft of itemDrafts) {
      if (!draft.product_id) continue;

      const variants = getProductVariants(draft.product_id);
      
      if (variants.length === 0) {
        // No variants - use noVariantQuantity
        if (draft.noVariantQuantity > 0) {
          items.push({
            product_id: draft.product_id,
            product_name: draft.product_name,
            quantity: draft.noVariantQuantity,
            customer_id: draft.customer_id,
            customer_name: draft.customer_name,
          });
        }
      } else {
        // Has variants - process selected variants
        for (const sv of draft.selectedVariants) {
          if (sv.subVariants && sv.subVariants.length > 0) {
            // Has sub-variants selected
            for (const sub of sv.subVariants) {
              if (sub.quantity > 0) {
                items.push({
                  product_id: draft.product_id,
                  product_name: draft.product_name,
                  variant_attribute: sv.attribute,
                  variant_value: sv.value,
                  sub_variant_attribute: sub.attribute,
                  sub_variant_value: sub.value,
                  quantity: sub.quantity,
                  customer_id: draft.customer_id,
                  customer_name: draft.customer_name,
                });
              }
            }
          } else if (sv.quantity > 0) {
            // No sub-variants, use variant quantity
            items.push({
              product_id: draft.product_id,
              product_name: draft.product_name,
              variant_attribute: sv.attribute,
              variant_value: sv.value,
              quantity: sv.quantity,
              customer_id: draft.customer_id,
              customer_name: draft.customer_name,
            });
          }
        }
      }
    }

    return items;
  };

  const handleSubmit = async () => {
    const checkOutItems = buildCheckOutItems();

    if (checkOutItems.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one item with quantity greater than 0",
        variant: "destructive",
      });
      return;
    }

    if (!profile?.company_id) return;

    setIsSubmitting(true);
    try {
      const { data: requestNumber, error: fnError } = await supabase
        .rpc('generate_check_out_request_number');

      if (fnError) throw fnError;

      const requestData: any = {
        company_id: profile.company_id,
        request_number: requestNumber,
        requested_items: checkOutItems as any,
        notes: notes || null,
        requested_by: profile.id,
        status: 'pending',
        request_type: isB2B ? 'b2b_shipment' : 'standard',
        delivery_date: isB2B && deliveryDate ? deliveryDate : null,
      };

      const { error } = await supabase
        .from('check_out_requests')
        .insert([requestData]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Check-out request submitted successfully",
      });

      navigate('/client/requests');
    } catch (error) {
      console.error('Error submitting check-out request:', error);
      toast({
        title: "Error",
        description: "Failed to submit check-out request",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleVariantExpanded = (key: string) => {
    setExpandedVariants(prev => ({ ...prev, [key]: !prev[key] }));
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate('/client/products')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Products
        </Button>
      </div>

      <div>
        <h1 className="text-3xl font-bold text-foreground">Check Out Products</h1>
        <p className="text-muted-foreground">Submit a request to remove products from your inventory</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select Products</CardTitle>
          <CardDescription>Choose products and variants to check out. You can select multiple variants per product.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {isB2B && (
            <div className="p-4 border rounded-lg bg-muted/50 space-y-2">
              <h3 className="font-medium text-sm">B2B Check-Out</h3>
              <p className="text-xs text-muted-foreground">
                Products will be shipped to their designated customers (assigned at check-in).
              </p>
              <div className="space-y-2">
                <Label>Delivery Date (Optional)</Label>
                <Input 
                  type="date" 
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                />
              </div>
            </div>
          )}
          
          <Button onClick={addItemDraft}>
            <Plus className="h-4 w-4 mr-2" />
            Add Item
          </Button>

          {itemDrafts.length === 0 ? (
            <div className="text-center py-12">
              <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No items added yet. Click "Add Item" to get started.</p>
            </div>
          ) : (
            itemDrafts.map((draft, itemIndex) => {
              const variants = getProductVariants(draft.product_id);
              const hasVariants = variants.length > 0;

              return (
                <Card key={itemIndex} className="border-2">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                    <CardTitle className="text-base">Item {itemIndex + 1}</CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeItemDraft(itemIndex)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label>Product *</Label>
                      <Select
                        value={draft.product_id}
                        onValueChange={(value) => updateItemProduct(itemIndex, value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a product" />
                        </SelectTrigger>
                        <SelectContent>
                          {products.map((product) => (
                            <SelectItem key={product.id} value={product.id}>
                              {product.name} {product.sku && `(${product.sku})`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {isB2B && draft.product_id && (
                      <div className="p-2 bg-muted/30 rounded border">
                        <Label className="text-xs text-muted-foreground">Ships to Customer</Label>
                        <p className="text-sm font-medium">
                          {draft.customer_name || 'No customer assigned'}
                        </p>
                      </div>
                    )}

                    {draft.product_id && !hasVariants && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label>Quantity *</Label>
                          <span className="text-xs text-muted-foreground">
                            Available: <span className="font-medium text-foreground">{getProductAvailableQuantity(draft.product_id)}</span>
                          </span>
                        </div>
                        <Input
                          type="number"
                          min="1"
                          max={getProductAvailableQuantity(draft.product_id)}
                          placeholder="Enter quantity"
                          value={draft.noVariantQuantity || ''}
                          onChange={(e) => updateNoVariantQuantity(itemIndex, parseInt(e.target.value) || 0)}
                        />
                      </div>
                    )}

                    {draft.product_id && hasVariants && (
                      <div className="space-y-3">
                        <Label>Select Variants to Check Out</Label>
                        <p className="text-xs text-muted-foreground">
                          Check the variants you want to include and enter quantities for each.
                        </p>
                        
                        <div className="space-y-2 border rounded-lg p-3 bg-muted/20">
                          {variants.map((variant: any) => (
                            <div key={variant.attribute} className="space-y-2">
                              <p className="text-sm font-medium text-muted-foreground">{variant.attribute}</p>
                              {variant.values?.map((val: any) => {
                                const isSelected = isVariantSelected(itemIndex, variant.attribute, val.value);
                                const selectedData = getSelectedVariantData(itemIndex, variant.attribute, val.value);
                                const hasSubVariants = val.subVariants && val.subVariants.length > 0;
                                const variantKey = `${itemIndex}-${variant.attribute}-${val.value}`;
                                const isExpanded = expandedVariants[variantKey];

                                return (
                                  <div key={val.value} className="ml-2">
                                    <div className="flex items-center gap-3 py-2 px-3 rounded-md hover:bg-muted/50">
                                      <Checkbox
                                        id={`variant-${itemIndex}-${variant.attribute}-${val.value}`}
                                        checked={isSelected}
                                        onCheckedChange={() => toggleVariantSelection(itemIndex, variant.attribute, val.value)}
                                      />
                                      <label
                                        htmlFor={`variant-${itemIndex}-${variant.attribute}-${val.value}`}
                                        className="flex-1 text-sm cursor-pointer"
                                      >
                                        {val.value}
                                      </label>
                                      
                                      <span className="text-xs text-muted-foreground px-2 py-0.5 bg-muted rounded">
                                        {getVariantAvailableQuantity(draft.product_id, variant.attribute, val.value)} available
                                      </span>
                                      
                                      {isSelected && !hasSubVariants && (
                                        <Input
                                          type="number"
                                          min="1"
                                          placeholder="Qty"
                                          className="w-24 h-8"
                                          value={selectedData?.quantity || ''}
                                          onClick={(e) => e.stopPropagation()}
                                          onChange={(e) => updateVariantQuantity(
                                            itemIndex, 
                                            variant.attribute, 
                                            val.value, 
                                            parseInt(e.target.value) || 0
                                          )}
                                        />
                                      )}

                                      {isSelected && hasSubVariants && (
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => toggleVariantExpanded(variantKey)}
                                        >
                                          {isExpanded ? (
                                            <ChevronDown className="h-4 w-4" />
                                          ) : (
                                            <ChevronRight className="h-4 w-4" />
                                          )}
                                        </Button>
                                      )}
                                    </div>

                                    {/* Sub-variants */}
                                    {isSelected && hasSubVariants && isExpanded && (
                                      <div className="ml-8 mt-2 space-y-1 border-l-2 border-muted pl-4">
                                        {val.subVariants.map((subVar: any) => (
                                          <div key={subVar.attribute} className="space-y-1">
                                            <p className="text-xs font-medium text-muted-foreground">{subVar.attribute}</p>
                                            {subVar.values?.map((subVal: any) => {
                                              const isSubSelected = isSubVariantSelected(
                                                itemIndex, 
                                                variant.attribute, 
                                                val.value, 
                                                subVar.attribute, 
                                                subVal.value
                                              );
                                              const subData = selectedData?.subVariants?.find(
                                                s => s.attribute === subVar.attribute && s.value === subVal.value
                                              );

                                              return (
                                                <div 
                                                  key={subVal.value} 
                                                  className="flex items-center gap-3 py-1 px-2 rounded hover:bg-muted/30"
                                                >
                                                  <Checkbox
                                                    id={`sub-${itemIndex}-${variant.attribute}-${val.value}-${subVar.attribute}-${subVal.value}`}
                                                    checked={isSubSelected}
                                                    onCheckedChange={() => toggleSubVariantSelection(
                                                      itemIndex,
                                                      variant.attribute,
                                                      val.value,
                                                      subVar.attribute,
                                                      subVal.value
                                                    )}
                                                  />
                                                  <label
                                                    htmlFor={`sub-${itemIndex}-${variant.attribute}-${val.value}-${subVar.attribute}-${subVal.value}`}
                                                    className="text-sm cursor-pointer"
                                                  >
                                                    {subVal.value}
                                                  </label>
                                                  
                                                  <span className="text-xs text-muted-foreground px-2 py-0.5 bg-muted rounded flex-shrink-0">
                                                    {getSubVariantAvailableQuantity(
                                                      draft.product_id,
                                                      variant.attribute,
                                                      val.value,
                                                      subVar.attribute,
                                                      subVal.value
                                                    )} available
                                                  </span>
                                                  
                                                  {isSubSelected && (
                                                    <Input
                                                      type="number"
                                                      min="1"
                                                      placeholder="Qty"
                                                      className="w-24 h-8"
                                                      value={subData?.quantity || ''}
                                                      onClick={(e) => e.stopPropagation()}
                                                      onChange={(e) => updateSubVariantQuantity(
                                                        itemIndex,
                                                        variant.attribute,
                                                        val.value,
                                                        subVar.attribute,
                                                        subVal.value,
                                                        parseInt(e.target.value) || 0
                                                      )}
                                                    />
                                                  )}
                                                </div>
                                              );
                                            })}
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}

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
              {isSubmitting ? 'Submitting...' : 'Submit Check-Out Request'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useIntegration } from '@/contexts/IntegrationContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, Package, MoreVertical, X, Upload, PackageOpen, RefreshCw } from 'lucide-react';
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
import { Variant, calculateNestedVariantQuantity, getVariantBreakdown, hasNestedVariants } from '@/types/variants';
import { VariantQuantityDisplay } from '@/components/VariantQuantityDisplay';
import { ReassignProductDialog } from '@/components/ReassignProductDialog';

// Recursive component to display variant values including nested subVariants
const VariantValuesDisplay: React.FC<{ 
  values: any[]; 
  depth: number;
  editable?: boolean;
  onUpdate?: (values: any[]) => void;
}> = ({ values, depth, editable = false, onUpdate }) => {
  if (!values || values.length === 0) return null;

  const handleValueUpdate = (index: number, field: string, newValue: any) => {
    if (!onUpdate) return;
    const updated = [...values];
    updated[index] = { ...updated[index], [field]: newValue };
    onUpdate(updated);
  };

  const handleSubVariantsUpdate = (valueIndex: number, subVariantIndex: number, newSubVariantValues: any[]) => {
    if (!onUpdate) return;
    const updated = [...values];
    updated[valueIndex].subVariants[subVariantIndex].values = newSubVariantValues;
    onUpdate(updated);
  };
  
  return (
    <div className={`space-y-2 ${depth > 0 ? 'ml-4 pl-3 border-l border-border' : ''}`}>
      {values.map((val: any, vIndex: number) => (
        <div key={vIndex}>
          <div className="flex justify-between items-center text-sm gap-2">
            <span className="font-medium">{val.value}</span>
            {(!val.subVariants || val.subVariants.length === 0) && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <span>Qty: {val.quantity}</span>
                {editable ? (
                  <div className="flex items-center gap-1">
                    <span className="text-amber-600 dark:text-amber-400">Min:</span>
                    <Input
                      type="number"
                      min="0"
                      value={val.minimumQuantity || 0}
                      onChange={(e) => handleValueUpdate(vIndex, 'minimumQuantity', parseInt(e.target.value) || 0)}
                      className="w-16 h-7 text-sm border-amber-300 dark:border-amber-700"
                    />
                  </div>
                ) : (
                  val.minimumQuantity > 0 && (
                    <span className="text-amber-600 dark:text-amber-400">Min: {val.minimumQuantity}</span>
                  )
                )}
              </div>
            )}
          </div>
          {val.subVariants && val.subVariants.length > 0 && (
            <div className="mt-1">
              {val.subVariants.map((subVariant: any, svIndex: number) => (
                <div key={svIndex} className="mt-1">
                  <div className="text-xs font-medium text-muted-foreground mb-1">{subVariant.attribute}:</div>
                  <VariantValuesDisplay 
                    values={subVariant.values} 
                    depth={depth + 1}
                    editable={editable}
                    onUpdate={(newVals) => handleSubVariantsUpdate(vIndex, svIndex, newVals)}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

// Helper to merge variants coming from check-ins into a product's configured variants
// - merges by attribute/value (case-insensitive)
// - idempotent: never double-counts on repeated syncs (uses max quantity)
const mergeVariants = (existingVariants: any[], newVariants: any[]): any[] => {
  if (!newVariants || newVariants.length === 0) return existingVariants || [];
  if (!existingVariants || existingVariants.length === 0) return newVariants;

  const merged = JSON.parse(JSON.stringify(existingVariants));

  for (const newVariant of newVariants) {
    const existingVariant = merged.find(
      (v: any) => v.attribute?.toLowerCase().trim() === newVariant.attribute?.toLowerCase().trim()
    );

    if (existingVariant) {
      for (const newValue of newVariant.values || []) {
        const existingValue = existingVariant.values?.find(
          (v: any) => v.value?.toLowerCase().trim() === newValue.value?.toLowerCase().trim()
        );

        if (existingValue) {
          // Use max so opening the dialog repeatedly doesn't inflate quantities
          existingValue.quantity = Math.max(existingValue.quantity || 0, newValue.quantity || 0);
          if (newValue.subVariants && newValue.subVariants.length > 0) {
            existingValue.subVariants = mergeVariants(existingValue.subVariants || [], newValue.subVariants);
          }
        } else {
          existingVariant.values = existingVariant.values || [];
          existingVariant.values.push(JSON.parse(JSON.stringify(newValue)));
        }
      }
    } else {
      merged.push(JSON.parse(JSON.stringify(newVariant)));
    }
  }

  return merged;
};

interface Product {
  id: string;
  name: string;
  sku: string | null;
  variants: any;
  is_active: boolean;
  created_at: string;
  minimum_quantity?: number;
  value?: number;
}

interface InventoryData {
  [productId: string]: number;
}

interface InventoryRow {
  id: string;
  product_id: string;
  quantity: number;
  location_id: string | null;
  variant_attribute: string | null;
}

export const ClientProducts: React.FC = () => {
  const navigate = useNavigate();
  const { profile, company } = useAuth();
  const { logActivity } = useIntegration();
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [inventoryData, setInventoryData] = useState<InventoryData>({});
  const [inventoryRows, setInventoryRows] = useState<InventoryRow[]>([]);
  const reconciledInventoryIdsRef = useRef<Set<string>>(new Set());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [productName, setProductName] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [quantity, setQuantity] = useState(0);
  const [minimumQuantity, setMinimumQuantity] = useState(0);
  const [productValue, setProductValue] = useState(0);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [companyInfo, setCompanyInfo] = useState<{ name: string; client_code: string; client_type: string } | null>(null);
  const [showReassignDialog, setShowReassignDialog] = useState(false);
  const [editMinQuantity, setEditMinQuantity] = useState<number>(0);
  const [isSavingMinQuantity, setIsSavingMinQuantity] = useState(false);
  const [editVariants, setEditVariants] = useState<any[]>([]);
  const [isSavingVariants, setIsSavingVariants] = useState(false);
  const [editValue, setEditValue] = useState<number>(0);
  const [isSavingValue, setIsSavingValue] = useState(false);

  useEffect(() => {
    if (profile?.company_id) {
      fetchProducts();
      fetchCompanyInfo();
      fetchInventory();
      logActivity('products_access', 'User accessed products page', {
        timestamp: new Date().toISOString()
      });
    }
  }, [profile?.company_id]);

  const fetchCompanyInfo = async () => {
    // Use company from auth context instead of direct query (more secure)
    if (company) {
      setCompanyInfo({
        name: company.name,
        client_code: company.client_code,
        client_type: company.client_type
      });
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

  const fetchInventory = async () => {
    if (!profile?.company_id) return;

    try {
      const { data, error } = await supabase
        .from('inventory_items')
        .select('id, product_id, quantity, location_id, variant_attribute')
        .eq('company_id', profile.company_id);

      if (error) throw error;
      setInventoryRows((data as InventoryRow[]) || []);
    } catch (error) {
      console.error('Error fetching inventory:', error);
    }
  };

  useEffect(() => {
    // Aggregate quantities by product_id
    const inventoryMap: InventoryData = {};
    inventoryRows.forEach((item) => {
      if (inventoryMap[item.product_id]) {
        inventoryMap[item.product_id] += item.quantity;
      } else {
        inventoryMap[item.product_id] = item.quantity;
      }
    });
    setInventoryData(inventoryMap);
  }, [inventoryRows]);

  useEffect(() => {
    // One-time reconciliation for older approvals that created inventory from only the new check-in quantity.
    // If a product has a base inventory row but its configured variant quantities are higher, we treat
    // those variant quantities as the pre-existing stock and add them to the inventory row.
    if (!profile?.company_id) return;
    if (products.length === 0) return;
    if (inventoryRows.length === 0) return;

    const baseRowsByProductId = new Map<string, InventoryRow>();
    const hasVariantLevelInventory = new Set<string>();

    for (const row of inventoryRows) {
      if (row.location_id !== null) continue;
      if (row.variant_attribute) hasVariantLevelInventory.add(row.product_id);
      if (!row.variant_attribute && !baseRowsByProductId.has(row.product_id)) {
        baseRowsByProductId.set(row.product_id, row);
      }
    }

    const reconcile = async () => {
      for (const product of products) {
        const baseRow = baseRowsByProductId.get(product.id);
        if (!baseRow) continue;
        if (hasVariantLevelInventory.has(product.id)) continue;
        if (reconciledInventoryIdsRef.current.has(baseRow.id)) continue;

        let variantsTotal = 0;
        if (product.variants && Array.isArray(product.variants) && product.variants.length > 0) {
          variantsTotal = calculateNestedVariantQuantity(product.variants);
        }

        if (variantsTotal <= 0) continue;
        if (baseRow.quantity >= variantsTotal) continue;

        reconciledInventoryIdsRef.current.add(baseRow.id);
        const correctedQuantity = baseRow.quantity + variantsTotal;

        const { error } = await supabase
          .from('inventory_items')
          .update({
            quantity: correctedQuantity,
            last_updated: new Date().toISOString(),
          })
          .eq('id', baseRow.id);

        if (error) {
          console.error('Error reconciling inventory quantity:', error);
          reconciledInventoryIdsRef.current.delete(baseRow.id);
          continue;
        }

        setInventoryRows((prev) =>
          prev.map((r) => (r.id === baseRow.id ? { ...r, quantity: correctedQuantity } : r))
        );
      }
    };

    void reconcile();
  }, [profile?.company_id, products, inventoryRows]);

  const getProductQuantity = (product: Product) => {
    const inventoryTotal = inventoryData[product.id] ?? 0;

    const hasVariantStructure =
      !!product.variants && Array.isArray(product.variants) && product.variants.length > 0;

    let variantsTotal = 0;
    let variantQuantities: { [key: string]: number } | null = null;

    if (hasVariantStructure) {
      // Use nested variant calculation
      variantsTotal = calculateNestedVariantQuantity(product.variants);
      variantQuantities = getVariantBreakdown(product.variants);
    }

    // For products with variants, the displayed total should match the sum of variant quantities.
    // For products without variants, use inventory_items when available (fallback to 0).
    const total = hasVariantStructure ? variantsTotal : inventoryTotal;

    return {
      total,
      variants: variantQuantities,
      hasVariants: !!variantQuantities && Object.keys(variantQuantities).length > 0,
      hasNestedVariants: hasNestedVariants(product.variants),
    };
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (product.sku && product.sku.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getVariantCount = (variants: any) => {
    if (!variants || !Array.isArray(variants)) return 0;
    
    // Count leaf values (values without sub-variants)
    const countLeafValues = (values: any[]): number => {
      let count = 0;
      for (const val of values) {
        if (val.subVariants && val.subVariants.length > 0) {
          for (const subVar of val.subVariants) {
            count += countLeafValues(subVar.values);
          }
        } else {
          count++;
        }
      }
      return count;
    };
    
    return variants.reduce((total: number, variant: any) => {
      if (variant.values && Array.isArray(variant.values)) {
        return total + countLeafValues(variant.values);
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
          minimum_quantity: minimumQuantity,
          value: productValue || null,
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
    setMinimumQuantity(0);
    setProductValue(0);
  };

  const handleViewDetails = async (product: Product) => {
    // Fetch fresh product data from database to get latest variants
    const { data: freshProduct, error } = await supabase
      .from('client_products')
      .select('*')
      .eq('id', product.id)
      .single();

    const baseProduct = (!error && freshProduct ? (freshProduct as Product) : product) as Product;
    let nextProduct: Product = baseProduct;

    // Auto-sync missing variants from approved check-ins (fixes "approved size but not showing")
    if (profile?.company_id) {
      try {
        const normalize = (val: unknown) => String(val ?? '').trim().toLowerCase();

        const { data: approvedRequests, error: reqError } = await supabase
          .from('check_in_requests')
          .select('requested_products, amended_products, was_amended, created_at')
          .eq('company_id', profile.company_id)
          .eq('status', 'approved')
          .order('created_at', { ascending: false })
          .limit(50);

        if (reqError) throw reqError;

        let mergedVariants: any[] = Array.isArray(baseProduct.variants) ? baseProduct.variants : [];
        const originalJson = JSON.stringify(mergedVariants);

        for (const req of approvedRequests || []) {
          const productsToScan = (req as any).was_amended && (req as any).amended_products
            ? (req as any).amended_products
            : (req as any).requested_products;

          if (!Array.isArray(productsToScan)) continue;

          for (const reqProduct of productsToScan) {
            const matchesId =
              reqProduct?.existingProductId &&
              String(reqProduct.existingProductId) === String(baseProduct.id);
            const matchesName = !matchesId && normalize(reqProduct?.name) === normalize(baseProduct.name);

            if (!matchesId && !matchesName) continue;
            if (!Array.isArray(reqProduct?.variants) || reqProduct.variants.length === 0) continue;

            mergedVariants = mergeVariants(mergedVariants, reqProduct.variants);
          }
        }

        const mergedJson = JSON.stringify(mergedVariants);
        if (mergedJson !== originalJson) {
          const { error: updateError } = await supabase
            .from('client_products')
            .update({ variants: mergedVariants })
            .eq('id', baseProduct.id);

          if (updateError) {
            console.error('Error syncing product variants:', updateError);
            toast({
              title: 'Could not sync variants',
              description: 'We updated the view, but saving to the product failed.',
              variant: 'destructive',
            });
          }

          nextProduct = { ...baseProduct, variants: mergedVariants };
          setProducts((prev) => prev.map((p) => (p.id === baseProduct.id ? { ...p, variants: mergedVariants } : p)));
        }
      } catch (syncError) {
        console.error('Error syncing variants from check-ins:', syncError);
      }
    }

    setSelectedProduct(nextProduct);
    setEditMinQuantity(nextProduct.minimum_quantity || 0);
    setEditValue(nextProduct.value || 0);
    setEditVariants(nextProduct.variants && Array.isArray(nextProduct.variants) ? JSON.parse(JSON.stringify(nextProduct.variants)) : []);
    setIsViewDialogOpen(true);
  };

  const handleSaveVariantMinQuantities = async () => {
    if (!selectedProduct) return;
    
    setIsSavingVariants(true);
    try {
      const { error } = await supabase
        .from('client_products')
        .update({ variants: editVariants })
        .eq('id', selectedProduct.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Variant minimum quantities updated successfully",
      });

      // Update local state
      setSelectedProduct({ ...selectedProduct, variants: editVariants });
      fetchProducts();
    } catch (error) {
      console.error('Error updating variant minimum quantities:', error);
      toast({
        title: "Error",
        description: "Failed to update variant minimum quantities",
        variant: "destructive",
      });
    } finally {
      setIsSavingVariants(false);
    }
  };

  const handleSaveMinQuantity = async () => {
    if (!selectedProduct) return;
    
    setIsSavingMinQuantity(true);
    try {
      const { error } = await supabase
        .from('client_products')
        .update({ minimum_quantity: editMinQuantity })
        .eq('id', selectedProduct.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Minimum quantity updated successfully",
      });

      // Update local state
      setSelectedProduct({ ...selectedProduct, minimum_quantity: editMinQuantity });
      fetchProducts();
    } catch (error) {
      console.error('Error updating minimum quantity:', error);
      toast({
        title: "Error",
        description: "Failed to update minimum quantity",
        variant: "destructive",
      });
    } finally {
      setIsSavingMinQuantity(false);
    }
  };

  const handleSaveValue = async () => {
    if (!selectedProduct) return;
    
    setIsSavingValue(true);
    try {
      const { error } = await supabase
        .from('client_products')
        .update({ value: editValue || null })
        .eq('id', selectedProduct.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Product value updated successfully",
      });

      // Update local state
      setSelectedProduct({ ...selectedProduct, value: editValue });
      fetchProducts();
    } catch (error) {
      console.error('Error updating product value:', error);
      toast({
        title: "Error",
        description: "Failed to update product value",
        variant: "destructive",
      });
    } finally {
      setIsSavingValue(false);
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
          {companyInfo?.client_type === 'b2b' && (
            <Button variant="outline" onClick={() => setShowReassignDialog(true)}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Reassign Products
            </Button>
          )}
          <Button variant="outline" onClick={() => navigate('/client/check-out')}>
            <PackageOpen className="h-4 w-4 mr-2" />
            Check Out Products
          </Button>
          <Button onClick={() => navigate('/client/check-in')}>
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
                  <TableHead>Quantity</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Variants</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => {
                  const quantityInfo = getProductQuantity(product);
                  return (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell>
                        <code className="text-sm bg-muted px-2 py-1 rounded">
                          {product.sku || 'N/A'}
                        </code>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">{quantityInfo.total}</div>
                          {product.minimum_quantity && product.minimum_quantity > 0 && quantityInfo.total <= product.minimum_quantity && (
                            <Badge variant="destructive" className="text-xs">
                              Low Stock
                            </Badge>
                          )}
                          {product.minimum_quantity && product.minimum_quantity > 0 && quantityInfo.total > product.minimum_quantity && quantityInfo.total <= product.minimum_quantity * 1.2 && (
                            <Badge variant="outline" className="text-xs border-yellow-500 text-yellow-600">
                              Stock Warning
                            </Badge>
                          )}
                          {quantityInfo.hasVariants && (
                            <div className="text-xs text-muted-foreground mt-1">
                              {Object.entries(quantityInfo.variants || {}).map(([key, qty]) => (
                                <div key={key}>{key}: {qty}</div>
                              ))}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {product.value ? (
                          <span className="font-medium text-green-600">${product.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
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
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12">
              <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No Products Found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm ? 'No products match your search criteria.' : 'Submit a check-in request to add products to your inventory.'}
              </p>
              <Button onClick={() => navigate('/client/check-in')}>
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

            <div className="space-y-2">
              <Label htmlFor="minimumQuantity">
                Minimum Quantity (Low Stock Alert)
              </Label>
              <Input
                id="minimumQuantity"
                type="number"
                min="0"
                value={minimumQuantity}
                onChange={(e) => setMinimumQuantity(parseInt(e.target.value) || 0)}
                placeholder="Set minimum stock level"
              />
              <p className="text-xs text-muted-foreground">
                You'll be notified when stock falls below this level
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="productValue">
                Product Value ($)
              </Label>
              <Input
                id="productValue"
                type="number"
                min="0"
                step="0.01"
                value={productValue || ''}
                onChange={(e) => setProductValue(parseFloat(e.target.value) || 0)}
                placeholder="Enter dollar value"
              />
              <p className="text-xs text-muted-foreground">
                Assign a dollar value to this product
              </p>
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

              <div className="border rounded-lg p-4 bg-muted/30">
                <Label className="text-muted-foreground">Minimum Stock Level (Low Stock Alert)</Label>
                <div className="flex items-center gap-3 mt-2">
                  <Input
                    type="number"
                    min="0"
                    value={editMinQuantity}
                    onChange={(e) => setEditMinQuantity(parseInt(e.target.value) || 0)}
                    className="w-32"
                  />
                  <Button 
                    size="sm" 
                    onClick={handleSaveMinQuantity}
                    disabled={isSavingMinQuantity || editMinQuantity === (selectedProduct.minimum_quantity || 0)}
                  >
                    {isSavingMinQuantity ? 'Saving...' : 'Save'}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  You'll be notified when stock falls below this level
                </p>
              </div>

              <div className="border rounded-lg p-4 bg-muted/30">
                <Label className="text-muted-foreground">Product Value ($)</Label>
                <div className="flex items-center gap-3 mt-2">
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={editValue || ''}
                    onChange={(e) => setEditValue(parseFloat(e.target.value) || 0)}
                    className="w-32"
                    placeholder="0.00"
                  />
                  <Button 
                    size="sm" 
                    onClick={handleSaveValue}
                    disabled={isSavingValue || editValue === (selectedProduct.value || 0)}
                  >
                    {isSavingValue ? 'Saving...' : 'Save'}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Dollar value assigned to this product
                </p>
              </div>

              {editVariants && editVariants.length > 0 && (
                <div className="border rounded-lg p-4 bg-muted/30">
                  <div className="flex items-center justify-between mb-3">
                    <Label className="text-muted-foreground">Variant Minimum Stock Levels</Label>
                    <Button 
                      size="sm" 
                      onClick={handleSaveVariantMinQuantities}
                      disabled={isSavingVariants || JSON.stringify(editVariants) === JSON.stringify(selectedProduct.variants)}
                    >
                      {isSavingVariants ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">
                    Set minimum stock levels for each variant to receive low stock alerts
                  </p>
                  <div className="space-y-3">
                    {editVariants.map((variant: any, index: number) => (
                      <div key={index} className="border rounded-lg p-3 bg-background">
                        <div className="font-medium mb-2">{variant.attribute}</div>
                        <VariantValuesDisplay 
                          values={variant.values} 
                          depth={0}
                          editable={true}
                          onUpdate={(newValues) => {
                            const updated = [...editVariants];
                            updated[index].values = newValues;
                            setEditVariants(updated);
                          }}
                        />
                        {variant.sku && (
                          <div className="mt-2 text-xs text-muted-foreground">
                            SKU: <code className="bg-muted px-1 py-0.5 rounded">{variant.sku}</code>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          <div className="flex justify-between gap-3">
            <Button 
              variant="outline" 
              onClick={() => {
                setIsViewDialogOpen(false);
                navigate('/client/check-in');
              }}
            >
              <Package className="h-4 w-4 mr-2" />
              Check In More
            </Button>
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

      {/* Reassign Products Dialog (B2B only) */}
      {profile?.company_id && companyInfo?.client_type === 'b2b' && (
        <ReassignProductDialog
          open={showReassignDialog}
          onOpenChange={setShowReassignDialog}
          companyId={profile.company_id}
          onReassignComplete={fetchProducts}
        />
      )}
    </div>
  );
};

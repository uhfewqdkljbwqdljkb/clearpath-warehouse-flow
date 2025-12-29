import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { AlertTriangle, CheckCircle2, Trash2, Edit2, RefreshCw, Database, Info } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

interface ProblematicProduct {
  id: string;
  company_id: string;
  company_name: string;
  name: string;
  sku: string | null;
  variants: any;
  issue_type: 'empty_name' | 'malformed_variants' | 'empty_variants';
}

interface CleanupStats {
  total_products: number;
  empty_names: number;
  empty_variants: number;
  malformed_variants: number;
}

interface ClientIssueStats {
  company_id: string;
  company_name: string;
  empty_names: number;
  malformed_variants: number;
  total_issues: number;
  severity: 'critical' | 'warning' | 'info';
}

export const DataCleanup: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<CleanupStats | null>(null);
  const [problematicProducts, setProblematicProducts] = useState<ProblematicProduct[]>([]);
  const [clientStats, setClientStats] = useState<ClientIssueStats[]>([]);
  const [selectedCompanyFilter, setSelectedCompanyFilter] = useState<string>('all');
  const [selectedProduct, setSelectedProduct] = useState<ProblematicProduct | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchCleanupStats();
  }, []);

  const fetchCleanupStats = async () => {
    setLoading(true);
    try {
      // Get overall stats
      const { data: statsData, error: statsError } = await supabase
        .from('client_products')
        .select('id, name, variants, company_id');

      if (statsError) throw statsError;

      const products = statsData || [];
      const emptyNames = products.filter(p => !p.name || p.name.trim() === '');
      const emptyVariants = products.filter(p => {
        if (!p.variants) return false;
        return JSON.stringify(p.variants) === '[]';
      });
      const malformedVariants = products.filter(p => {
        if (!p.variants || !Array.isArray(p.variants)) return false;
        const variantsStr = JSON.stringify(p.variants);
        return variantsStr.includes('"attribute":""') || 
               variantsStr.includes('"value":""') ||
               p.variants.some((v: any) => v && Object.keys(v).length === 0);
      });

      setStats({
        total_products: products.length,
        empty_names: emptyNames.length,
        empty_variants: emptyVariants.length,
        malformed_variants: malformedVariants.length,
      });

      // Fetch detailed problematic products with company names
      const { data: detailedProducts, error: detailedError } = await supabase
        .from('client_products')
        .select(`
          id,
          company_id,
          name,
          sku,
          variants,
          companies!inner(name)
        `)
        .or('name.is.null,name.eq.');

      if (detailedError) throw detailedError;

      const problematic: ProblematicProduct[] = [];

      // Add products with empty names
      for (const p of detailedProducts || []) {
        problematic.push({
          id: p.id,
          company_id: p.company_id,
          company_name: (p.companies as any)?.name || 'Unknown',
          name: p.name || '',
          sku: p.sku,
          variants: p.variants,
          issue_type: 'empty_name',
        });
      }

      // Fetch products with malformed variants separately
      const { data: allProducts, error: allError } = await supabase
        .from('client_products')
        .select(`
          id,
          company_id,
          name,
          sku,
          variants,
          companies!inner(name)
        `);

      if (allError) throw allError;

      for (const p of allProducts || []) {
        if (!p.variants) continue;
        
        const variantsStr = JSON.stringify(p.variants);
        const hasEmptyAttribute = variantsStr.includes('"attribute":""');
        const hasEmptyValue = variantsStr.includes('"value":""');
        const hasEmptyObject = Array.isArray(p.variants) && 
          p.variants.some((v: any) => v && typeof v === 'object' && Object.keys(v).length === 0);

        if (hasEmptyAttribute || hasEmptyValue || hasEmptyObject) {
          // Only add if not already in the list
          if (!problematic.find(pp => pp.id === p.id)) {
            problematic.push({
              id: p.id,
              company_id: p.company_id,
              company_name: (p.companies as any)?.name || 'Unknown',
              name: p.name || '',
              sku: p.sku,
              variants: p.variants,
              issue_type: 'malformed_variants',
            });
          }
        }
      }

      setProblematicProducts(problematic);

      // Calculate per-client stats for hierarchy
      const clientStatsMap = new Map<string, ClientIssueStats>();
      
      for (const p of problematic) {
        const existing = clientStatsMap.get(p.company_id) || {
          company_id: p.company_id,
          company_name: p.company_name,
          empty_names: 0,
          malformed_variants: 0,
          total_issues: 0,
          severity: 'info' as const,
        };
        
        if (p.issue_type === 'empty_name') {
          existing.empty_names++;
        } else if (p.issue_type === 'malformed_variants') {
          existing.malformed_variants++;
        }
        existing.total_issues = existing.empty_names + existing.malformed_variants;
        
        // Determine severity based on issue count and types
        if (existing.empty_names > 0 || existing.total_issues >= 10) {
          existing.severity = 'critical';
        } else if (existing.malformed_variants > 5) {
          existing.severity = 'warning';
        } else {
          existing.severity = 'info';
        }
        
        clientStatsMap.set(p.company_id, existing);
      }
      
      // Sort by severity (critical first) then by total issues
      const sortedClientStats = Array.from(clientStatsMap.values()).sort((a, b) => {
        const severityOrder = { critical: 0, warning: 1, info: 2 };
        if (severityOrder[a.severity] !== severityOrder[b.severity]) {
          return severityOrder[a.severity] - severityOrder[b.severity];
        }
        return b.total_issues - a.total_issues;
      });
      
      setClientStats(sortedClientStats);
    } catch (error) {
      console.error('Error fetching cleanup stats:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch cleanup statistics',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditProduct = (product: ProblematicProduct) => {
    setSelectedProduct(product);
    setNewName(product.sku ? `Product ${product.sku}` : `Product ${product.id.slice(0, 8)}`);
    setEditDialogOpen(true);
  };

  const handleSaveProductName = async () => {
    if (!selectedProduct || !newName.trim()) return;

    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from('client_products')
        .update({ name: newName.trim() })
        .eq('id', selectedProduct.id);

      if (error) throw error;

      toast({
        title: 'Product Updated',
        description: `Product name has been set to "${newName.trim()}"`,
      });

      setEditDialogOpen(false);
      fetchCleanupStats();
    } catch (error) {
      console.error('Error updating product:', error);
      toast({
        title: 'Error',
        description: 'Failed to update product name',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteProduct = async (product: ProblematicProduct) => {
    if (!confirm(`Are you sure you want to delete this product? This action cannot be undone.`)) {
      return;
    }

    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from('client_products')
        .delete()
        .eq('id', product.id);

      if (error) throw error;

      toast({
        title: 'Product Deleted',
        description: 'The problematic product has been removed',
      });

      fetchCleanupStats();
    } catch (error) {
      console.error('Error deleting product:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete product',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCleanMalformedVariants = async (product: ProblematicProduct) => {
    setIsProcessing(true);
    try {
      // Clean up the variants array
      let cleanedVariants: any[] = [];
      
      if (Array.isArray(product.variants)) {
        cleanedVariants = product.variants
          .filter((v: any) => v && typeof v === 'object' && Object.keys(v).length > 0)
          .map((v: any) => ({
            attribute: v.attribute?.trim() || 'Variant',
            values: Array.isArray(v.values) 
              ? v.values
                  .filter((val: any) => {
                    if (!val) return false;
                    if (typeof val === 'string') return val.trim().length > 0;
                    if (typeof val === 'object') return val.value !== undefined;
                    return false;
                  })
                  .map((val: any) => {
                    if (typeof val === 'string') {
                      return { value: val.trim() || 'Unnamed', quantity: 0, subVariants: [] };
                    }
                    return {
                      value: val.value?.trim() || 'Unnamed',
                      quantity: val.quantity || 0,
                      subVariants: val.subVariants || [],
                    };
                  })
              : [],
            sku: v.sku,
          }))
          .filter((v: any) => v.values.length > 0);
      }

      const { error } = await supabase
        .from('client_products')
        .update({ variants: cleanedVariants })
        .eq('id', product.id);

      if (error) throw error;

      toast({
        title: 'Variants Cleaned',
        description: 'Malformed variant data has been cleaned up',
      });

      fetchCleanupStats();
    } catch (error) {
      console.error('Error cleaning variants:', error);
      toast({
        title: 'Error',
        description: 'Failed to clean variant data',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkFixEmptyNames = async () => {
    const emptyNameProducts = problematicProducts.filter(p => p.issue_type === 'empty_name');
    
    if (emptyNameProducts.length === 0) {
      toast({
        title: 'No Products',
        description: 'No products with empty names found',
      });
      return;
    }

    if (!confirm(`This will update ${emptyNameProducts.length} products with empty names to use their SKU or a generated name. Continue?`)) {
      return;
    }

    setIsProcessing(true);
    let successCount = 0;
    let errorCount = 0;

    for (const product of emptyNameProducts) {
      try {
        const newName = product.sku 
          ? `Product ${product.sku}` 
          : `Product ${product.id.slice(0, 8)}`;

        const { error } = await supabase
          .from('client_products')
          .update({ name: newName })
          .eq('id', product.id);

        if (error) {
          errorCount++;
        } else {
          successCount++;
        }
      } catch {
        errorCount++;
      }
    }

    toast({
      title: 'Bulk Fix Complete',
      description: `Fixed ${successCount} products${errorCount > 0 ? `, ${errorCount} failed` : ''}`,
    });

    fetchCleanupStats();
    setIsProcessing(false);
  };

  const handleBulkCleanMalformedVariants = async () => {
    const malformedProducts = problematicProducts.filter(p => p.issue_type === 'malformed_variants');
    
    if (malformedProducts.length === 0) {
      toast({
        title: 'No Products',
        description: 'No products with malformed variants found',
      });
      return;
    }

    if (!confirm(`This will clean variant data for ${malformedProducts.length} products. Continue?`)) {
      return;
    }

    setIsProcessing(true);
    let successCount = 0;
    let errorCount = 0;

    for (const product of malformedProducts) {
      try {
        let cleanedVariants: any[] = [];
        
        if (Array.isArray(product.variants)) {
          cleanedVariants = product.variants
            .filter((v: any) => v && typeof v === 'object' && Object.keys(v).length > 0)
            .map((v: any) => ({
              attribute: v.attribute?.trim() || 'Variant',
              values: Array.isArray(v.values) 
                ? v.values
                    .filter((val: any) => {
                      if (!val) return false;
                      if (typeof val === 'string') return val.trim().length > 0;
                      if (typeof val === 'object') return val.value !== undefined;
                      return false;
                    })
                    .map((val: any) => {
                      if (typeof val === 'string') {
                        return { value: val.trim() || 'Unnamed', quantity: 0, subVariants: [] };
                      }
                      return {
                        value: val.value?.trim() || 'Unnamed',
                        quantity: val.quantity || 0,
                        subVariants: val.subVariants || [],
                      };
                    })
                : [],
              sku: v.sku,
            }))
            .filter((v: any) => v.values.length > 0);
        }

        const { error } = await supabase
          .from('client_products')
          .update({ variants: cleanedVariants })
          .eq('id', product.id);

        if (error) {
          errorCount++;
        } else {
          successCount++;
        }
      } catch {
        errorCount++;
      }
    }

    toast({
      title: 'Bulk Clean Complete',
      description: `Cleaned ${successCount} products${errorCount > 0 ? `, ${errorCount} failed` : ''}`,
    });

    fetchCleanupStats();
    setIsProcessing(false);
  };

  const getIssueTypeBadge = (issueType: string) => {
    switch (issueType) {
      case 'empty_name':
        return <Badge variant="destructive">Empty Name</Badge>;
      case 'malformed_variants':
        return <Badge variant="secondary" className="bg-amber-500/20 text-amber-700">Malformed Variants</Badge>;
      case 'empty_variants':
        return <Badge variant="outline">Empty Variants</Badge>;
      default:
        return <Badge>{issueType}</Badge>;
    }
  };

  // Filter products based on selected company
  const filteredProducts = selectedCompanyFilter === 'all'
    ? problematicProducts
    : problematicProducts.filter(p => p.company_id === selectedCompanyFilter);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Database className="h-6 w-6" />
            Data Cleanup Utility
          </h1>
          <p className="text-muted-foreground">
            Find and fix products with missing or malformed data
          </p>
        </div>
        <Button onClick={fetchCleanupStats} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Explanation Alert */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>What causes these issues?</AlertTitle>
        <AlertDescription className="mt-2 space-y-2">
          <p><strong>Empty Names:</strong> Occurs when products are created via Excel import with missing name columns, or when the product creation form submits with validation bypassed.</p>
          <p><strong>Malformed Variants:</strong> Happens when variant data has empty attribute names (e.g., "" instead of "Size") or empty values (e.g., "" instead of "Large"). This can occur from:</p>
          <ul className="list-disc list-inside ml-4 text-sm">
            <li>Excel imports where variant columns contain empty cells</li>
            <li>Partially filled variant forms during product creation</li>
            <li>Data migration from older systems with inconsistent formatting</li>
            <li>API integrations that send incomplete variant structures</li>
          </ul>
          <p><strong>Empty Variants:</strong> Products with an empty variants array ([]). This is normal for simple products without size/color options.</p>
        </AlertDescription>
      </Alert>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_products ?? '-'}</div>
          </CardContent>
        </Card>
        <Card className={stats?.empty_names ? 'border-destructive' : ''}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              {stats?.empty_names ? <AlertTriangle className="h-4 w-4 text-destructive" /> : <CheckCircle2 className="h-4 w-4 text-green-500" />}
              Empty Names
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.empty_names ?? '-'}</div>
          </CardContent>
        </Card>
        <Card className={stats?.malformed_variants ? 'border-amber-500' : ''}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              {stats?.malformed_variants ? <AlertTriangle className="h-4 w-4 text-amber-500" /> : <CheckCircle2 className="h-4 w-4 text-green-500" />}
              Malformed Variants
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.malformed_variants ?? '-'}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Empty Variants</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-muted-foreground">{stats?.empty_variants ?? '-'}</div>
            <p className="text-xs text-muted-foreground">Not necessarily an issue</p>
          </CardContent>
        </Card>
      </div>

      {/* Client Alert Hierarchy */}
      {clientStats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Client Issue Hierarchy
            </CardTitle>
            <CardDescription>Clients sorted by issue severity - click to filter</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {clientStats.map((client) => (
                <button
                  key={client.company_id}
                  onClick={() => setSelectedCompanyFilter(
                    selectedCompanyFilter === client.company_id ? 'all' : client.company_id
                  )}
                  className={`w-full flex items-center justify-between p-3 rounded-lg border transition-colors ${
                    selectedCompanyFilter === client.company_id 
                      ? 'bg-primary/10 border-primary' 
                      : 'hover:bg-muted/50'
                  } ${
                    client.severity === 'critical' 
                      ? 'border-l-4 border-l-destructive' 
                      : client.severity === 'warning'
                        ? 'border-l-4 border-l-amber-500'
                        : 'border-l-4 border-l-blue-500'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="font-medium text-left">{client.company_name}</p>
                      <p className="text-sm text-muted-foreground text-left">
                        {client.empty_names > 0 && `${client.empty_names} empty name${client.empty_names > 1 ? 's' : ''}`}
                        {client.empty_names > 0 && client.malformed_variants > 0 && ', '}
                        {client.malformed_variants > 0 && `${client.malformed_variants} malformed variant${client.malformed_variants > 1 ? 's' : ''}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={client.severity === 'critical' ? 'destructive' : client.severity === 'warning' ? 'secondary' : 'outline'}
                      className={client.severity === 'warning' ? 'bg-amber-500/20 text-amber-700' : ''}
                    >
                      {client.total_issues} issue{client.total_issues > 1 ? 's' : ''}
                    </Badge>
                    {selectedCompanyFilter === client.company_id && (
                      <Badge variant="outline">Filtered</Badge>
                    )}
                  </div>
                </button>
              ))}
            </div>
            {selectedCompanyFilter !== 'all' && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="mt-3"
                onClick={() => setSelectedCompanyFilter('all')}
              >
                Clear filter
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Bulk Actions */}
      {problematicProducts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Bulk Actions</CardTitle>
            <CardDescription>
              Fix multiple issues at once
              {selectedCompanyFilter !== 'all' && ` (filtered to ${clientStats.find(c => c.company_id === selectedCompanyFilter)?.company_name})`}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex gap-4">
            <Button 
              onClick={handleBulkFixEmptyNames} 
              disabled={isProcessing || !filteredProducts.some(p => p.issue_type === 'empty_name')}
              variant="outline"
            >
              <Edit2 className="h-4 w-4 mr-2" />
              Fix All Empty Names ({filteredProducts.filter(p => p.issue_type === 'empty_name').length})
            </Button>
            <Button 
              onClick={handleBulkCleanMalformedVariants} 
              disabled={isProcessing || !filteredProducts.some(p => p.issue_type === 'malformed_variants')}
              variant="outline"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Clean All Malformed Variants ({filteredProducts.filter(p => p.issue_type === 'malformed_variants').length})
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Problematic Products Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Problematic Products ({filteredProducts.length})
            {selectedCompanyFilter !== 'all' && (
              <span className="text-sm font-normal text-muted-foreground ml-2">
                — {clientStats.find(c => c.company_id === selectedCompanyFilter)?.company_name}
              </span>
            )}
          </CardTitle>
          <CardDescription>Products that require attention</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-2" />
              <p className="text-muted-foreground">
                {selectedCompanyFilter !== 'all' 
                  ? 'No issues for this client!' 
                  : 'All products are in good shape!'}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead>Product Name</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Issue</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.company_name}</TableCell>
                    <TableCell>
                      {product.name || <span className="text-muted-foreground italic">(empty)</span>}
                    </TableCell>
                    <TableCell className="font-mono text-sm">{product.sku || '-'}</TableCell>
                    <TableCell>{getIssueTypeBadge(product.issue_type)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {product.issue_type === 'empty_name' && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleEditProduct(product)}
                            disabled={isProcessing}
                          >
                            <Edit2 className="h-3 w-3 mr-1" />
                            Set Name
                          </Button>
                        )}
                        {product.issue_type === 'malformed_variants' && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleCleanMalformedVariants(product)}
                            disabled={isProcessing}
                          >
                            <RefreshCw className="h-3 w-3 mr-1" />
                            Clean
                          </Button>
                        )}
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={() => handleDeleteProduct(product)}
                          disabled={isProcessing}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Set Product Name</DialogTitle>
            <DialogDescription>
              Enter a name for this product. The SKU is: {selectedProduct?.sku || 'N/A'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="product-name">Product Name</Label>
              <Input
                id="product-name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Enter product name"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveProductName} disabled={isProcessing || !newName.trim()}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DataCleanup;

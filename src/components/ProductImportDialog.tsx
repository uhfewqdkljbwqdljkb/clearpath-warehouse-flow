import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Upload, Download, FileSpreadsheet, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';

interface ProductImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  clientName: string;
  clientCode: string;
  onImportComplete: () => void;
}

interface ParsedProduct {
  product_name: string;
  variant_attribute?: string;
  variant_value?: string;
  quantity: number;
  notes?: string;
  rowNumber: number;
}

interface ValidationError {
  rowNumber: number;
  field: string;
  message: string;
}

interface GroupedProduct {
  name: string;
  variants: Array<{
    attribute: string;
    values: Array<{ value: string; quantity: number }>;
  }>;
  totalQuantity: number;
  notes?: string;
  status: 'new' | 'error';
  errors: string[];
}

export function ProductImportDialog({
  open,
  onOpenChange,
  clientId,
  clientName,
  clientCode,
  onImportComplete,
}: ProductImportDialogProps) {
  const [step, setStep] = useState<'upload' | 'preview' | 'importing' | 'complete'>('upload');
  const [parsedProducts, setParsedProducts] = useState<ParsedProduct[]>([]);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [groupedProducts, setGroupedProducts] = useState<GroupedProduct[]>([]);
  const [importProgress, setImportProgress] = useState(0);
  const [importResults, setImportResults] = useState<{ success: number; failed: number }>({ success: 0, failed: 0 });
  const { toast } = useToast();

  const downloadTemplate = () => {
    const wb = XLSX.utils.book_new();

    // Instructions sheet
    const instructions = [
      ['Client-Specific Product Import Template'],
      [`Client: ${clientName} (${clientCode})`],
      [''],
      ['Instructions:'],
      ['1. Fill in the Products sheet with your product data'],
      ['2. product_name: Required - Name of the product'],
      ['3. variant_attribute: Optional - Type of variant (e.g., Size, Color, Material)'],
      ['4. variant_value: Optional - Specific value (e.g., Small, Red, Cotton)'],
      ['5. quantity: Required - Must be a positive number'],
      ['6. notes: Optional - Any additional information'],
      [''],
      ['Important Notes:'],
      ['- Multiple rows with same product_name will be grouped as variants'],
      ['- Leave variant fields empty for products without variants'],
      ['- If using variants, both attribute and value must be filled'],
      ['- Maximum 1000 rows per import'],
      ['- Maximum file size: 5MB'],
    ];
    const wsInstructions = XLSX.utils.aoa_to_sheet(instructions);
    XLSX.utils.book_append_sheet(wb, wsInstructions, 'Instructions');

    // Products sheet with sample data
    const products = [
      ['product_name', 'variant_attribute', 'variant_value', 'quantity', 'notes'],
      ['T-Shirt', 'Size', 'Small', 100, 'Cotton blend, spring collection'],
      ['T-Shirt', 'Size', 'Medium', 150, 'Cotton blend, spring collection'],
      ['T-Shirt', 'Size', 'Large', 120, 'Cotton blend, spring collection'],
      ['T-Shirt', 'Size', 'XL', 80, 'Cotton blend, spring collection'],
      ['Hoodie', 'Color', 'Black', 50, 'Fleece lined'],
      ['Hoodie', 'Color', 'Gray', 45, 'Fleece lined'],
      ['Hoodie', 'Color', 'Navy', 40, 'Fleece lined'],
      ['Running Shoes', 'Size', '8', 30, 'Athletic footwear'],
      ['Running Shoes', 'Size', '9', 35, 'Athletic footwear'],
      ['Running Shoes', 'Size', '10', 40, 'Athletic footwear'],
      ['Running Shoes', 'Size', '11', 25, 'Athletic footwear'],
      ['Backpack', 'Material', 'Canvas', 60, 'Water resistant'],
      ['Backpack', 'Material', 'Leather', 40, 'Premium quality'],
      ['Backpack', 'Material', 'Nylon', 70, 'Lightweight'],
      ['Water Bottle', 'Capacity', '500ml', 100, 'Stainless steel'],
      ['Water Bottle', 'Capacity', '750ml', 80, 'Stainless steel'],
      ['Water Bottle', 'Capacity', '1L', 60, 'Stainless steel'],
      ['Laptop Stand', '', '', 200, 'No variants, universal fit'],
      ['Notebook', 'Pages', '100', 150, 'Ruled paper'],
      ['Notebook', 'Pages', '200', 100, 'Ruled paper'],
      ['Desk Lamp', 'Style', 'Modern', 40, 'LED, adjustable'],
      ['Desk Lamp', 'Style', 'Classic', 35, 'LED, adjustable'],
    ];
    const wsProducts = XLSX.utils.aoa_to_sheet(products);
    XLSX.utils.book_append_sheet(wb, wsProducts, 'Products');

    XLSX.writeFile(wb, `${clientName.replace(/[^a-zA-Z0-9]/g, '_')}_Product_Import_Template.xlsx`);
    
    toast({
      title: 'Template Downloaded',
      description: 'Fill in the template and upload it to import products.',
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    if (!file.name.match(/\.(xlsx|xls)$/)) {
      toast({
        title: 'Invalid File Type',
        description: 'Please upload an Excel file (.xlsx or .xls)',
        variant: 'destructive',
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File Too Large',
        description: 'Maximum file size is 5MB',
        variant: 'destructive',
      });
      return;
    }

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets['Products'];

      if (!worksheet) {
        toast({
          title: 'Invalid Template',
          description: 'Could not find "Products" sheet in the Excel file',
          variant: 'destructive',
        });
        return;
      }

      const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet);

      if (jsonData.length === 0) {
        toast({
          title: 'Empty File',
          description: 'The Excel file contains no data',
          variant: 'destructive',
        });
        return;
      }

      if (jsonData.length > 1000) {
        toast({
          title: 'Too Many Rows',
          description: 'Maximum 1000 rows allowed per import',
          variant: 'destructive',
        });
        return;
      }

      // Parse and validate
      const parsed: ParsedProduct[] = [];
      const errors: ValidationError[] = [];

      jsonData.forEach((row, index) => {
        const rowNumber = index + 2; // +2 because Excel is 1-indexed and has header

        // Skip empty rows
        if (!row.product_name && !row.quantity) return;

        // Validate product_name
        if (!row.product_name || typeof row.product_name !== 'string' || row.product_name.trim() === '') {
          errors.push({
            rowNumber,
            field: 'product_name',
            message: 'Product name is required and must be text',
          });
        }

        // Validate quantity
        const quantity = Number(row.quantity);
        if (isNaN(quantity) || quantity <= 0) {
          errors.push({
            rowNumber,
            field: 'quantity',
            message: 'Quantity must be a positive number',
          });
        }

        // Validate variants
        const hasAttribute = row.variant_attribute && String(row.variant_attribute).trim() !== '';
        const hasValue = row.variant_value && String(row.variant_value).trim() !== '';

        if (hasAttribute && !hasValue) {
          errors.push({
            rowNumber,
            field: 'variant_value',
            message: 'Variant value is required when variant attribute is specified',
          });
        }

        if (!hasAttribute && hasValue) {
          errors.push({
            rowNumber,
            field: 'variant_attribute',
            message: 'Variant attribute is required when variant value is specified',
          });
        }

        parsed.push({
          product_name: String(row.product_name || '').trim(),
          variant_attribute: hasAttribute ? String(row.variant_attribute).trim() : undefined,
          variant_value: hasValue ? String(row.variant_value).trim() : undefined,
          quantity: quantity,
          notes: row.notes ? String(row.notes).trim() : undefined,
          rowNumber,
        });
      });

      setParsedProducts(parsed);
      setValidationErrors(errors);

      // Group products
      if (errors.length === 0) {
        const grouped = groupProductsByName(parsed);
        setGroupedProducts(grouped);
        setStep('preview');
      } else {
        toast({
          title: 'Validation Errors Found',
          description: `Found ${errors.length} error(s). Please fix them and try again.`,
          variant: 'destructive',
        });
        setStep('preview'); // Still show preview with errors
      }
    } catch (error) {
      console.error('Error parsing Excel file:', error);
      toast({
        title: 'Error Parsing File',
        description: 'Failed to read the Excel file. Please ensure it is properly formatted.',
        variant: 'destructive',
      });
    }

    // Reset file input
    e.target.value = '';
  };

  const groupProductsByName = (products: ParsedProduct[]): GroupedProduct[] => {
    const grouped = new Map<string, GroupedProduct>();

    products.forEach((product) => {
      const key = product.product_name.toLowerCase();

      if (!grouped.has(key)) {
        grouped.set(key, {
          name: product.product_name,
          variants: [],
          totalQuantity: 0,
          notes: product.notes,
          status: 'new',
          errors: [],
        });
      }

      const group = grouped.get(key)!;
      group.totalQuantity += product.quantity;

      if (product.variant_attribute && product.variant_value) {
        // Find or create variant attribute group
        let variantGroup = group.variants.find(
          (v) => v.attribute.toLowerCase() === product.variant_attribute!.toLowerCase()
        );

        if (!variantGroup) {
          variantGroup = {
            attribute: product.variant_attribute,
            values: [],
          };
          group.variants.push(variantGroup);
        }

        // Check for duplicate variant values
        const existingValue = variantGroup.values.find(
          (v) => v.value.toLowerCase() === product.variant_value!.toLowerCase()
        );

        if (existingValue) {
          group.errors.push(`Duplicate variant: ${product.variant_attribute} - ${product.variant_value}`);
          group.status = 'error';
        } else {
          variantGroup.values.push({
            value: product.variant_value,
            quantity: product.quantity,
          });
        }
      }
    });

    return Array.from(grouped.values());
  };

  const handleImport = async () => {
    if (validationErrors.length > 0) {
      toast({
        title: 'Cannot Import',
        description: 'Please fix validation errors before importing',
        variant: 'destructive',
      });
      return;
    }

    const validProducts = groupedProducts.filter((p) => p.status !== 'error');
    if (validProducts.length === 0) {
      toast({
        title: 'No Valid Products',
        description: 'No products to import',
        variant: 'destructive',
      });
      return;
    }

    setStep('importing');
    setImportProgress(0);

    try {
      // Get company_id from clientId
      const { data: company, error: companyError } = await supabase
        .from('companies')
        .select('id')
        .eq('id', clientId)
        .single();

      if (companyError || !company) {
        throw new Error('Client not found');
      }

      let successCount = 0;
      let failedCount = 0;

      // Import products one by one (could be optimized with batch insert)
      for (let i = 0; i < validProducts.length; i++) {
        const product = validProducts[i];

        try {
          // Prepare variants JSONB
          const variants = product.variants.length > 0
            ? product.variants.map((v) => ({
                attribute: v.attribute,
                values: v.values,
              }))
            : [];

          const { error: insertError } = await supabase.from('client_products').insert({
            company_id: company.id,
            name: product.name,
            variants: variants.length > 0 ? variants : [{ attribute: '', values: [{ value: '', quantity: product.totalQuantity }] }],
            is_active: true,
          });

          if (insertError) {
            console.error('Insert error:', insertError);
            failedCount++;
          } else {
            successCount++;
          }
        } catch (error) {
          console.error('Error inserting product:', error);
          failedCount++;
        }

        setImportProgress(((i + 1) / validProducts.length) * 100);
      }

      setImportResults({ success: successCount, failed: failedCount });
      setStep('complete');

      if (successCount > 0) {
        toast({
          title: 'Import Complete',
          description: `Successfully imported ${successCount} product(s)`,
        });
        onImportComplete();
      }

      if (failedCount > 0) {
        toast({
          title: 'Some Products Failed',
          description: `${failedCount} product(s) failed to import`,
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: 'Import Failed',
        description: 'An error occurred during import. Please try again.',
        variant: 'destructive',
      });
      setStep('preview');
    }
  };

  const handleClose = () => {
    setStep('upload');
    setParsedProducts([]);
    setValidationErrors([]);
    setGroupedProducts([]);
    setImportProgress(0);
    setImportResults({ success: 0, failed: 0 });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Import Products for {clientName}
          </DialogTitle>
          <DialogDescription>
            Client Code: {clientCode} • Bulk import products from Excel
          </DialogDescription>
        </DialogHeader>

        {step === 'upload' && (
          <div className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Download the template, fill it with your product data, and upload it back to import products.
              </AlertDescription>
            </Alert>

            <div className="flex gap-2">
              <Button onClick={downloadTemplate} variant="outline" className="flex-1">
                <Download className="h-4 w-4 mr-2" />
                Download Template
              </Button>
            </div>

            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg font-medium mb-2">Upload Excel File</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Click to browse or drag and drop your file here
                </p>
                <Button type="button" variant="secondary">
                  Select File
                </Button>
              </label>
            </div>

            <div className="text-xs text-muted-foreground space-y-1">
              <p>• Maximum file size: 5MB</p>
              <p>• Maximum rows: 1000</p>
              <p>• Accepted formats: .xlsx, .xls</p>
            </div>
          </div>
        )}

        {step === 'preview' && (
          <div className="space-y-4">
            {validationErrors.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <p className="font-medium mb-2">Found {validationErrors.length} validation error(s):</p>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    {validationErrors.slice(0, 5).map((error, idx) => (
                      <li key={idx}>
                        Row {error.rowNumber}: {error.field} - {error.message}
                      </li>
                    ))}
                    {validationErrors.length > 5 && (
                      <li>... and {validationErrors.length - 5} more error(s)</li>
                    )}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {groupedProducts.length > 0 && (
              <>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Found {groupedProducts.length} unique product(s) to import
                  </p>
                </div>

                <div className="border rounded-lg overflow-hidden">
                  <div className="max-h-96 overflow-y-auto">
                    <table className="w-full">
                      <thead className="bg-muted sticky top-0">
                        <tr>
                          <th className="text-left p-3 text-sm font-medium">Product Name</th>
                          <th className="text-left p-3 text-sm font-medium">Variants</th>
                          <th className="text-right p-3 text-sm font-medium">Total Qty</th>
                          <th className="text-left p-3 text-sm font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {groupedProducts.map((product, idx) => (
                          <tr key={idx} className="border-t">
                            <td className="p-3 text-sm">{product.name}</td>
                            <td className="p-3 text-sm">
                              {product.variants.length > 0 ? (
                                <div className="space-y-1">
                                  {product.variants.map((variant, vIdx) => (
                                    <div key={vIdx} className="text-xs">
                                      <span className="font-medium">{variant.attribute}:</span>{' '}
                                      {variant.values.map((v) => `${v.value} (${v.quantity})`).join(', ')}
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-muted-foreground text-xs">No variants</span>
                              )}
                            </td>
                            <td className="p-3 text-sm text-right">{product.totalQuantity}</td>
                            <td className="p-3 text-sm">
                              {product.status === 'error' ? (
                                <div className="flex items-center gap-1 text-destructive">
                                  <AlertCircle className="h-4 w-4" />
                                  <span className="text-xs">Error</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1 text-green-600">
                                  <CheckCircle2 className="h-4 w-4" />
                                  <span className="text-xs">Ready</span>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                onClick={handleImport}
                disabled={validationErrors.length > 0 || groupedProducts.filter((p) => p.status !== 'error').length === 0}
              >
                Import {groupedProducts.filter((p) => p.status !== 'error').length} Product(s)
              </Button>
            </div>
          </div>
        )}

        {step === 'importing' && (
          <div className="space-y-4 py-8">
            <div className="flex items-center justify-center">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
            <p className="text-center text-lg font-medium">Importing Products...</p>
            <Progress value={importProgress} className="w-full" />
            <p className="text-center text-sm text-muted-foreground">{Math.round(importProgress)}% complete</p>
          </div>
        )}

        {step === 'complete' && (
          <div className="space-y-4 py-8">
            <div className="flex items-center justify-center">
              <CheckCircle2 className="h-16 w-16 text-green-600" />
            </div>
            <div className="text-center space-y-2">
              <p className="text-lg font-medium">Import Complete!</p>
              <p className="text-sm text-muted-foreground">
                Successfully imported {importResults.success} product(s)
              </p>
              {importResults.failed > 0 && (
                <p className="text-sm text-destructive">Failed to import {importResults.failed} product(s)</p>
              )}
            </div>
            <div className="flex gap-2 justify-center">
              <Button onClick={handleClose}>Close</Button>
              <Button
                variant="outline"
                onClick={() => {
                  setStep('upload');
                  setParsedProducts([]);
                  setValidationErrors([]);
                  setGroupedProducts([]);
                  setImportProgress(0);
                  setImportResults({ success: 0, failed: 0 });
                }}
              >
                Import More
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

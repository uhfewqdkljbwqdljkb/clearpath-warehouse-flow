import { z } from 'zod';

// Variant value schema
const variantValueSchema = z.object({
  value: z.string().min(1, 'Variant value cannot be empty').max(100, 'Variant value too long'),
  quantity: z.number().min(0, 'Quantity must be 0 or greater'),
  subVariants: z.array(z.any()).optional(),
});

// Variant schema
const variantSchema = z.object({
  attribute: z.string().min(1, 'Attribute name cannot be empty').max(50, 'Attribute name too long'),
  values: z.array(variantValueSchema).min(1, 'At least one value is required'),
  sku: z.string().optional(),
});

// Product schema for creation/editing
export const productSchema = z.object({
  name: z.string()
    .min(1, 'Product name is required')
    .max(200, 'Product name must be less than 200 characters')
    .refine((val) => val.trim().length > 0, 'Product name cannot be empty or whitespace only'),
  sku: z.string().optional(),
  variants: z.array(variantSchema).optional(),
  quantity: z.number().min(0).optional(),
  minimumQuantity: z.number().min(0).optional(),
  value: z.number().min(0).optional(),
});

export type ProductFormData = z.infer<typeof productSchema>;

// Validation result type
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  cleanedData?: any;
}

/**
 * Validates and cleans a product's data before saving
 */
export function validateProduct(product: {
  name?: string;
  variants?: any[];
  quantity?: number;
}): ValidationResult {
  const errors: string[] = [];

  // Validate name
  if (!product.name || product.name.trim().length === 0) {
    errors.push('Product name is required and cannot be empty');
  } else if (product.name.length > 200) {
    errors.push('Product name must be less than 200 characters');
  }

  // Validate and clean variants
  const cleanedVariants: any[] = [];
  
  if (product.variants && Array.isArray(product.variants)) {
    for (let i = 0; i < product.variants.length; i++) {
      const variant = product.variants[i];
      
      if (!variant || typeof variant !== 'object') {
        continue; // Skip invalid entries
      }

      const attribute = variant.attribute?.trim() || '';
      
      // Skip completely empty variants
      if (!attribute && (!variant.values || variant.values.length === 0)) {
        continue;
      }

      // Validate attribute
      if (!attribute) {
        errors.push(`Variant ${i + 1}: Attribute name is required`);
        continue;
      }

      // Validate and clean values
      const cleanedValues: any[] = [];
      
      if (variant.values && Array.isArray(variant.values)) {
        for (let j = 0; j < variant.values.length; j++) {
          const val = variant.values[j];
          
          if (!val) continue;
          
          const valueStr = typeof val === 'string' ? val.trim() : val.value?.trim() || '';
          
          // Skip empty values
          if (!valueStr) {
            errors.push(`Variant "${attribute}": Value ${j + 1} cannot be empty`);
            continue;
          }

          cleanedValues.push({
            value: valueStr,
            quantity: typeof val === 'object' ? (val.quantity || 0) : 0,
            subVariants: typeof val === 'object' ? (val.subVariants || []) : [],
          });
        }
      }

      if (cleanedValues.length === 0) {
        errors.push(`Variant "${attribute}": At least one value is required`);
        continue;
      }

      cleanedVariants.push({
        attribute,
        values: cleanedValues,
        sku: variant.sku,
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    cleanedData: {
      name: product.name?.trim() || '',
      variants: cleanedVariants,
      quantity: product.quantity || 0,
    },
  };
}

/**
 * Validates an array of products (for bulk import)
 */
export function validateProducts(products: any[]): {
  valid: boolean;
  results: Array<{ index: number; product: any; validation: ValidationResult }>;
  totalErrors: number;
} {
  const results = products.map((product, index) => ({
    index,
    product,
    validation: validateProduct(product),
  }));

  const totalErrors = results.reduce((sum, r) => sum + r.validation.errors.length, 0);

  return {
    valid: totalErrors === 0,
    results,
    totalErrors,
  };
}

/**
 * Cleans variant data to remove empty/malformed entries
 */
export function cleanVariants(variants: any[]): any[] {
  if (!variants || !Array.isArray(variants)) return [];

  return variants
    .filter((v) => v && typeof v === 'object' && Object.keys(v).length > 0)
    .map((v) => ({
      attribute: v.attribute?.trim() || '',
      values: Array.isArray(v.values)
        ? v.values
            .filter((val: any) => {
              if (!val) return false;
              if (typeof val === 'string') return val.trim().length > 0;
              if (typeof val === 'object') return val.value?.trim?.()?.length > 0;
              return false;
            })
            .map((val: any) => {
              if (typeof val === 'string') {
                return { value: val.trim(), quantity: 0, subVariants: [] };
              }
              return {
                value: val.value?.trim() || '',
                quantity: val.quantity || 0,
                subVariants: val.subVariants || [],
              };
            })
        : [],
      sku: v.sku,
    }))
    .filter((v) => v.attribute && v.values.length > 0);
}

/**
 * Checks if a product has validation issues
 */
export function hasProductIssues(product: { name?: string; variants?: any[] }): {
  hasIssues: boolean;
  issues: string[];
} {
  const issues: string[] = [];

  if (!product.name || product.name.trim().length === 0) {
    issues.push('Empty name');
  }

  if (product.variants && Array.isArray(product.variants)) {
    for (const variant of product.variants) {
      if (!variant) continue;
      
      if (!variant.attribute || variant.attribute.trim() === '') {
        issues.push('Empty variant attribute');
      }

      if (variant.values && Array.isArray(variant.values)) {
        for (const val of variant.values) {
          if (!val) continue;
          const valueStr = typeof val === 'string' ? val : val.value;
          if (!valueStr || valueStr.trim() === '') {
            issues.push('Empty variant value');
          }
        }
      }
    }
  }

  return {
    hasIssues: issues.length > 0,
    issues: [...new Set(issues)], // Deduplicate
  };
}

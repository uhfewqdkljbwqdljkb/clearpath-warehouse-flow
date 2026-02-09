// Nested variant structure for products
// Supports hierarchical variants like Size -> Color -> Pattern

export interface VariantValue {
  value: string;
  quantity: number;
  minimumQuantity?: number; // Low stock threshold for this variant
  subVariants?: Variant[]; // Nested variants under this value
}

export interface Variant {
  attribute: string;
  values: VariantValue[];
  sku?: string;
}

// Unified ProductEntry interface for check-in flows
// Used by ClientCheckIn, ExistingProductsDialog, and ProductImportDialog
export interface ProductEntry {
  name: string;
  quantity: number;
  variants: Variant[];
  existingProductId?: string; // For existing products
  supplierId?: string; // B2B: assigned supplier
  customerId?: string; // B2B: designated customer
  minimumQuantity?: number; // Minimum recommended stock level
  value?: number; // Dollar value assigned to the product
}

// Legacy flat variant structure (for backward compatibility)
export interface LegacyVariantValue {
  value: string;
  quantity: number;
}

export interface LegacyVariant {
  attribute: string;
  values: LegacyVariantValue[];
  sku?: string;
}

// Type guard to check if a variant uses nested structure
export function hasNestedVariants(variants: any[]): boolean {
  if (!variants || !Array.isArray(variants)) return false;
  
  return variants.some(variant => 
    variant.values?.some((val: any) => 
      val.subVariants && val.subVariants.length > 0
    )
  );
}

// Safely parse variants from database, handling malformed data
export function parseVariantsFromDb(variants: any): Variant[] {
  if (!variants || !Array.isArray(variants)) return [];
  
  return variants
    // Filter out completely empty or malformed objects, but allow empty attribute strings
    .filter((v: any) => {
      if (!v || typeof v !== 'object') return false;
      // Skip if it's a completely empty object
      if (Object.keys(v).length === 0) return false;
      // Must have values array with at least one item to be useful
      if (!Array.isArray(v.values) || v.values.length === 0) return false;
      return true;
    })
    .map((v: any) => ({
      attribute: v.attribute || 'Variant',  // Default to 'Variant' if empty
      values: Array.isArray(v.values) 
        ? v.values
            .filter((val: any) => {
              if (!val) return false;
              if (typeof val === 'string') return val.trim().length > 0;
              if (typeof val === 'object') {
                // Allow values even if value string is empty, as long as object has quantity
                return val.value !== undefined || val.quantity !== undefined;
              }
              return false;
            })
            .map((val: any) => {
              if (typeof val === 'string') {
                return { value: val, quantity: 0, subVariants: [] };
              }
              return {
                value: val.value || '',
                quantity: val.quantity || 0,
                minimumQuantity: val.minimumQuantity,
                subVariants: val.subVariants ? parseVariantsFromDb(val.subVariants) : [],
              };
            })
        : [],
      sku: v.sku,
    }))
    // Final filter: only keep variants that ended up with at least one valid value
    .filter(v => v.values.length > 0);
}

// Deep clone variants and reset quantities to zero (for check-in)
export function cloneVariantsWithZeroQuantity(variants: Variant[]): Variant[] {
  return variants.map(v => ({
    attribute: v.attribute,
    values: v.values.map(val => ({
      value: val.value,
      quantity: 0,
      minimumQuantity: val.minimumQuantity,
      subVariants: val.subVariants ? cloneVariantsWithZeroQuantity(val.subVariants) : [],
    })),
    sku: v.sku,
  }));
}

// Calculate total quantity from nested variants
export function calculateNestedVariantQuantity(variants: Variant[]): number {
  if (!variants || !Array.isArray(variants) || variants.length === 0) {
    return 0;
  }

  let total = 0;

  const calculateValueQuantity = (values: VariantValue[]): number => {
    if (!values || !Array.isArray(values)) return 0;
    let sum = 0;
    for (const val of values) {
      if (val.subVariants && Array.isArray(val.subVariants) && val.subVariants.length > 0) {
        for (const subVariant of val.subVariants) {
          sum += calculateValueQuantity(subVariant?.values);
        }
      } else {
        sum += val.quantity || 0;
      }
    }
    return sum;
  };

  for (const variant of variants) {
    if (!variant?.values || !Array.isArray(variant.values)) continue;
    total += calculateValueQuantity(variant.values);
  }

  return total;
}

// Get variant breakdown for display (flattens nested structure)
export function getVariantBreakdown(variants: Variant[]): { [key: string]: number } {
  const breakdown: { [key: string]: number } = {};
  
  if (!variants || !Array.isArray(variants)) return breakdown;

  const processValues = (
    values: VariantValue[], 
    parentPath: string = ''
  ) => {
    if (!values || !Array.isArray(values)) return;
    for (const val of values) {
      const currentPath = parentPath 
        ? `${parentPath} / ${val.value}` 
        : val.value;
      
      if (val.subVariants && Array.isArray(val.subVariants) && val.subVariants.length > 0) {
        for (const subVariant of val.subVariants) {
          processValues(subVariant?.values, `${currentPath} - ${subVariant?.attribute}`);
        }
      } else {
        if (val.quantity > 0) {
          breakdown[currentPath] = val.quantity;
        }
      }
    }
  };

  for (const variant of variants) {
    if (!variant?.values || !Array.isArray(variant.values)) continue;
    const basePath = variant.attribute;
    for (const val of variant.values) {
      const currentPath = `${basePath}: ${val.value}`;
      
      if (val.subVariants && Array.isArray(val.subVariants) && val.subVariants.length > 0) {
        for (const subVariant of val.subVariants) {
          processValues(subVariant?.values, `${currentPath} → ${subVariant?.attribute}`);
        }
      } else {
        if (val.quantity > 0) {
          breakdown[currentPath] = val.quantity;
        }
      }
    }
  }

  return breakdown;
}

// Check if variants array uses legacy flat structure
export function isLegacyVariantStructure(variants: any[]): boolean {
  if (!variants || !Array.isArray(variants) || variants.length === 0) {
    return false;
  }
  
  // Legacy structure doesn't have subVariants property
  return !hasNestedVariants(variants);
}

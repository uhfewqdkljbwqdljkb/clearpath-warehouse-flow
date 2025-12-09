// Nested variant structure for products
// Supports hierarchical variants like Size -> Color -> Pattern

export interface VariantValue {
  value: string;
  quantity: number;
  subVariants?: Variant[]; // Nested variants under this value
}

export interface Variant {
  attribute: string;
  values: VariantValue[];
  sku?: string;
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

// Calculate total quantity from nested variants
export function calculateNestedVariantQuantity(variants: Variant[]): number {
  if (!variants || !Array.isArray(variants) || variants.length === 0) {
    return 0;
  }

  let total = 0;

  const calculateValueQuantity = (values: VariantValue[]): number => {
    let sum = 0;
    for (const val of values) {
      if (val.subVariants && val.subVariants.length > 0) {
        // If has sub-variants, sum their quantities instead
        for (const subVariant of val.subVariants) {
          sum += calculateValueQuantity(subVariant.values);
        }
      } else {
        // Leaf node - use this value's quantity
        sum += val.quantity || 0;
      }
    }
    return sum;
  };

  for (const variant of variants) {
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
    for (const val of values) {
      const currentPath = parentPath 
        ? `${parentPath} / ${val.value}` 
        : val.value;
      
      if (val.subVariants && val.subVariants.length > 0) {
        // Process nested variants
        for (const subVariant of val.subVariants) {
          processValues(subVariant.values, `${currentPath} - ${subVariant.attribute}`);
        }
      } else {
        // Leaf node - record the quantity
        if (val.quantity > 0) {
          breakdown[currentPath] = val.quantity;
        }
      }
    }
  };

  for (const variant of variants) {
    const basePath = variant.attribute;
    for (const val of variant.values) {
      const currentPath = `${basePath}: ${val.value}`;
      
      if (val.subVariants && val.subVariants.length > 0) {
        for (const subVariant of val.subVariants) {
          processValues(subVariant.values, `${currentPath} → ${subVariant.attribute}`);
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

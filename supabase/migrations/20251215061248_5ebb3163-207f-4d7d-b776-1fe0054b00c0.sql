-- Add variant tracking columns to inventory_items
ALTER TABLE public.inventory_items 
ADD COLUMN variant_attribute text,
ADD COLUMN variant_value text;

-- Create a unique constraint for variant-level inventory tracking
-- This allows one inventory record per product+company+variant combination
CREATE UNIQUE INDEX idx_inventory_items_variant_unique 
ON public.inventory_items (product_id, company_id, COALESCE(variant_attribute, ''), COALESCE(variant_value, ''));
-- Remove unnecessary columns from client_products table
-- Keep only: id, company_id, sku, name, variants, is_active, created_at, updated_at

ALTER TABLE public.client_products 
DROP COLUMN IF EXISTS description,
DROP COLUMN IF EXISTS category,
DROP COLUMN IF EXISTS dimensions_length,
DROP COLUMN IF EXISTS dimensions_width,
DROP COLUMN IF EXISTS dimensions_height,
DROP COLUMN IF EXISTS weight,
DROP COLUMN IF EXISTS unit_value,
DROP COLUMN IF EXISTS storage_requirements;
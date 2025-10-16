-- Remove unnecessary columns from client_products table
ALTER TABLE client_products
  DROP COLUMN IF EXISTS sku,
  DROP COLUMN IF EXISTS description,
  DROP COLUMN IF EXISTS category,
  DROP COLUMN IF EXISTS storage_requirements,
  DROP COLUMN IF EXISTS unit_price,
  DROP COLUMN IF EXISTS dimensions_length,
  DROP COLUMN IF EXISTS dimensions_width,
  DROP COLUMN IF EXISTS dimensions_height,
  DROP COLUMN IF EXISTS weight_lbs,
  DROP COLUMN IF EXISTS reorder_point;
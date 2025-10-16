-- Remove capacity columns from warehouse_zones
ALTER TABLE warehouse_zones 
DROP COLUMN IF EXISTS capacity_sqft,
DROP COLUMN IF EXISTS total_capacity_cubic_feet,
DROP COLUMN IF EXISTS current_usage_sqft;

-- Remove capacity columns from warehouse_rows
ALTER TABLE warehouse_rows 
DROP COLUMN IF EXISTS capacity_cubic_ft,
DROP COLUMN IF EXISTS current_usage_cubic_ft;
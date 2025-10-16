-- Add unique constraints to code columns
ALTER TABLE warehouse_zones ADD CONSTRAINT warehouse_zones_code_key UNIQUE (code);
ALTER TABLE warehouse_rows ADD CONSTRAINT warehouse_rows_code_key UNIQUE (code);

-- Insert Shelf Zone if it doesn't exist
INSERT INTO warehouse_zones (code, name, zone_type, capacity_sqft, total_capacity_cubic_feet, is_active, color)
VALUES ('SHELF', 'Shelf Zone', 'shelf', 0, 68000, true, '#6366F1')
ON CONFLICT (code) DO NOTHING;

-- Insert 17 Shelf Rows associated with the Shelf Zone
INSERT INTO warehouse_rows (code, row_number, zone_id, capacity_cubic_ft, current_usage_cubic_ft, is_active, is_occupied)
SELECT 
  'SH-' || LPAD(row_num::text, 2, '0'),
  'Row ' || row_num,
  (SELECT id FROM warehouse_zones WHERE code = 'SHELF'),
  4000,
  0,
  true,
  false
FROM generate_series(1, 17) AS row_num
ON CONFLICT (code) DO NOTHING;
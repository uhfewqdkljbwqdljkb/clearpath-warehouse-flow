-- Sync existing company location assignments to client_allocations table
-- First, clear any existing allocations to avoid conflicts
DELETE FROM client_allocations 
WHERE company_id IN (
  SELECT id FROM companies 
  WHERE assigned_floor_zone_id IS NOT NULL OR assigned_row_id IS NOT NULL
);

-- Insert fresh allocations from companies table
INSERT INTO client_allocations (company_id, location_type, assigned_floor_zone_id, assigned_row_id)
SELECT 
  id,
  location_type,
  assigned_floor_zone_id,
  assigned_row_id
FROM companies
WHERE assigned_floor_zone_id IS NOT NULL OR assigned_row_id IS NOT NULL;
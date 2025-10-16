-- Remove storage plan, max storage, and monthly fee columns from companies table
ALTER TABLE companies 
DROP COLUMN IF EXISTS storage_plan,
DROP COLUMN IF EXISTS max_storage_cubic_feet,
DROP COLUMN IF EXISTS monthly_fee;
-- Add location type enum if not exists
DO $$ BEGIN
  CREATE TYPE location_type AS ENUM ('floor_zone', 'shelf_row');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add order type enum if not exists
DO $$ BEGIN
  CREATE TYPE order_type AS ENUM ('inbound', 'outbound');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add missing columns to companies table
ALTER TABLE public.companies
ADD COLUMN IF NOT EXISTS location_type location_type,
ADD COLUMN IF NOT EXISTS assigned_floor_zone_id uuid,
ADD COLUMN IF NOT EXISTS assigned_row_id uuid,
ADD COLUMN IF NOT EXISTS storage_plan text DEFAULT 'basic',
ADD COLUMN IF NOT EXISTS max_storage_cubic_feet numeric DEFAULT 1000,
ADD COLUMN IF NOT EXISTS monthly_fee numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS billing_address text,
ADD COLUMN IF NOT EXISTS contract_start_date date,
ADD COLUMN IF NOT EXISTS contract_end_date date,
ADD COLUMN IF NOT EXISTS contract_document_url text;

-- Add foreign keys if they don't exist
DO $$ BEGIN
  ALTER TABLE public.companies
    ADD CONSTRAINT fk_companies_floor_zone
    FOREIGN KEY (assigned_floor_zone_id)
    REFERENCES public.warehouse_zones(id)
    ON DELETE SET NULL;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE public.companies
    ADD CONSTRAINT fk_companies_row
    FOREIGN KEY (assigned_row_id)
    REFERENCES public.warehouse_rows(id)
    ON DELETE SET NULL;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add missing columns to warehouse_zones table
ALTER TABLE public.warehouse_zones
ADD COLUMN IF NOT EXISTS total_capacity_cubic_feet numeric DEFAULT 10000,
ADD COLUMN IF NOT EXISTS color text DEFAULT '#3B82F6',
ADD COLUMN IF NOT EXISTS code text;

-- Update zones with codes using a CTE
WITH zone_codes AS (
  SELECT id, CONCAT('Z', LPAD(ROW_NUMBER() OVER (ORDER BY created_at)::text, 3, '0')) as new_code
  FROM public.warehouse_zones
  WHERE code IS NULL OR code = ''
)
UPDATE public.warehouse_zones z
SET code = zc.new_code
FROM zone_codes zc
WHERE z.id = zc.id;

-- Add missing columns to warehouse_rows table
ALTER TABLE public.warehouse_rows
ADD COLUMN IF NOT EXISTS code text,
ADD COLUMN IF NOT EXISTS is_occupied boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS assigned_company_id uuid;

-- Add foreign key for warehouse_rows
DO $$ BEGIN
  ALTER TABLE public.warehouse_rows
    ADD CONSTRAINT fk_warehouse_rows_company
    FOREIGN KEY (assigned_company_id)
    REFERENCES public.companies(id)
    ON DELETE SET NULL;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Update rows with codes using a CTE
WITH row_codes AS (
  SELECT id, CONCAT('R', LPAD(ROW_NUMBER() OVER (ORDER BY created_at)::text, 4, '0')) as new_code
  FROM public.warehouse_rows
  WHERE code IS NULL OR code = ''
)
UPDATE public.warehouse_rows r
SET code = rc.new_code
FROM row_codes rc
WHERE r.id = rc.id;

-- Add missing columns to client_products table
ALTER TABLE public.client_products
ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

-- Add missing columns to client_orders table
ALTER TABLE public.client_orders
ADD COLUMN IF NOT EXISTS order_type order_type DEFAULT 'inbound',
ADD COLUMN IF NOT EXISTS requested_date timestamp with time zone,
ADD COLUMN IF NOT EXISTS completed_date timestamp with time zone;

-- Create client_order_items table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.client_order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.client_orders(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.client_products(id) ON DELETE CASCADE,
  quantity integer NOT NULL DEFAULT 0,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on client_order_items
ALTER TABLE public.client_order_items ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate them
DROP POLICY IF EXISTS "Admins can view all order items" ON public.client_order_items;
DROP POLICY IF EXISTS "Users can view own order items" ON public.client_order_items;
DROP POLICY IF EXISTS "Users can manage own order items" ON public.client_order_items;

-- Create RLS policies for client_order_items
CREATE POLICY "Admins can view all order items"
ON public.client_order_items
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view own order items"
ON public.client_order_items
FOR SELECT
USING (
  order_id IN (
    SELECT id FROM public.client_orders
    WHERE company_id IN (
      SELECT company_id FROM public.profiles WHERE id = auth.uid()
    )
  )
);

CREATE POLICY "Users can manage own order items"
ON public.client_order_items
FOR ALL
USING (
  order_id IN (
    SELECT id FROM public.client_orders
    WHERE company_id IN (
      SELECT company_id FROM public.profiles WHERE id = auth.uid()
    )
  )
);

-- Add trigger for client_order_items updated_at
DROP TRIGGER IF EXISTS update_client_order_items_updated_at ON public.client_order_items;
CREATE TRIGGER update_client_order_items_updated_at
  BEFORE UPDATE ON public.client_order_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_companies_assigned_floor_zone ON public.companies(assigned_floor_zone_id);
CREATE INDEX IF NOT EXISTS idx_companies_assigned_row ON public.companies(assigned_row_id);
CREATE INDEX IF NOT EXISTS idx_warehouse_rows_assigned_company ON public.warehouse_rows(assigned_company_id);
CREATE INDEX IF NOT EXISTS idx_client_order_items_order ON public.client_order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_client_order_items_product ON public.client_order_items(product_id);

-- Update warehouse rows occupancy based on assignments
UPDATE public.warehouse_rows
SET is_occupied = (assigned_company_id IS NOT NULL);
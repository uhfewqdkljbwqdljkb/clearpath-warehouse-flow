-- Create warehouse zones table
CREATE TABLE public.warehouse_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  zone_type TEXT NOT NULL CHECK (zone_type IN ('floor', 'shelf')),
  dimensions_length NUMERIC,
  dimensions_width NUMERIC,
  total_capacity_cubic_feet INTEGER,
  color TEXT DEFAULT '#3b82f6',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create warehouse rows table (for Zone Z shelving)
CREATE TABLE public.warehouse_rows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_id UUID REFERENCES public.warehouse_zones(id) ON DELETE CASCADE,
  row_number INTEGER NOT NULL,
  code TEXT UNIQUE NOT NULL,
  capacity_cubic_feet INTEGER,
  assigned_company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  is_occupied BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add zone assignment columns to companies table
ALTER TABLE public.companies
ADD COLUMN assigned_floor_zone_id UUID REFERENCES public.warehouse_zones(id) ON DELETE SET NULL,
ADD COLUMN assigned_row_id UUID REFERENCES public.warehouse_rows(id) ON DELETE SET NULL,
ADD COLUMN location_type TEXT CHECK (location_type IN ('floor_zone', 'shelf_row'));

-- Create trigger for updated_at on warehouse_zones
CREATE TRIGGER update_warehouse_zones_updated_at
BEFORE UPDATE ON public.warehouse_zones
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for updated_at on warehouse_rows
CREATE TRIGGER update_warehouse_rows_updated_at
BEFORE UPDATE ON public.warehouse_rows
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Seed floor zones (A-F)
INSERT INTO public.warehouse_zones (code, name, zone_type, dimensions_length, dimensions_width, total_capacity_cubic_feet, color) VALUES
('A', 'Zone A', 'floor', 40, 30, 5000, '#3b82f6'),
('B', 'Zone B', 'floor', 40, 30, 5000, '#8b5cf6'),
('C', 'Zone C', 'floor', 40, 30, 5000, '#ec4899'),
('D', 'Zone D', 'floor', 40, 30, 5000, '#f59e0b'),
('E', 'Zone E', 'floor', 40, 30, 5000, '#10b981'),
('F', 'Zone F', 'floor', 40, 30, 5000, '#06b6d4');

-- Seed shelf zone (Z)
INSERT INTO public.warehouse_zones (code, name, zone_type, total_capacity_cubic_feet, color) VALUES
('Z', 'Shelf Zone', 'shelf', 10000, '#6366f1');

-- Seed rows in Zone Z (50 rows)
INSERT INTO public.warehouse_rows (zone_id, row_number, code, capacity_cubic_feet)
SELECT 
  (SELECT id FROM public.warehouse_zones WHERE code = 'Z'),
  generate_series,
  'Z-R' || LPAD(generate_series::text, 3, '0'),
  200
FROM generate_series(1, 50);

-- Enable RLS on warehouse tables
ALTER TABLE public.warehouse_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warehouse_rows ENABLE ROW LEVEL SECURITY;

-- RLS Policies for warehouse_zones
CREATE POLICY "Admins can manage all zones"
ON public.warehouse_zones
FOR ALL
USING (is_admin(auth.uid()));

CREATE POLICY "Clients can view all zones"
ON public.warehouse_zones
FOR SELECT
USING (true);

-- RLS Policies for warehouse_rows
CREATE POLICY "Admins can manage all rows"
ON public.warehouse_rows
FOR ALL
USING (is_admin(auth.uid()));

CREATE POLICY "Clients can view all rows"
ON public.warehouse_rows
FOR SELECT
USING (true);

-- Create indexes for better performance
CREATE INDEX idx_warehouse_rows_zone_id ON public.warehouse_rows(zone_id);
CREATE INDEX idx_warehouse_rows_assigned_company ON public.warehouse_rows(assigned_company_id);
CREATE INDEX idx_companies_floor_zone ON public.companies(assigned_floor_zone_id);
CREATE INDEX idx_companies_row ON public.companies(assigned_row_id);
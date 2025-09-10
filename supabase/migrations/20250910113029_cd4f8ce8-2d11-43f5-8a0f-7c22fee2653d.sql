-- Add missing fields to companies table to support Client interface
ALTER TABLE public.companies 
ADD COLUMN client_code TEXT UNIQUE,
ADD COLUMN billing_address TEXT,
ADD COLUMN contract_start_date DATE,
ADD COLUMN contract_end_date DATE, 
ADD COLUMN storage_plan TEXT CHECK (storage_plan IN ('basic', 'premium', 'enterprise')),
ADD COLUMN max_storage_cubic_feet INTEGER,
ADD COLUMN monthly_fee DECIMAL(10,2),
ADD COLUMN is_active BOOLEAN DEFAULT true;

-- Update existing companies with default values
UPDATE public.companies 
SET 
  client_code = 'CLT' || LPAD(EXTRACT(epoch FROM created_at)::text, 6, '0'),
  storage_plan = 'basic',
  max_storage_cubic_feet = 1000,
  monthly_fee = 1200.00,
  is_active = true
WHERE client_code IS NULL;

-- Create index on client_code for performance
CREATE INDEX idx_companies_client_code ON public.companies(client_code);

-- Update RLS policies to allow admin access to all companies
CREATE POLICY "Admins can manage all companies" ON public.companies
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Function to generate unique client codes
CREATE OR REPLACE FUNCTION public.generate_client_code()
RETURNS TEXT AS $$
DECLARE
  new_code TEXT;
  counter INT := 1;
BEGIN
  LOOP
    new_code := 'CLT' || LPAD(counter::text, 3, '0');
    
    IF NOT EXISTS (SELECT 1 FROM public.companies WHERE client_code = new_code) THEN
      RETURN new_code;
    END IF;
    
    counter := counter + 1;
  END LOOP;
END;
$$ LANGUAGE plpgsql;
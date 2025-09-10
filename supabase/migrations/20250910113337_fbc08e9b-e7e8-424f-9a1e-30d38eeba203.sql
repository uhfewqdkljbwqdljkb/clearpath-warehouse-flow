-- Add missing fields to companies table to support Client interface
ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS client_code TEXT,
ADD COLUMN IF NOT EXISTS billing_address TEXT,
ADD COLUMN IF NOT EXISTS contract_start_date DATE,
ADD COLUMN IF NOT EXISTS contract_end_date DATE, 
ADD COLUMN IF NOT EXISTS storage_plan TEXT,
ADD COLUMN IF NOT EXISTS max_storage_cubic_feet INTEGER,
ADD COLUMN IF NOT EXISTS monthly_fee DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Add constraint for storage_plan after column exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'companies_storage_plan_check') THEN
        ALTER TABLE public.companies ADD CONSTRAINT companies_storage_plan_check 
        CHECK (storage_plan IN ('basic', 'premium', 'enterprise'));
    END IF;
END $$;

-- Update existing companies with unique client codes
DO $$
DECLARE
    company_record record;
    counter int := 1;
    new_code text;
BEGIN
    FOR company_record IN 
        SELECT id FROM public.companies WHERE client_code IS NULL
    LOOP
        LOOP
            new_code := 'CLT' || LPAD(counter::text, 3, '0');
            
            IF NOT EXISTS (SELECT 1 FROM public.companies WHERE client_code = new_code) THEN
                UPDATE public.companies 
                SET 
                    client_code = new_code,
                    storage_plan = COALESCE(storage_plan, 'basic'),
                    max_storage_cubic_feet = COALESCE(max_storage_cubic_feet, 1000),
                    monthly_fee = COALESCE(monthly_fee, 1200.00),
                    is_active = COALESCE(is_active, true)
                WHERE id = company_record.id;
                EXIT;
            END IF;
            
            counter := counter + 1;
        END LOOP;
    END LOOP;
END $$;

-- Add unique constraint on client_code
ALTER TABLE public.companies ADD CONSTRAINT companies_client_code_unique 
UNIQUE (client_code);

-- Create index on client_code for performance  
CREATE INDEX IF NOT EXISTS idx_companies_client_code ON public.companies(client_code);

-- Update RLS policies to allow admin access to all companies
DROP POLICY IF EXISTS "Admins can manage all companies" ON public.companies;
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
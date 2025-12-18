-- Create a secure function for client users to get their company info with limited sensitive data
-- This prevents exposure of billing_address and contract_document_url to regular client users

CREATE OR REPLACE FUNCTION public.get_my_company_info()
RETURNS TABLE (
  id uuid,
  name text,
  client_code text,
  client_type text,
  is_active boolean,
  address text,
  contact_email text,
  contact_phone text,
  location_type location_type,
  assigned_floor_zone_id uuid,
  assigned_row_id uuid,
  contract_start_date date,
  contract_end_date date,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    c.id,
    c.name,
    c.client_code,
    c.client_type,
    c.is_active,
    c.address,
    c.contact_email,
    c.contact_phone,
    c.location_type,
    c.assigned_floor_zone_id,
    c.assigned_row_id,
    c.contract_start_date,
    c.contract_end_date,
    c.created_at,
    c.updated_at
  FROM public.companies c
  WHERE c.id = (
    SELECT company_id FROM public.profiles WHERE id = auth.uid()
  )
$$;

-- Drop the overly permissive policy that exposes all company fields
DROP POLICY IF EXISTS "Users can view their own company" ON public.companies;

-- Create a more restrictive policy - regular users should use the function instead
-- Only client_admin role can directly query the companies table for their company
CREATE POLICY "Client admins can view own company"
ON public.companies
FOR SELECT
USING (
  (auth.uid() IS NOT NULL) AND 
  (id IN (SELECT company_id FROM profiles WHERE id = auth.uid())) AND
  has_role(auth.uid(), 'client_admin'::app_role)
);

-- Note: Regular client_user role members should use get_my_company_info() function
-- which deliberately excludes billing_address and contract_document_url
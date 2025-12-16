-- Drop existing policies on companies table
DROP POLICY IF EXISTS "Admins can delete companies" ON public.companies;
DROP POLICY IF EXISTS "Admins can insert companies" ON public.companies;
DROP POLICY IF EXISTS "Admins can update companies" ON public.companies;
DROP POLICY IF EXISTS "Admins can view all companies" ON public.companies;
DROP POLICY IF EXISTS "Users can view their own company" ON public.companies;

-- Recreate policies with explicit authentication checks
CREATE POLICY "Admins can delete companies" 
ON public.companies 
FOR DELETE 
TO authenticated
USING (
  auth.uid() IS NOT NULL 
  AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role))
);

CREATE POLICY "Admins can insert companies" 
ON public.companies 
FOR INSERT 
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role))
);

CREATE POLICY "Admins can update companies" 
ON public.companies 
FOR UPDATE 
TO authenticated
USING (
  auth.uid() IS NOT NULL 
  AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role))
);

CREATE POLICY "Admins can view all companies" 
ON public.companies 
FOR SELECT 
TO authenticated
USING (
  auth.uid() IS NOT NULL 
  AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role))
);

CREATE POLICY "Users can view their own company" 
ON public.companies 
FOR SELECT 
TO authenticated
USING (
  auth.uid() IS NOT NULL 
  AND id IN (
    SELECT company_id 
    FROM profiles 
    WHERE profiles.id = auth.uid()
  )
);
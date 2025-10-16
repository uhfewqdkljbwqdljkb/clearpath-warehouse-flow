-- Drop the existing "Users can manage own products" policy
DROP POLICY IF EXISTS "Users can manage own products" ON public.client_products;

-- Create separate policies for users and admins
-- Users can only manage their own company's products
CREATE POLICY "Users can insert own products" 
ON public.client_products 
FOR INSERT 
TO authenticated
WITH CHECK (
  company_id IN (
    SELECT profiles.company_id
    FROM profiles
    WHERE profiles.id = auth.uid()
  )
);

CREATE POLICY "Users can update own products" 
ON public.client_products 
FOR UPDATE 
TO authenticated
USING (
  company_id IN (
    SELECT profiles.company_id
    FROM profiles
    WHERE profiles.id = auth.uid()
  )
);

CREATE POLICY "Users can delete own products" 
ON public.client_products 
FOR DELETE 
TO authenticated
USING (
  company_id IN (
    SELECT profiles.company_id
    FROM profiles
    WHERE profiles.id = auth.uid()
  )
);

-- Admins can manage all products
CREATE POLICY "Admins can insert all products" 
ON public.client_products 
FOR INSERT 
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update all products" 
ON public.client_products 
FOR UPDATE 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete all products" 
ON public.client_products 
FOR DELETE 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));
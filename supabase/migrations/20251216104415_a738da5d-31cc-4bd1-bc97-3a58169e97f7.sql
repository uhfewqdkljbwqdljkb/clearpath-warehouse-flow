-- Drop existing profiles policies and recreate with explicit TO authenticated
DROP POLICY IF EXISTS "Admins can delete profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Client admins can update company profiles" ON public.profiles;
DROP POLICY IF EXISTS "Client admins can view company users" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

-- Recreate all policies with explicit TO authenticated clause

-- Admin policies
CREATE POLICY "Admins can delete profiles"
ON public.profiles
FOR DELETE
TO authenticated
USING (
  auth.uid() IS NOT NULL 
  AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role))
);

CREATE POLICY "Admins can insert profiles"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role))
);

CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  auth.uid() IS NOT NULL 
  AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role))
);

-- Client admin policies
CREATE POLICY "Client admins can update company profiles"
ON public.profiles
FOR UPDATE
TO authenticated
USING (
  auth.uid() IS NOT NULL 
  AND company_id = get_user_company_id(auth.uid()) 
  AND has_role(auth.uid(), 'client_admin'::app_role)
)
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND company_id = get_user_company_id(auth.uid()) 
  AND has_role(auth.uid(), 'client_admin'::app_role)
);

CREATE POLICY "Client admins can view company users"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  auth.uid() IS NOT NULL 
  AND company_id = get_user_company_id(auth.uid()) 
  AND has_role(auth.uid(), 'client_admin'::app_role)
);

-- User self-access policies
CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() IS NOT NULL AND id = auth.uid());

CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL AND id = auth.uid());
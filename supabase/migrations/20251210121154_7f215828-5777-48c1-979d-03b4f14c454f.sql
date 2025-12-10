-- Drop existing SELECT policies on profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Client admins can view company users" ON public.profiles;

-- Recreate policies with explicit authentication requirement using TO authenticated
CREATE POLICY "Users can view own profile" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (id = auth.uid());

CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Client admins can view company users" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING ((company_id = get_user_company_id(auth.uid())) AND has_role(auth.uid(), 'client_admin'));
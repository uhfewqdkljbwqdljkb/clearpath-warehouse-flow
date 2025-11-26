-- Fix recursive RLS policies on profiles

-- 1) Drop the problematic policies that reference profiles inside their own policy
DROP POLICY IF EXISTS "Client admins can view company users" ON public.profiles;
DROP POLICY IF EXISTS "Client admins can update company profiles" ON public.profiles;

-- 2) Helper function to safely get a user's company_id without triggering RLS recursion
CREATE OR REPLACE FUNCTION public.get_user_company_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT company_id
  FROM public.profiles
  WHERE id = _user_id;
$$;

-- 3) Recreate client-admin policies using security definer functions only

-- Allow client admins to view profiles in their own company
CREATE POLICY "Client admins can view company users"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  company_id = public.get_user_company_id(auth.uid())
  AND public.has_role(auth.uid(), 'client_admin')
);

-- Allow client admins to update profiles in their own company
CREATE POLICY "Client admins can update company profiles"
ON public.profiles
FOR UPDATE
TO authenticated
USING (
  company_id = public.get_user_company_id(auth.uid())
  AND public.has_role(auth.uid(), 'client_admin')
)
WITH CHECK (
  company_id = public.get_user_company_id(auth.uid())
  AND public.has_role(auth.uid(), 'client_admin')
);
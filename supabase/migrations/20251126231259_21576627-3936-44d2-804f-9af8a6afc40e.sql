-- Fix recursive RLS policies on user_roles that cause infinite recursion when checking roles

-- 1) Drop problematic policies that reference has_role() or user_roles inside user_roles policies
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Client admins can manage company user roles" ON public.user_roles;

-- 2) Keep the simple, non-recursive SELECT policy that lets users see their own roles
--    (already exists as "Users can view own roles"). If it didn't exist, we would recreate it here:
--
-- CREATE POLICY "Users can view own roles"
-- ON public.user_roles
-- FOR SELECT
-- TO authenticated
-- USING (user_id = auth.uid());

-- NOTE: Role management (granting/removing roles) should be done via privileged edge functions
-- using the service role key, not directly from the client, to avoid RLS recursion issues.
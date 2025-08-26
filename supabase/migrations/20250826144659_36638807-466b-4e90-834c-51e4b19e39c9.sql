-- Fix infinite recursion in companies RLS policies
-- Similar issue as profiles - policies checking profiles table cause circular dependency

-- Drop the problematic policies that reference profiles table
DROP POLICY IF EXISTS "Admins can manage companies" ON public.companies;
DROP POLICY IF EXISTS "Admins can view all companies" ON public.companies;

-- Keep the client policy as it doesn't cause recursion
-- "Clients can view their own company" is fine - it just checks company_id

-- For now, we'll handle admin access to companies in the application layer
-- to avoid circular dependencies in RLS policies
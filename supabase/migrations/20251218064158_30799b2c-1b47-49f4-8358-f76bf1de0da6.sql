-- Fix: Create a secure function for messaging that only exposes necessary staff info (name, not email/phone)
-- This replaces the need for direct profile lookups when selecting message recipients

-- Create a function to get staff members for messaging (returns only id and name, not email/phone)
CREATE OR REPLACE FUNCTION public.get_staff_for_messaging()
RETURNS TABLE (
  user_id uuid,
  full_name text,
  role app_role
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    ur.user_id,
    p.full_name,
    ur.role
  FROM public.user_roles ur
  JOIN public.profiles p ON p.id = ur.user_id
  WHERE ur.role IN ('admin', 'super_admin', 'warehouse_manager', 'logistics_coordinator')
$$;

-- Drop the overly permissive policy on user_roles that allows any authenticated user to see staff roles
DROP POLICY IF EXISTS "Authenticated users can view staff roles for messaging" ON public.user_roles;

-- Create a more restrictive policy - users can only see their own roles or use the secure function
-- Staff visibility is now handled through the get_staff_for_messaging function instead
CREATE POLICY "Users can only view own roles"
ON public.user_roles
FOR SELECT
USING (user_id = auth.uid());

-- Note: Admins already have full access through existing policies
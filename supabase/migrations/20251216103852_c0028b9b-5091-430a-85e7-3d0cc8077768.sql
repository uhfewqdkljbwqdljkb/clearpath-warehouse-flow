-- Drop the existing policy and recreate with explicit authenticated requirement
DROP POLICY IF EXISTS "Authenticated users can view staff roles for messaging" ON public.user_roles;

-- Recreate with explicit TO authenticated clause and auth check
CREATE POLICY "Authenticated users can view staff roles for messaging"
ON public.user_roles
FOR SELECT
TO authenticated
USING (
  auth.uid() IS NOT NULL 
  AND role = ANY (ARRAY['admin'::app_role, 'super_admin'::app_role, 'warehouse_manager'::app_role, 'logistics_coordinator'::app_role])
);
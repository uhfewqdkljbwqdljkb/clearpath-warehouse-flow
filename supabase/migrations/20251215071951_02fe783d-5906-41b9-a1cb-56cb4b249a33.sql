-- Allow all authenticated users to view admin/staff roles for messaging feature
-- This is needed so clients can see who they can message
CREATE POLICY "Authenticated users can view staff roles for messaging"
ON public.user_roles
FOR SELECT
USING (
  role IN ('admin', 'super_admin', 'warehouse_manager', 'logistics_coordinator')
);
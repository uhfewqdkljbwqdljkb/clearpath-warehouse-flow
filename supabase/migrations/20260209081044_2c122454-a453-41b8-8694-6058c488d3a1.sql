-- Fix client_activity_logs INSERT policy
-- Current policy only allows users to insert activity for their OWN company
-- This fails when admin users view as client (admin's company_id is null but they're inserting for a client company)

-- Drop the existing INSERT policy
DROP POLICY IF EXISTS "Users can insert own activity" ON public.client_activity_logs;

-- Create a new INSERT policy that allows:
-- 1. Regular client users to insert activity for their own company
-- 2. Admin/super_admin users to insert activity for any company (needed for "View as Client" feature)
CREATE POLICY "Users can insert own activity" 
ON public.client_activity_logs 
FOR INSERT 
TO authenticated
WITH CHECK (
  (user_id = auth.uid()) 
  AND (
    -- Regular users: company_id must match their own
    (company_id IN (SELECT profiles.company_id FROM profiles WHERE profiles.id = auth.uid()))
    OR
    -- Admin users: can log activity for any company (View as Client feature)
    has_role(auth.uid(), 'admin'::app_role)
    OR
    has_role(auth.uid(), 'super_admin'::app_role)
    OR
    has_role(auth.uid(), 'warehouse_manager'::app_role)
    OR
    has_role(auth.uid(), 'logistics_coordinator'::app_role)
  )
);
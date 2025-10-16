-- Fix: Restrict activity log insertion to authenticated users logging their own activities
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Authenticated users can insert activity" ON client_activity_logs;

-- Create a secure policy that validates user_id and company_id
CREATE POLICY "Users can insert own activity"
ON client_activity_logs
FOR INSERT
WITH CHECK (
  user_id = auth.uid() 
  AND company_id IN (
    SELECT company_id FROM profiles WHERE id = auth.uid()
  )
);
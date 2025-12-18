-- Add policy for users to update their own pending check-out requests
CREATE POLICY "Users can update own pending check-out requests" 
ON public.check_out_requests 
FOR UPDATE 
USING (
  (company_id IN ( 
    SELECT profiles.company_id
    FROM profiles
    WHERE profiles.id = auth.uid()
  )) 
  AND status = 'pending'
  AND reviewed_by IS NULL
)
WITH CHECK (
  (company_id IN ( 
    SELECT profiles.company_id
    FROM profiles
    WHERE profiles.id = auth.uid()
  )) 
  AND status = 'pending'
);
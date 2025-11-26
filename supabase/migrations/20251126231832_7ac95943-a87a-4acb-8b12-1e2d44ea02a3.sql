-- Add RLS policy to allow clients to update their own pending check-in requests
CREATE POLICY "Users can update own pending check-in requests"
ON public.check_in_requests
FOR UPDATE
TO authenticated
USING (
  company_id IN (
    SELECT company_id FROM public.profiles WHERE id = auth.uid()
  )
  AND status = 'pending'
  AND reviewed_by IS NULL
  AND (was_amended IS NULL OR was_amended = false)
)
WITH CHECK (
  company_id IN (
    SELECT company_id FROM public.profiles WHERE id = auth.uid()
  )
  AND status = 'pending'
);
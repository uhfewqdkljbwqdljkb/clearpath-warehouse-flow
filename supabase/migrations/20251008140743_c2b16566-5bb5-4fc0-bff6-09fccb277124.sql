-- Add RLS policies for client-contracts storage bucket
-- Allow admins full access and clients to view their own contracts

-- Policy for admins to have full access to all contracts
CREATE POLICY "Admins can manage all contracts"
ON storage.objects
FOR ALL
TO authenticated
USING (
  bucket_id = 'client-contracts' 
  AND is_admin(auth.uid())
)
WITH CHECK (
  bucket_id = 'client-contracts' 
  AND is_admin(auth.uid())
);

-- Policy for clients to view their own company's contracts
CREATE POLICY "Clients can view their company contracts"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'client-contracts'
  AND (storage.foldername(name))[1] = 'contracts'
  AND EXISTS (
    SELECT 1 
    FROM companies c
    INNER JOIN profiles p ON p.company_id = c.id
    WHERE p.user_id = auth.uid()
    AND c.contract_document_url = name
  )
);
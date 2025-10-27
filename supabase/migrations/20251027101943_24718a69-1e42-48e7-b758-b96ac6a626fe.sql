-- Storage policies for contract documents bucket
-- Drop existing policies if they exist, then create new ones

DROP POLICY IF EXISTS "Admins can view all contract documents" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload contract documents" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update contract documents" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete contract documents" ON storage.objects;

-- Allow admins to view all contract documents
CREATE POLICY "Admins can view all contract documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'contract-documents' 
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- Allow admins to upload contract documents
CREATE POLICY "Admins can upload contract documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'contract-documents'
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- Allow admins to update contract documents
CREATE POLICY "Admins can update contract documents"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'contract-documents'
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- Allow admins to delete contract documents
CREATE POLICY "Admins can delete contract documents"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'contract-documents'
  AND has_role(auth.uid(), 'admin'::app_role)
);
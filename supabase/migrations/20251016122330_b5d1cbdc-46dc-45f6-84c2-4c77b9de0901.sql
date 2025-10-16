-- Add variants column to client_products table
ALTER TABLE client_products 
ADD COLUMN IF NOT EXISTS variants jsonb DEFAULT '[]'::jsonb;

-- Create storage bucket for contract documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('contract-documents', 'contract-documents', false)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for contract-documents bucket
CREATE POLICY "Admins can upload contract documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'contract-documents' AND
  (SELECT has_role(auth.uid(), 'admin'))
);

CREATE POLICY "Admins can view all contract documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'contract-documents' AND
  (SELECT has_role(auth.uid(), 'admin'))
);

CREATE POLICY "Clients can view their own contract documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'contract-documents' AND
  (storage.foldername(name))[1] IN (
    SELECT company_id::text 
    FROM profiles 
    WHERE id = auth.uid()
  )
);

CREATE POLICY "Admins can delete contract documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'contract-documents' AND
  (SELECT has_role(auth.uid(), 'admin'))
);
-- Create storage bucket for client contracts
INSERT INTO storage.buckets (id, name, public)
VALUES ('client-contracts', 'client-contracts', false);

-- Allow authenticated admins to upload contracts
CREATE POLICY "Admins can upload contracts"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'client-contracts' 
  AND (EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role IN ('admin', 'super_admin', 'warehouse_manager')
  ))
);

-- Allow authenticated admins to view contracts
CREATE POLICY "Admins can view contracts"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'client-contracts'
  AND (EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role IN ('admin', 'super_admin', 'warehouse_manager')
  ))
);

-- Allow authenticated admins to update contracts
CREATE POLICY "Admins can update contracts"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'client-contracts'
  AND (EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role IN ('admin', 'super_admin', 'warehouse_manager')
  ))
);

-- Allow authenticated admins to delete contracts
CREATE POLICY "Admins can delete contracts"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'client-contracts'
  AND (EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.user_id = auth.uid() 
    AND profiles.role IN ('admin', 'super_admin', 'warehouse_manager')
  ))
);

-- Add contract_document_url column to companies table
ALTER TABLE public.companies
ADD COLUMN contract_document_url TEXT;
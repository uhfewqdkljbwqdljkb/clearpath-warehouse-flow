-- Add DELETE policy for companies table
CREATE POLICY "Admins can delete companies"
ON public.companies
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));
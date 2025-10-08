-- Add RLS policy to allow admins to insert products for any client
CREATE POLICY "Admins can create products for any client"
ON public.client_products
FOR INSERT
TO authenticated
WITH CHECK (is_admin(auth.uid()));

-- Add RLS policy to allow admins to update any products
CREATE POLICY "Admins can update any products"
ON public.client_products
FOR UPDATE
TO authenticated
USING (is_admin(auth.uid()));

-- Add RLS policy to allow admins to delete any products
CREATE POLICY "Admins can delete any products"
ON public.client_products
FOR DELETE
TO authenticated
USING (is_admin(auth.uid()));
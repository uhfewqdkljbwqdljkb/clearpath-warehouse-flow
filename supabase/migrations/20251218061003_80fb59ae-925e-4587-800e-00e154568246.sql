-- Add value column to client_products table
ALTER TABLE public.client_products 
ADD COLUMN value numeric DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.client_products.value IS 'Dollar value assigned to the product by the client';
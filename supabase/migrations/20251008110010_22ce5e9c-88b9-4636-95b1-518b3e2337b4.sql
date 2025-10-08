-- Add variants column to client_products table to store product variant information
ALTER TABLE public.client_products
ADD COLUMN variants JSONB DEFAULT '[]'::jsonb;

-- Add a comment to describe the structure
COMMENT ON COLUMN public.client_products.variants IS 'Stores product variants as array of objects with structure: [{attribute: string, values: [{value: string, quantity: number}]}]';
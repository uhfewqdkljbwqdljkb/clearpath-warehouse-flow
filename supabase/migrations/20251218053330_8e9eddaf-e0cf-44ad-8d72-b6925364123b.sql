-- Add minimum_quantity column to client_products table for stock health monitoring
ALTER TABLE public.client_products 
ADD COLUMN minimum_quantity integer DEFAULT 0;

-- Add comment for documentation
COMMENT ON COLUMN public.client_products.minimum_quantity IS 'Minimum stock level threshold for low stock alerts';
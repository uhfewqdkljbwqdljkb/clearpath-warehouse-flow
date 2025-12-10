-- Add supplier_id and customer_id columns to client_products for B2B product tracking
ALTER TABLE public.client_products
ADD COLUMN supplier_id uuid REFERENCES public.b2b_suppliers(id) ON DELETE SET NULL,
ADD COLUMN customer_id uuid REFERENCES public.b2b_customers(id) ON DELETE SET NULL;

-- Add indexes for faster lookups
CREATE INDEX idx_client_products_supplier_id ON public.client_products(supplier_id);
CREATE INDEX idx_client_products_customer_id ON public.client_products(customer_id);

-- Add comment for documentation
COMMENT ON COLUMN public.client_products.supplier_id IS 'B2B: The supplier this product is sourced from';
COMMENT ON COLUMN public.client_products.customer_id IS 'B2B: The designated customer this product is shipped to';
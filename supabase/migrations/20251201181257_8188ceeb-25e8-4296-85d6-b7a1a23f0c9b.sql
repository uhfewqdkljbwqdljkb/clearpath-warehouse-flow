-- Add client_type column to companies table
ALTER TABLE companies 
ADD COLUMN client_type text DEFAULT 'ecommerce' 
CHECK (client_type IN ('ecommerce', 'b2b'));

-- Create b2b_suppliers table for B2B clients to manage their suppliers
CREATE TABLE public.b2b_suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  supplier_name text NOT NULL,
  representative_name text NOT NULL,
  location text NOT NULL,
  phone text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on b2b_suppliers
ALTER TABLE public.b2b_suppliers ENABLE ROW LEVEL SECURITY;

-- RLS policies for b2b_suppliers
CREATE POLICY "B2B clients can manage own suppliers"
ON public.b2b_suppliers
FOR ALL
USING (company_id IN (
  SELECT company_id FROM profiles WHERE id = auth.uid()
));

CREATE POLICY "Admins can view all suppliers"
ON public.b2b_suppliers
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

-- Create b2b_customers table for B2B clients to manage their customers
CREATE TABLE public.b2b_customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  customer_name text NOT NULL,
  representative_name text NOT NULL,
  location text NOT NULL,
  phone text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on b2b_customers
ALTER TABLE public.b2b_customers ENABLE ROW LEVEL SECURITY;

-- RLS policies for b2b_customers
CREATE POLICY "B2B clients can manage own customers"
ON public.b2b_customers
FOR ALL
USING (company_id IN (
  SELECT company_id FROM profiles WHERE id = auth.uid()
));

CREATE POLICY "Admins can view all customers"
ON public.b2b_customers
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

-- Extend check_in_requests for supplier sourcing
ALTER TABLE check_in_requests
ADD COLUMN request_type text DEFAULT 'standard' CHECK (request_type IN ('standard', 'supplier_sourcing')),
ADD COLUMN supplier_id uuid REFERENCES public.b2b_suppliers(id) ON DELETE SET NULL,
ADD COLUMN required_date date;

-- Extend check_out_requests for customer shipment
ALTER TABLE check_out_requests
ADD COLUMN request_type text DEFAULT 'standard' CHECK (request_type IN ('standard', 'customer_shipment')),
ADD COLUMN customer_id uuid REFERENCES public.b2b_customers(id) ON DELETE SET NULL,
ADD COLUMN delivery_date date;

-- Add triggers for updated_at on new tables
CREATE TRIGGER update_b2b_suppliers_updated_at
BEFORE UPDATE ON public.b2b_suppliers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_b2b_customers_updated_at
BEFORE UPDATE ON public.b2b_customers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
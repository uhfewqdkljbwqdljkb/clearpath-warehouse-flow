-- Create shipments table
CREATE TABLE public.shipments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_number TEXT UNIQUE NOT NULL,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.client_orders(id) ON DELETE SET NULL,
  shipment_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  tracking_number TEXT,
  carrier TEXT,
  destination_address TEXT NOT NULL,
  destination_contact TEXT,
  destination_phone TEXT,
  notes TEXT,
  shipped_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create shipment_items table
CREATE TABLE public.shipment_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id UUID NOT NULL REFERENCES public.shipments(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.client_products(id) ON DELETE CASCADE,
  variant_attribute TEXT,
  variant_value TEXT,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create function to generate shipment numbers
CREATE OR REPLACE FUNCTION public.generate_shipment_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_number TEXT;
  number_exists BOOLEAN;
BEGIN
  LOOP
    new_number := 'SHIP-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 9999)::TEXT, 4, '0');
    SELECT EXISTS(SELECT 1 FROM shipments WHERE shipment_number = new_number) INTO number_exists;
    EXIT WHEN NOT number_exists;
  END LOOP;
  RETURN new_number;
END;
$$;

-- Enable RLS on shipments
ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;

-- RLS policies for shipments
CREATE POLICY "Admins can manage all shipments"
ON public.shipments
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Clients can view own shipments"
ON public.shipments
FOR SELECT
TO authenticated
USING (
  company_id IN (
    SELECT company_id FROM public.profiles WHERE id = auth.uid()
  )
);

-- Enable RLS on shipment_items
ALTER TABLE public.shipment_items ENABLE ROW LEVEL SECURITY;

-- RLS policies for shipment_items
CREATE POLICY "Admins can manage all shipment items"
ON public.shipment_items
FOR ALL
TO authenticated
USING (
  shipment_id IN (
    SELECT id FROM public.shipments WHERE public.has_role(auth.uid(), 'admin'::app_role)
  )
);

CREATE POLICY "Clients can view own shipment items"
ON public.shipment_items
FOR SELECT
TO authenticated
USING (
  shipment_id IN (
    SELECT id FROM public.shipments 
    WHERE company_id IN (
      SELECT company_id FROM public.profiles WHERE id = auth.uid()
    )
  )
);

-- Add trigger for updated_at on shipments
CREATE TRIGGER update_shipments_updated_at
  BEFORE UPDATE ON public.shipments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for shipments
ALTER PUBLICATION supabase_realtime ADD TABLE public.shipments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.shipment_items;
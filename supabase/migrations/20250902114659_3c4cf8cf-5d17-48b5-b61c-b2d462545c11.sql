-- Create client_products table for client-specific product catalog
CREATE TABLE public.client_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  sku TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  dimensions_length DECIMAL,
  dimensions_width DECIMAL,
  dimensions_height DECIMAL,
  weight DECIMAL,
  unit_value DECIMAL,
  storage_requirements TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(company_id, sku)
);

-- Create inventory_items table linking client products to warehouse locations
CREATE TABLE public.inventory_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_product_id UUID NOT NULL REFERENCES public.client_products(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 0,
  location_zone TEXT,
  location_row TEXT,
  location_bin TEXT,
  location_code TEXT,
  last_movement_date TIMESTAMP WITH TIME ZONE,
  movement_type TEXT, -- 'receive', 'ship', 'move'
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create client_orders table for client requests
CREATE TABLE public.client_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  order_number TEXT NOT NULL,
  order_type TEXT NOT NULL, -- 'receive', 'ship'
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'in_progress', 'completed', 'cancelled'
  requested_date DATE,
  completed_date DATE,
  notes TEXT,
  created_by UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create client_order_items table for items in orders
CREATE TABLE public.client_order_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.client_orders(id) ON DELETE CASCADE,
  client_product_id UUID NOT NULL REFERENCES public.client_products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL,
  unit_value DECIMAL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.client_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_order_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for client_products
CREATE POLICY "Clients can view their own products" 
ON public.client_products 
FOR SELECT 
USING (company_id IN (
  SELECT company_id FROM public.profiles WHERE user_id = auth.uid()
));

CREATE POLICY "Clients can create their own products" 
ON public.client_products 
FOR INSERT 
WITH CHECK (company_id IN (
  SELECT company_id FROM public.profiles WHERE user_id = auth.uid()
));

CREATE POLICY "Clients can update their own products" 
ON public.client_products 
FOR UPDATE 
USING (company_id IN (
  SELECT company_id FROM public.profiles WHERE user_id = auth.uid()
));

-- RLS Policies for inventory_items
CREATE POLICY "Clients can view their own inventory" 
ON public.inventory_items 
FOR SELECT 
USING (company_id IN (
  SELECT company_id FROM public.profiles WHERE user_id = auth.uid()
));

-- RLS Policies for client_orders
CREATE POLICY "Clients can view their own orders" 
ON public.client_orders 
FOR SELECT 
USING (company_id IN (
  SELECT company_id FROM public.profiles WHERE user_id = auth.uid()
));

CREATE POLICY "Clients can create their own orders" 
ON public.client_orders 
FOR INSERT 
WITH CHECK (company_id IN (
  SELECT company_id FROM public.profiles WHERE user_id = auth.uid()
) AND created_by = auth.uid());

CREATE POLICY "Clients can update their own orders" 
ON public.client_orders 
FOR UPDATE 
USING (company_id IN (
  SELECT company_id FROM public.profiles WHERE user_id = auth.uid()
));

-- RLS Policies for client_order_items
CREATE POLICY "Clients can view their own order items" 
ON public.client_order_items 
FOR SELECT 
USING (order_id IN (
  SELECT id FROM public.client_orders 
  WHERE company_id IN (
    SELECT company_id FROM public.profiles WHERE user_id = auth.uid()
  )
));

CREATE POLICY "Clients can create their own order items" 
ON public.client_order_items 
FOR INSERT 
WITH CHECK (order_id IN (
  SELECT id FROM public.client_orders 
  WHERE company_id IN (
    SELECT company_id FROM public.profiles WHERE user_id = auth.uid()
  )
));

-- Add triggers for automatic timestamp updates
CREATE TRIGGER update_client_products_updated_at
BEFORE UPDATE ON public.client_products
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_inventory_items_updated_at
BEFORE UPDATE ON public.inventory_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_client_orders_updated_at
BEFORE UPDATE ON public.client_orders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_client_products_company_id ON public.client_products(company_id);
CREATE INDEX idx_inventory_items_company_id ON public.inventory_items(company_id);
CREATE INDEX idx_inventory_items_client_product_id ON public.inventory_items(client_product_id);
CREATE INDEX idx_client_orders_company_id ON public.client_orders(company_id);
CREATE INDEX idx_client_order_items_order_id ON public.client_order_items(order_id);
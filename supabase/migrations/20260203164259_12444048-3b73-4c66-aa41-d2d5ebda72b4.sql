-- =============================================
-- DELIVERY MANAGEMENT SYSTEM SCHEMA
-- =============================================

-- 1. Delivery Carriers Table
CREATE TABLE public.delivery_carriers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  carrier_type TEXT NOT NULL,
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  api_enabled BOOLEAN DEFAULT FALSE,
  api_endpoint TEXT,
  api_key_encrypted TEXT,
  api_settings JSONB DEFAULT '{}',
  base_rate DECIMAL(12,2) DEFAULT 0,
  per_kg_rate DECIMAL(12,2) DEFAULT 0,
  pricing_zones JSONB DEFAULT '{}',
  service_areas TEXT[],
  estimated_days_domestic INTEGER DEFAULT 3,
  estimated_days_international INTEGER DEFAULT 7,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Delivery Drivers Table
CREATE TABLE public.delivery_drivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  carrier_id UUID REFERENCES public.delivery_carriers(id),
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT NOT NULL,
  photo_url TEXT,
  vehicle_type TEXT,
  vehicle_plate TEXT,
  status TEXT DEFAULT 'available',
  current_location JSONB,
  total_deliveries INTEGER DEFAULT 0,
  successful_deliveries INTEGER DEFAULT 0,
  average_rating DECIMAL(3,2) DEFAULT 5.0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Delivery Orders Table
CREATE TABLE public.delivery_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE NOT NULL,
  company_id UUID REFERENCES public.companies(id) NOT NULL,
  check_out_request_id UUID REFERENCES public.check_out_requests(id),
  source TEXT NOT NULL DEFAULT 'manual',
  external_order_id TEXT,
  external_order_number TEXT,
  recipient_name TEXT NOT NULL,
  recipient_email TEXT,
  recipient_phone TEXT,
  shipping_address_line1 TEXT NOT NULL,
  shipping_address_line2 TEXT,
  shipping_city TEXT NOT NULL,
  shipping_state TEXT,
  shipping_postal_code TEXT,
  shipping_country TEXT NOT NULL DEFAULT 'Lebanon',
  delivery_type TEXT NOT NULL DEFAULT 'standard',
  scheduled_date DATE,
  scheduled_time_slot TEXT,
  delivery_instructions TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  status_history JSONB DEFAULT '[]',
  carrier_id UUID REFERENCES public.delivery_carriers(id),
  driver_id UUID REFERENCES public.delivery_drivers(id),
  tracking_number TEXT,
  tracking_url TEXT,
  subtotal DECIMAL(12,2) DEFAULT 0,
  shipping_cost DECIMAL(12,2) DEFAULT 0,
  tax_amount DECIMAL(12,2) DEFAULT 0,
  discount_amount DECIMAL(12,2) DEFAULT 0,
  total_amount DECIMAL(12,2) DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  fulfillment_cost DECIMAL(12,2) DEFAULT 0,
  carrier_cost DECIMAL(12,2) DEFAULT 0,
  packaging_cost DECIMAL(12,2) DEFAULT 0,
  total_cost DECIMAL(12,2) DEFAULT 0,
  profit_margin DECIMAL(12,2) DEFAULT 0,
  confirmed_at TIMESTAMPTZ,
  picked_at TIMESTAMPTZ,
  packed_at TIMESTAMPTZ,
  shipped_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  notes TEXT,
  internal_notes TEXT,
  tags TEXT[],
  metadata JSONB DEFAULT '{}'
);

-- 4. Delivery Order Items Table
CREATE TABLE public.delivery_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_order_id UUID REFERENCES public.delivery_orders(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.client_products(id),
  product_name TEXT NOT NULL,
  product_sku TEXT,
  variant_attribute TEXT,
  variant_value TEXT,
  sub_variant_attribute TEXT,
  sub_variant_value TEXT,
  quantity_ordered INTEGER NOT NULL,
  quantity_picked INTEGER DEFAULT 0,
  quantity_packed INTEGER DEFAULT 0,
  quantity_shipped INTEGER DEFAULT 0,
  unit_price DECIMAL(12,2) DEFAULT 0,
  unit_cost DECIMAL(12,2) DEFAULT 0,
  line_total DECIMAL(12,2) DEFAULT 0,
  warehouse_location TEXT,
  bin_location TEXT,
  pick_status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Delivery Tracking Events Table
CREATE TABLE public.delivery_tracking_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_order_id UUID REFERENCES public.delivery_orders(id) ON DELETE CASCADE NOT NULL,
  event_type TEXT NOT NULL,
  event_status TEXT,
  event_description TEXT NOT NULL,
  location_address TEXT,
  location_lat DECIMAL(10,8),
  location_lng DECIMAL(11,8),
  performed_by UUID REFERENCES auth.users(id),
  performer_name TEXT,
  performer_role TEXT,
  photo_urls TEXT[],
  signature_url TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Shopify Integrations Table
CREATE TABLE public.shopify_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) UNIQUE NOT NULL,
  shop_domain TEXT NOT NULL,
  shop_name TEXT,
  access_token_encrypted TEXT NOT NULL,
  api_version TEXT DEFAULT '2024-01',
  scopes TEXT[],
  auto_sync_orders BOOLEAN DEFAULT TRUE,
  auto_sync_inventory BOOLEAN DEFAULT FALSE,
  sync_frequency_minutes INTEGER DEFAULT 15,
  last_order_sync_at TIMESTAMPTZ,
  last_inventory_sync_at TIMESTAMPTZ,
  location_id TEXT,
  product_mappings JSONB DEFAULT '{}',
  webhook_secret TEXT,
  webhooks_registered JSONB DEFAULT '[]',
  status TEXT DEFAULT 'pending',
  last_error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Integration Requests Table
CREATE TABLE public.integration_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) NOT NULL,
  integration_type TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  shop_url TEXT,
  request_notes TEXT,
  technical_contact_email TEXT,
  technical_contact_phone TEXT,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  admin_notes TEXT,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Financial Transactions Table
CREATE TABLE public.financial_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id),
  delivery_order_id UUID REFERENCES public.delivery_orders(id),
  transaction_type TEXT NOT NULL,
  category TEXT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  description TEXT,
  reference_number TEXT,
  is_reconciled BOOLEAN DEFAULT FALSE,
  reconciled_at TIMESTAMPTZ,
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Pricing Rules Table
CREATE TABLE public.pricing_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_name TEXT NOT NULL,
  rule_type TEXT NOT NULL,
  applies_to TEXT DEFAULT 'all',
  company_id UUID REFERENCES public.companies(id),
  conditions JSONB DEFAULT '{}',
  calculation_type TEXT NOT NULL,
  base_amount DECIMAL(12,2) DEFAULT 0,
  per_unit_amount DECIMAL(12,2) DEFAULT 0,
  percentage DECIMAL(5,2) DEFAULT 0,
  tiers JSONB DEFAULT '[]',
  valid_from DATE,
  valid_until DATE,
  is_active BOOLEAN DEFAULT TRUE,
  priority INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- INDEXES
-- =============================================
CREATE INDEX idx_delivery_orders_company ON public.delivery_orders(company_id);
CREATE INDEX idx_delivery_orders_status ON public.delivery_orders(status);
CREATE INDEX idx_delivery_orders_source ON public.delivery_orders(source);
CREATE INDEX idx_delivery_orders_created ON public.delivery_orders(created_at DESC);
CREATE INDEX idx_delivery_order_items_order ON public.delivery_order_items(delivery_order_id);
CREATE INDEX idx_delivery_tracking_events_order ON public.delivery_tracking_events(delivery_order_id);
CREATE INDEX idx_financial_transactions_company ON public.financial_transactions(company_id);
CREATE INDEX idx_financial_transactions_order ON public.financial_transactions(delivery_order_id);
CREATE INDEX idx_financial_transactions_date ON public.financial_transactions(transaction_date);

-- =============================================
-- FUNCTIONS
-- =============================================
CREATE OR REPLACE FUNCTION public.generate_delivery_order_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_number TEXT;
  last_number INTEGER;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(order_number FROM 4) AS INTEGER)), 0)
  INTO last_number
  FROM delivery_orders
  WHERE order_number LIKE 'DO-%';
  
  new_number := 'DO-' || LPAD((last_number + 1)::TEXT, 5, '0');
  RETURN new_number;
END;
$$;

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

-- Delivery Carriers (admin only management, read for all authenticated)
ALTER TABLE public.delivery_carriers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage carriers" ON public.delivery_carriers
  FOR ALL USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Authenticated users can view carriers" ON public.delivery_carriers
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Delivery Drivers
ALTER TABLE public.delivery_drivers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage drivers" ON public.delivery_drivers
  FOR ALL USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Warehouse managers can view drivers" ON public.delivery_drivers
  FOR SELECT USING (has_role(auth.uid(), 'warehouse_manager'));

CREATE POLICY "Authenticated users can view drivers" ON public.delivery_drivers
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Delivery Orders
ALTER TABLE public.delivery_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all delivery orders" ON public.delivery_orders
  FOR ALL USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Warehouse managers can view and update delivery orders" ON public.delivery_orders
  FOR ALL USING (has_role(auth.uid(), 'warehouse_manager'));

CREATE POLICY "Logistics coordinators can view and update delivery orders" ON public.delivery_orders
  FOR ALL USING (has_role(auth.uid(), 'logistics_coordinator'));

CREATE POLICY "Clients can view own delivery orders" ON public.delivery_orders
  FOR SELECT USING (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));

-- Delivery Order Items
ALTER TABLE public.delivery_order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all order items" ON public.delivery_order_items
  FOR ALL USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Warehouse managers can manage order items" ON public.delivery_order_items
  FOR ALL USING (has_role(auth.uid(), 'warehouse_manager'));

CREATE POLICY "Clients can view own order items" ON public.delivery_order_items
  FOR SELECT USING (
    delivery_order_id IN (
      SELECT id FROM delivery_orders WHERE company_id IN (
        SELECT company_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

-- Delivery Tracking Events
ALTER TABLE public.delivery_tracking_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage tracking events" ON public.delivery_tracking_events
  FOR ALL USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Warehouse managers can manage tracking events" ON public.delivery_tracking_events
  FOR ALL USING (has_role(auth.uid(), 'warehouse_manager'));

CREATE POLICY "Clients can view own tracking events" ON public.delivery_tracking_events
  FOR SELECT USING (
    delivery_order_id IN (
      SELECT id FROM delivery_orders WHERE company_id IN (
        SELECT company_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

-- Shopify Integrations
ALTER TABLE public.shopify_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all integrations" ON public.shopify_integrations
  FOR ALL USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Clients can view own integration" ON public.shopify_integrations
  FOR SELECT USING (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));

-- Integration Requests
ALTER TABLE public.integration_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all requests" ON public.integration_requests
  FOR ALL USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Clients can manage own requests" ON public.integration_requests
  FOR ALL USING (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));

-- Financial Transactions
ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all transactions" ON public.financial_transactions
  FOR ALL USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Clients can view own transactions" ON public.financial_transactions
  FOR SELECT USING (company_id IN (SELECT company_id FROM profiles WHERE id = auth.uid()));

-- Pricing Rules
ALTER TABLE public.pricing_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage pricing rules" ON public.pricing_rules
  FOR ALL USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Authenticated users can view pricing rules" ON public.pricing_rules
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- =============================================
-- TRIGGERS
-- =============================================
CREATE TRIGGER update_delivery_carriers_updated_at
  BEFORE UPDATE ON public.delivery_carriers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_delivery_drivers_updated_at
  BEFORE UPDATE ON public.delivery_drivers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_delivery_orders_updated_at
  BEFORE UPDATE ON public.delivery_orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_shopify_integrations_updated_at
  BEFORE UPDATE ON public.shopify_integrations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_integration_requests_updated_at
  BEFORE UPDATE ON public.integration_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pricing_rules_updated_at
  BEFORE UPDATE ON public.pricing_rules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
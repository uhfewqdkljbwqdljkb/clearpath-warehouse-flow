-- Update RLS policies to allow warehouse_manager to view all client data in their accessible pages

-- Check-In Requests: Allow warehouse_manager to view all
DROP POLICY IF EXISTS "Admins can view all check-in requests" ON public.check_in_requests;
CREATE POLICY "Admins and warehouse managers can view all check-in requests" 
ON public.check_in_requests 
FOR SELECT 
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'super_admin'::app_role) OR 
  has_role(auth.uid(), 'warehouse_manager'::app_role)
);

DROP POLICY IF EXISTS "Admins can update check-in requests" ON public.check_in_requests;
CREATE POLICY "Admins and warehouse managers can update check-in requests" 
ON public.check_in_requests 
FOR UPDATE 
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'super_admin'::app_role) OR 
  has_role(auth.uid(), 'warehouse_manager'::app_role)
);

-- Check-Out Requests: Allow warehouse_manager to view all
DROP POLICY IF EXISTS "Admins can view all check-out requests" ON public.check_out_requests;
CREATE POLICY "Admins and warehouse managers can view all check-out requests" 
ON public.check_out_requests 
FOR SELECT 
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'super_admin'::app_role) OR 
  has_role(auth.uid(), 'warehouse_manager'::app_role)
);

DROP POLICY IF EXISTS "Admins can update check-out requests" ON public.check_out_requests;
CREATE POLICY "Admins and warehouse managers can update check-out requests" 
ON public.check_out_requests 
FOR UPDATE 
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'super_admin'::app_role) OR 
  has_role(auth.uid(), 'warehouse_manager'::app_role)
);

-- Shipments: Allow warehouse_manager to view all (they already can create with approval workflow)
DROP POLICY IF EXISTS "Admins can manage all shipments" ON public.shipments;
CREATE POLICY "Admins can manage all shipments" 
ON public.shipments 
FOR ALL 
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'super_admin'::app_role)
);

CREATE POLICY "Warehouse managers can view all shipments" 
ON public.shipments 
FOR SELECT 
USING (has_role(auth.uid(), 'warehouse_manager'::app_role));

CREATE POLICY "Warehouse managers can insert shipments" 
ON public.shipments 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'warehouse_manager'::app_role));

-- Shipment Items: Allow warehouse_manager to view and insert
DROP POLICY IF EXISTS "Admins can manage all shipment items" ON public.shipment_items;
CREATE POLICY "Admins can manage all shipment items" 
ON public.shipment_items 
FOR ALL 
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'super_admin'::app_role)
);

CREATE POLICY "Warehouse managers can view all shipment items" 
ON public.shipment_items 
FOR SELECT 
USING (has_role(auth.uid(), 'warehouse_manager'::app_role));

CREATE POLICY "Warehouse managers can insert shipment items" 
ON public.shipment_items 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'warehouse_manager'::app_role));

-- Client Products: Allow warehouse_manager to view all
CREATE POLICY "Warehouse managers can view all products" 
ON public.client_products 
FOR SELECT 
USING (has_role(auth.uid(), 'warehouse_manager'::app_role));

-- Inventory Items: Allow warehouse_manager to view all
CREATE POLICY "Warehouse managers can view all inventory" 
ON public.inventory_items 
FOR SELECT 
USING (has_role(auth.uid(), 'warehouse_manager'::app_role));

-- Companies: Allow warehouse_manager to view all companies
CREATE POLICY "Warehouse managers can view all companies" 
ON public.companies 
FOR SELECT 
USING (
  (auth.uid() IS NOT NULL) AND 
  has_role(auth.uid(), 'warehouse_manager'::app_role)
);

-- JARDE Reports: warehouse_manager already has access via existing policy

-- B2B Suppliers: Allow warehouse_manager to view all (for check-in request context)
CREATE POLICY "Warehouse managers can view all suppliers" 
ON public.b2b_suppliers 
FOR SELECT 
USING (has_role(auth.uid(), 'warehouse_manager'::app_role));

-- B2B Customers: Allow warehouse_manager to view all (for check-out request context)
CREATE POLICY "Warehouse managers can view all customers" 
ON public.b2b_customers 
FOR SELECT 
USING (has_role(auth.uid(), 'warehouse_manager'::app_role));
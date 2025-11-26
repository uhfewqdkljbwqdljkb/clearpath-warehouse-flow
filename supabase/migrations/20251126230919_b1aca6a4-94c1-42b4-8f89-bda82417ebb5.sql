-- Update RLS policies to recognize super_admin role

-- profiles table policies
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" 
ON public.profiles FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role) 
  OR public.has_role(auth.uid(), 'super_admin'::app_role)
);

-- user_roles table policies
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;
CREATE POLICY "Admins can manage all roles" 
ON public.user_roles FOR ALL
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role) 
  OR public.has_role(auth.uid(), 'super_admin'::app_role)
);

-- companies table policies
DROP POLICY IF EXISTS "Admins can delete companies" ON public.companies;
CREATE POLICY "Admins can delete companies" 
ON public.companies FOR DELETE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role) 
  OR public.has_role(auth.uid(), 'super_admin'::app_role)
);

DROP POLICY IF EXISTS "Admins can insert companies" ON public.companies;
CREATE POLICY "Admins can insert companies" 
ON public.companies FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::app_role) 
  OR public.has_role(auth.uid(), 'super_admin'::app_role)
);

DROP POLICY IF EXISTS "Admins can update companies" ON public.companies;
CREATE POLICY "Admins can update companies" 
ON public.companies FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role) 
  OR public.has_role(auth.uid(), 'super_admin'::app_role)
);

DROP POLICY IF EXISTS "Admins can view all companies" ON public.companies;
CREATE POLICY "Admins can view all companies" 
ON public.companies FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role) 
  OR public.has_role(auth.uid(), 'super_admin'::app_role)
);

-- client_products table policies
DROP POLICY IF EXISTS "Admins can delete all products" ON public.client_products;
CREATE POLICY "Admins can delete all products" 
ON public.client_products FOR DELETE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role) 
  OR public.has_role(auth.uid(), 'super_admin'::app_role)
);

DROP POLICY IF EXISTS "Admins can insert all products" ON public.client_products;
CREATE POLICY "Admins can insert all products" 
ON public.client_products FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::app_role) 
  OR public.has_role(auth.uid(), 'super_admin'::app_role)
);

DROP POLICY IF EXISTS "Admins can update all products" ON public.client_products;
CREATE POLICY "Admins can update all products" 
ON public.client_products FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role) 
  OR public.has_role(auth.uid(), 'super_admin'::app_role)
);

DROP POLICY IF EXISTS "Admins can view all products" ON public.client_products;
CREATE POLICY "Admins can view all products" 
ON public.client_products FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role) 
  OR public.has_role(auth.uid(), 'super_admin'::app_role)
);

-- inventory_items table policies
DROP POLICY IF EXISTS "Admins can manage all inventory" ON public.inventory_items;
CREATE POLICY "Admins can manage all inventory" 
ON public.inventory_items FOR ALL
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role) 
  OR public.has_role(auth.uid(), 'super_admin'::app_role)
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::app_role) 
  OR public.has_role(auth.uid(), 'super_admin'::app_role)
);

DROP POLICY IF EXISTS "Admins can view all inventory" ON public.inventory_items;
CREATE POLICY "Admins can view all inventory" 
ON public.inventory_items FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role) 
  OR public.has_role(auth.uid(), 'super_admin'::app_role)
);

-- check_in_requests table policies
DROP POLICY IF EXISTS "Admins can update check-in requests" ON public.check_in_requests;
CREATE POLICY "Admins can update check-in requests" 
ON public.check_in_requests FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role) 
  OR public.has_role(auth.uid(), 'super_admin'::app_role)
);

DROP POLICY IF EXISTS "Admins can view all check-in requests" ON public.check_in_requests;
CREATE POLICY "Admins can view all check-in requests" 
ON public.check_in_requests FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role) 
  OR public.has_role(auth.uid(), 'super_admin'::app_role)
);

-- check_out_requests table policies
DROP POLICY IF EXISTS "Admins can update check-out requests" ON public.check_out_requests;
CREATE POLICY "Admins can update check-out requests" 
ON public.check_out_requests FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role) 
  OR public.has_role(auth.uid(), 'super_admin'::app_role)
);

DROP POLICY IF EXISTS "Admins can view all check-out requests" ON public.check_out_requests;
CREATE POLICY "Admins can view all check-out requests" 
ON public.check_out_requests FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role) 
  OR public.has_role(auth.uid(), 'super_admin'::app_role)
);

-- client_orders table policies
DROP POLICY IF EXISTS "Admins can view all orders" ON public.client_orders;
CREATE POLICY "Admins can view all orders" 
ON public.client_orders FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role) 
  OR public.has_role(auth.uid(), 'super_admin'::app_role)
);

-- client_order_items table policies
DROP POLICY IF EXISTS "Admins can view all order items" ON public.client_order_items;
CREATE POLICY "Admins can view all order items" 
ON public.client_order_items FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role) 
  OR public.has_role(auth.uid(), 'super_admin'::app_role)
);

-- shipments table policies
DROP POLICY IF EXISTS "Admins can manage all shipments" ON public.shipments;
CREATE POLICY "Admins can manage all shipments" 
ON public.shipments FOR ALL
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role) 
  OR public.has_role(auth.uid(), 'super_admin'::app_role)
);

-- messages table policies
DROP POLICY IF EXISTS "Admins can view all messages" ON public.messages;
CREATE POLICY "Admins can view all messages" 
ON public.messages FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role) 
  OR public.has_role(auth.uid(), 'super_admin'::app_role)
);

-- client_activity_logs table policies
DROP POLICY IF EXISTS "Admins can view all activity" ON public.client_activity_logs;
CREATE POLICY "Admins can view all activity" 
ON public.client_activity_logs FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role) 
  OR public.has_role(auth.uid(), 'super_admin'::app_role)
);

-- client_allocations table policies
DROP POLICY IF EXISTS "Admins can manage allocations" ON public.client_allocations;
CREATE POLICY "Admins can manage allocations" 
ON public.client_allocations FOR ALL
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role) 
  OR public.has_role(auth.uid(), 'super_admin'::app_role)
);

-- admin_sessions table policies
DROP POLICY IF EXISTS "Admins can manage sessions" ON public.admin_sessions;
CREATE POLICY "Admins can manage sessions" 
ON public.admin_sessions FOR ALL
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role) 
  OR public.has_role(auth.uid(), 'super_admin'::app_role)
);

-- warehouse_zones table policies
DROP POLICY IF EXISTS "Admins can manage zones" ON public.warehouse_zones;
CREATE POLICY "Admins can manage zones" 
ON public.warehouse_zones FOR ALL
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role) 
  OR public.has_role(auth.uid(), 'super_admin'::app_role)
);

-- warehouse_rows table policies
DROP POLICY IF EXISTS "Admins can manage rows" ON public.warehouse_rows;
CREATE POLICY "Admins can manage rows" 
ON public.warehouse_rows FOR ALL
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role) 
  OR public.has_role(auth.uid(), 'super_admin'::app_role)
);
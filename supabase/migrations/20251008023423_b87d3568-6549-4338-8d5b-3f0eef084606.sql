-- Update RLS policies to allow admins to view all data

-- Allow admins to view all client products
DROP POLICY IF EXISTS "Admins can view all products" ON public.client_products;
CREATE POLICY "Admins can view all products"
ON public.client_products
FOR SELECT
USING (is_admin(auth.uid()));

-- Allow admins to view all inventory items
DROP POLICY IF EXISTS "Admins can view all inventory" ON public.inventory_items;
CREATE POLICY "Admins can view all inventory"
ON public.inventory_items
FOR SELECT
USING (is_admin(auth.uid()));

-- Allow admins to view all orders
DROP POLICY IF EXISTS "Admins can view all orders" ON public.client_orders;
CREATE POLICY "Admins can view all orders"
ON public.client_orders
FOR SELECT
USING (is_admin(auth.uid()));

-- Allow admins to view all order items
DROP POLICY IF EXISTS "Admins can view all order items" ON public.client_order_items;
CREATE POLICY "Admins can view all order items"
ON public.client_order_items
FOR SELECT
USING (is_admin(auth.uid()));

-- Allow admins to view all profiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (is_admin(auth.uid()));
-- Add missing INSERT policy for warehouse_manager on client_products
-- This allows warehouse managers to create new products when approving check-in requests
CREATE POLICY "Warehouse managers can insert all products"
ON public.client_products
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'warehouse_manager'::app_role));

-- Also add policy for logistics_coordinator to have same capabilities for check-in approval
CREATE POLICY "Logistics coordinators can view all products"
ON public.client_products
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'logistics_coordinator'::app_role));

CREATE POLICY "Logistics coordinators can insert all products"
ON public.client_products
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'logistics_coordinator'::app_role));

CREATE POLICY "Logistics coordinators can update all products"
ON public.client_products
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'logistics_coordinator'::app_role));

-- Add logistics coordinator policies for inventory_items
CREATE POLICY "Logistics coordinators can view all inventory"
ON public.inventory_items
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'logistics_coordinator'::app_role));

CREATE POLICY "Logistics coordinators can insert all inventory"
ON public.inventory_items
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'logistics_coordinator'::app_role));

CREATE POLICY "Logistics coordinators can update all inventory"
ON public.inventory_items
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'logistics_coordinator'::app_role));
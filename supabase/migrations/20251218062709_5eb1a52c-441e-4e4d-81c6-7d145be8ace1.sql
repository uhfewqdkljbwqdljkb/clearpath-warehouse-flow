-- Drop the existing policy and create a new one that includes super_admin
DROP POLICY IF EXISTS "Admins can manage all shipment items" ON public.shipment_items;

CREATE POLICY "Admins can manage all shipment items"
ON public.shipment_items
FOR ALL
USING (
  has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role)
);
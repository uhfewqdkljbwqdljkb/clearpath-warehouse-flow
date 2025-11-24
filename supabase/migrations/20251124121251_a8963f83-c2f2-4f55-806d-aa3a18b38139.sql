-- Allow admins to manage all inventory items (insert, update, delete)
DROP POLICY IF EXISTS "Admins can manage all inventory" ON inventory_items;

CREATE POLICY "Admins can manage all inventory"
ON inventory_items
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
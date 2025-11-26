-- Add RLS policy for client admins to view users in their company
CREATE POLICY "Client admins can view company users"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  company_id IN (
    SELECT company_id 
    FROM profiles 
    WHERE id = auth.uid()
  )
  AND EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'client_admin')
  )
);

-- Add RLS policy for client admins to manage user roles in their company
CREATE POLICY "Client admins can manage company user roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (
  user_id IN (
    SELECT p.id 
    FROM profiles p
    WHERE p.company_id IN (
      SELECT company_id 
      FROM profiles 
      WHERE id = auth.uid()
    )
  )
  AND EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'client_admin')
  )
)
WITH CHECK (
  user_id IN (
    SELECT p.id 
    FROM profiles p
    WHERE p.company_id IN (
      SELECT company_id 
      FROM profiles 
      WHERE id = auth.uid()
    )
  )
  AND EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'client_admin')
  )
);

-- Add RLS policy for client admins to update profiles in their company
CREATE POLICY "Client admins can update company profiles"
ON public.profiles
FOR UPDATE
TO authenticated
USING (
  company_id IN (
    SELECT company_id 
    FROM profiles 
    WHERE id = auth.uid()
  )
  AND EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'client_admin')
  )
)
WITH CHECK (
  company_id IN (
    SELECT company_id 
    FROM profiles 
    WHERE id = auth.uid()
  )
  AND EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'client_admin')
  )
);
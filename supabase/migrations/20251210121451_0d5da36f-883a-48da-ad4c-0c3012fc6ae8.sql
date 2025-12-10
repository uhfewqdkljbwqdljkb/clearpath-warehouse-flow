-- Add INSERT policy for profiles table
-- Only admins can directly insert profiles (normal users get profiles via trigger)
CREATE POLICY "Admins can insert profiles" 
ON public.profiles 
FOR INSERT 
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin'));
-- Clean up duplicate roles for this user - keep only super_admin
DELETE FROM user_roles 
WHERE user_id = 'de278b3a-5653-4475-be39-b23f2e5aa025' 
AND role = 'admin';

-- Add a unique constraint on just user_id to prevent multiple roles per user
-- First, let's see if there are other users with multiple roles
-- We'll clean those up if needed

-- Create a function to update user roles that bypasses RLS
CREATE OR REPLACE FUNCTION public.update_user_role(_user_id uuid, _new_role app_role)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Delete all existing roles for this user
  DELETE FROM public.user_roles WHERE user_id = _user_id;
  
  -- Insert the new role
  INSERT INTO public.user_roles (user_id, role) VALUES (_user_id, _new_role);
END;
$$;
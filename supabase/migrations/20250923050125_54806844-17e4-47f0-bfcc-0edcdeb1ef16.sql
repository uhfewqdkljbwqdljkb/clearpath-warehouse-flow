-- Phase 1B: Add missing RLS policies and complete role system

-- Add new role column to profiles temporarily to migrate existing data
ALTER TABLE profiles ADD COLUMN new_role user_role;

-- Migrate existing role data
UPDATE profiles SET new_role = 
  CASE 
    WHEN role = 'admin' THEN 'super_admin'::user_role
    WHEN role = 'client' THEN 'client_user'::user_role
    ELSE 'client_user'::user_role
  END;

-- Make new_role column not null
ALTER TABLE profiles ALTER COLUMN new_role SET NOT NULL;

-- Drop old role column and rename new one
ALTER TABLE profiles DROP COLUMN role;
ALTER TABLE profiles RENAME COLUMN new_role TO role;

-- Set default for role column
ALTER TABLE profiles ALTER COLUMN role SET DEFAULT 'client_user'::user_role;

-- Create security definer function to get user role (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(user_uuid UUID, check_role user_role)
RETURNS boolean AS $$
  SELECT EXISTS(SELECT 1 FROM public.profiles WHERE user_id = user_uuid AND role = check_role);
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public;

-- Create function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role(user_uuid UUID)
RETURNS user_role AS $$
  SELECT role FROM public.profiles WHERE user_id = user_uuid;
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public;

-- Add missing RLS policies for new tables

-- User roles policies
CREATE POLICY "Users can view their own roles" ON user_roles
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all roles" ON user_roles
  FOR ALL USING (
    public.has_role(auth.uid(), 'super_admin') OR 
    public.has_role(auth.uid(), 'warehouse_manager')
  );

CREATE POLICY "Client admins can manage their company roles" ON user_roles
  FOR ALL USING (
    public.has_role(auth.uid(), 'client_admin') AND
    company_id IN (SELECT profiles.company_id FROM profiles WHERE profiles.user_id = auth.uid())
  );

-- Admin sessions policies
CREATE POLICY "Admins can manage sessions" ON admin_sessions
  FOR ALL USING (
    public.has_role(auth.uid(), 'super_admin') OR 
    public.has_role(auth.uid(), 'warehouse_manager')
  );

-- Client activity logs policies
CREATE POLICY "Admins can view all activity" ON client_activity_logs
  FOR SELECT USING (
    public.has_role(auth.uid(), 'super_admin') OR 
    public.has_role(auth.uid(), 'warehouse_manager')
  );

CREATE POLICY "Users can view their activity" ON client_activity_logs
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "System can log activity" ON client_activity_logs
  FOR INSERT WITH CHECK (true);

-- Update companies policies to use new role system
DROP POLICY IF EXISTS "Admins can manage all companies" ON companies;
DROP POLICY IF EXISTS "Clients can view their own company" ON companies;

CREATE POLICY "Admins can manage all companies" ON companies
  FOR ALL USING (
    public.has_role(auth.uid(), 'super_admin') OR 
    public.has_role(auth.uid(), 'warehouse_manager')
  );

CREATE POLICY "Clients can view their own company" ON companies
  FOR SELECT USING (
    id IN (SELECT profiles.company_id FROM profiles WHERE profiles.user_id = auth.uid())
  );

-- Update client_products policies 
DROP POLICY IF EXISTS "Clients can update their own products" ON client_products;
CREATE POLICY "Clients can update their own products" ON client_products
  FOR UPDATE USING (
    company_id IN (SELECT profiles.company_id FROM profiles WHERE profiles.user_id = auth.uid()) AND
    (public.has_role(auth.uid(), 'client_admin') OR public.has_role(auth.uid(), 'client_user'))
  );

-- Update existing policies to work with new role system
DROP POLICY IF EXISTS "Clients can create their own products" ON client_products;
CREATE POLICY "Clients can create their own products" ON client_products
  FOR INSERT WITH CHECK (
    company_id IN (SELECT profiles.company_id FROM profiles WHERE profiles.user_id = auth.uid()) AND
    (public.has_role(auth.uid(), 'client_admin') OR public.has_role(auth.uid(), 'client_user'))
  );
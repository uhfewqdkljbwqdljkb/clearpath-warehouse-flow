-- Phase 1C: Add missing RLS policies only

-- Create simple functions for role checking that work with existing TEXT role column
CREATE OR REPLACE FUNCTION public.is_admin(user_uuid UUID)
RETURNS boolean AS $$
  SELECT EXISTS(SELECT 1 FROM public.profiles WHERE user_id = user_uuid AND role IN ('admin', 'super_admin', 'warehouse_manager'));
$$ LANGUAGE SQL SECURITY DEFINER STABLE SET search_path = public;

-- Add missing RLS policies for new tables

-- User roles policies (for now, just let admins manage)
CREATE POLICY "Admins can manage all roles" ON user_roles
  FOR ALL USING (public.is_admin(auth.uid()));

CREATE POLICY "Users can view their own roles" ON user_roles
  FOR SELECT USING (user_id = auth.uid());

-- Admin sessions policies
CREATE POLICY "Admins can manage sessions" ON admin_sessions
  FOR ALL USING (public.is_admin(auth.uid()));

-- Client activity logs policies
CREATE POLICY "Admins can view all activity" ON client_activity_logs
  FOR SELECT USING (public.is_admin(auth.uid()));

CREATE POLICY "Users can view their activity" ON client_activity_logs
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "System can log activity" ON client_activity_logs
  FOR INSERT WITH CHECK (true);
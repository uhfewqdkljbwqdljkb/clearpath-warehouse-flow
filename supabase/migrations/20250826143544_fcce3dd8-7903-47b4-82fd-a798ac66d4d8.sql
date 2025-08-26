-- Create demo users in auth.users and profiles
-- Note: This creates users directly in auth.users for demo purposes
-- In production, users should sign up through the normal flow

-- Insert demo admin user
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role,
  aud
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'admin@clearpath.com',
  crypt('password123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '',
  '',
  '',
  '',
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "Admin User", "role": "admin"}',
  false,
  'authenticated',
  'authenticated'
);

-- Insert demo client user
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role,
  aud
) VALUES (
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000000',
  'client@techshop.com',
  crypt('password123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '',
  '',
  '',
  '',
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"full_name": "John Smith", "role": "client"}',
  false,
  'authenticated',
  'authenticated'
);

-- Insert corresponding profiles (the trigger should handle this, but let's be explicit)
INSERT INTO public.profiles (id, user_id, email, full_name, role, company_id) VALUES 
('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'admin@clearpath.com', 'Admin User', 'admin', NULL),
('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002', 'client@techshop.com', 'John Smith', 'client', '11111111-1111-1111-1111-111111111111')
ON CONFLICT (user_id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  company_id = EXCLUDED.company_id;
-- Add admin role for existing user josephfarah2005@gmail.com
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM auth.users
WHERE email = 'josephfarah2005@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;
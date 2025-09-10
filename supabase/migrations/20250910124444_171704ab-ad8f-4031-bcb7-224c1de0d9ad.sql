-- Update user role to admin
UPDATE public.profiles 
SET role = 'admin', updated_at = now()
WHERE user_id = '55b64e4c-4e51-4437-a630-1dc09ee3d7e9';
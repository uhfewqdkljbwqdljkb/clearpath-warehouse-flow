-- Switch user role back to client and assign to a company
UPDATE public.profiles 
SET 
  role = 'client',
  company_id = '11111111-1111-1111-1111-111111111111',
  updated_at = now()
WHERE user_id = '55b64e4c-4e51-4437-a630-1dc09ee3d7e9';
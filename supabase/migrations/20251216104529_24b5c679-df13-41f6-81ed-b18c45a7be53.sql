-- Update check_in_requests constraint to include all existing and new B2B types
ALTER TABLE public.check_in_requests 
DROP CONSTRAINT IF EXISTS check_in_requests_request_type_check;

ALTER TABLE public.check_in_requests 
ADD CONSTRAINT check_in_requests_request_type_check 
CHECK (request_type IN ('standard', 'b2b_source', 'supplier_sourcing', 'urgent', 'scheduled'));
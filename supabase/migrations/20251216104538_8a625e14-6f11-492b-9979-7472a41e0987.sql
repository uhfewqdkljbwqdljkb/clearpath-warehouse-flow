-- Update check_out_requests constraint to include B2B shipment type
ALTER TABLE public.check_out_requests 
DROP CONSTRAINT IF EXISTS check_out_requests_request_type_check;

ALTER TABLE public.check_out_requests 
ADD CONSTRAINT check_out_requests_request_type_check 
CHECK (request_type IN ('standard', 'b2b_shipment', 'urgent', 'scheduled'));
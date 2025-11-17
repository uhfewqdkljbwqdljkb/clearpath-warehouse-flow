-- Add amendment tracking to check_in_requests
ALTER TABLE check_in_requests 
ADD COLUMN amended_products jsonb,
ADD COLUMN amendment_notes text,
ADD COLUMN was_amended boolean DEFAULT false;

COMMENT ON COLUMN check_in_requests.amended_products IS 'The final products that were actually checked in after amendments';
COMMENT ON COLUMN check_in_requests.amendment_notes IS 'Notes explaining what was changed from the original request';
COMMENT ON COLUMN check_in_requests.was_amended IS 'Whether the request was amended before approval';
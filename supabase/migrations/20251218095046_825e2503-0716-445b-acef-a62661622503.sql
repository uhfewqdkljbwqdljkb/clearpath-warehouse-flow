-- Add approval workflow fields to shipments table
ALTER TABLE public.shipments 
ADD COLUMN IF NOT EXISTS requires_approval boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS approved_by uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS approved_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS requested_by_role text;

-- Add comment for clarity
COMMENT ON COLUMN public.shipments.requires_approval IS 'True if shipment was created by warehouse_manager and needs admin approval';
COMMENT ON COLUMN public.shipments.approved_by IS 'Admin/Super Admin who approved the shipment request';
COMMENT ON COLUMN public.shipments.approved_at IS 'Timestamp when shipment was approved';
COMMENT ON COLUMN public.shipments.requested_by_role IS 'Role of the user who created the shipment request';
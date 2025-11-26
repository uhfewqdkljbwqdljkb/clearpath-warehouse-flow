-- Enable realtime for check-in and check-out requests
ALTER TABLE public.check_in_requests REPLICA IDENTITY FULL;
ALTER TABLE public.check_out_requests REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.check_in_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.check_out_requests;
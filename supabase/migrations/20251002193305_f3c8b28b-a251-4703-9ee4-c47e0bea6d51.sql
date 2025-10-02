-- Enable real-time for notifications table
ALTER TABLE public.notifications REPLICA IDENTITY FULL;

-- The table is already part of the supabase_realtime publication
-- This ensures complete row data is captured during updates
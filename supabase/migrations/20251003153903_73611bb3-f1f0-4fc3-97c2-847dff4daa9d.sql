-- Enable realtime for creator dashboard tables

-- Enable REPLICA IDENTITY FULL for complete row data during updates
ALTER TABLE public.subscriptions REPLICA IDENTITY FULL;
ALTER TABLE public.creator_posts REPLICA IDENTITY FULL;
ALTER TABLE public.creator_profiles REPLICA IDENTITY FULL;
ALTER TABLE public.platform_revenue REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.subscriptions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.creator_posts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.creator_profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE public.platform_revenue;

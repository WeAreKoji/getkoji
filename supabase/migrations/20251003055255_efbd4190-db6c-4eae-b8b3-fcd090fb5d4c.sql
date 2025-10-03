-- Fix public_creator_profiles view to include id field and use security_invoker
DROP VIEW IF EXISTS public.public_creator_profiles;

CREATE VIEW public.public_creator_profiles 
WITH (security_invoker = true) AS
SELECT 
  id,
  user_id,
  subscription_price,
  subscriber_count,
  id_verified,
  created_at
FROM public.creator_profiles;
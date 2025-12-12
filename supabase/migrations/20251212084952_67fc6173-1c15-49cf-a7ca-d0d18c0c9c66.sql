-- Drop existing constraint and create new one with more notification types
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE public.notifications ADD CONSTRAINT notifications_type_check 
CHECK (type = ANY (ARRAY[
  'new_subscriber'::text, 
  'failed_transfer'::text, 
  'verification_update'::text, 
  'subscription_renewal'::text, 
  'post_moderation'::text, 
  'new_verification'::text, 
  'new_post_pending'::text,
  'new_match'::text,
  'new_like'::text,
  'new_message'::text
]));
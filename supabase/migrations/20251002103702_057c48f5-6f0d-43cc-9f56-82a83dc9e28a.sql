-- Add stripe_subscription_id to subscriptions table
ALTER TABLE public.subscriptions 
ADD COLUMN IF NOT EXISTS stripe_subscription_id text UNIQUE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_id 
ON public.subscriptions(stripe_subscription_id);
-- Add Stripe Connect account ID to creator_profiles
ALTER TABLE public.creator_profiles 
ADD COLUMN IF NOT EXISTS stripe_account_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_onboarding_complete BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS payouts_enabled BOOLEAN DEFAULT FALSE;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_creator_profiles_stripe_account_id 
ON public.creator_profiles(stripe_account_id);
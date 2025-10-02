-- Add Stripe product and price IDs to creator_profiles for dynamic pricing
ALTER TABLE public.creator_profiles
ADD COLUMN IF NOT EXISTS stripe_product_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_price_id TEXT;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_creator_profiles_stripe_price_id 
  ON public.creator_profiles(stripe_price_id);
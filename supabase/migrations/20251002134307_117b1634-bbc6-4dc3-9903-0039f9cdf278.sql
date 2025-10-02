-- Phase 2: Referral Program Tables

-- Create referral codes table
CREATE TABLE public.referral_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code text UNIQUE NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- Create referrals tracking table
CREATE TABLE public.referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referral_code text NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
  created_at timestamp with time zone DEFAULT now(),
  completed_at timestamp with time zone,
  UNIQUE(referrer_id, referred_user_id)
);

-- Create referral rewards table
CREATE TABLE public.referral_rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referral_id uuid REFERENCES public.referrals(id) ON DELETE CASCADE,
  reward_type text NOT NULL CHECK (reward_type IN ('credits', 'premium_days', 'cash')),
  amount numeric NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'claimed', 'expired')),
  created_at timestamp with time zone DEFAULT now(),
  claimed_at timestamp with time zone
);

-- Create user credits table
CREATE TABLE public.user_credits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  balance numeric DEFAULT 0 NOT NULL,
  total_earned numeric DEFAULT 0 NOT NULL,
  updated_at timestamp with time zone DEFAULT now()
);

-- Create profile views tracking table
CREATE TABLE public.profile_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  viewer_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  viewed_at timestamp with time zone DEFAULT now()
);

-- Add privacy settings column to profiles
ALTER TABLE public.profiles
ADD COLUMN privacy_settings jsonb DEFAULT '{"show_in_discover": true, "show_interests": true, "show_photos": true, "show_location": "exact", "show_age": "exact"}'::jsonb;

-- Enable RLS
ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_views ENABLE ROW LEVEL SECURITY;

-- RLS Policies for referral_codes
CREATE POLICY "Users can view own referral code"
  ON public.referral_codes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own referral code"
  ON public.referral_codes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for referrals
CREATE POLICY "Users can view own referrals"
  ON public.referrals FOR SELECT
  USING (auth.uid() = referrer_id OR auth.uid() = referred_user_id);

CREATE POLICY "System can manage referrals"
  ON public.referrals FOR ALL
  USING (auth.uid() = referrer_id OR auth.uid() = referred_user_id);

-- RLS Policies for referral_rewards
CREATE POLICY "Users can view own rewards"
  ON public.referral_rewards FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own rewards"
  ON public.referral_rewards FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for user_credits
CREATE POLICY "Users can view own credits"
  ON public.user_credits FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own credits"
  ON public.user_credits FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own credits"
  ON public.user_credits FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for profile_views
CREATE POLICY "Users can view own profile views"
  ON public.profile_views FOR SELECT
  USING (auth.uid() = profile_id);

CREATE POLICY "Anyone can create profile views"
  ON public.profile_views FOR INSERT
  WITH CHECK (true);

-- Function to generate unique referral code
CREATE OR REPLACE FUNCTION public.generate_referral_code(user_username text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  new_code text;
  code_exists boolean;
BEGIN
  LOOP
    -- Generate code based on username or random
    IF user_username IS NOT NULL THEN
      new_code := UPPER(SUBSTRING(user_username, 1, 4) || LPAD(FLOOR(RANDOM() * 10000)::text, 4, '0'));
    ELSE
      new_code := UPPER(SUBSTRING(MD5(RANDOM()::text), 1, 8));
    END IF;
    
    -- Check if code exists
    SELECT EXISTS(SELECT 1 FROM public.referral_codes WHERE code = new_code) INTO code_exists;
    
    EXIT WHEN NOT code_exists;
  END LOOP;
  
  RETURN new_code;
END;
$$;

-- Function to track referral on signup
CREATE OR REPLACE FUNCTION public.track_referral_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  stored_code text;
  referrer_user_id uuid;
BEGIN
  -- Check if there's a stored referral code (would be stored separately in your app)
  -- For now, this is a placeholder for the logic
  RETURN NEW;
END;
$$;

-- Function to complete referral
CREATE OR REPLACE FUNCTION public.complete_referral(referral_uuid uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Update referral status
  UPDATE public.referrals
  SET status = 'completed', completed_at = now()
  WHERE id = referral_uuid AND status = 'pending';
  
  -- Create rewards for referrer
  INSERT INTO public.referral_rewards (user_id, referral_id, reward_type, amount, status)
  SELECT referrer_id, referral_uuid, 'credits', 100, 'pending'
  FROM public.referrals
  WHERE id = referral_uuid;
END;
$$;
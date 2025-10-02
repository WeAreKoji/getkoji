-- Koji Connect Creator Referral Program Schema

-- 1. Add referral type to existing referral_codes table
ALTER TABLE public.referral_codes 
ADD COLUMN IF NOT EXISTS referral_type text DEFAULT 'general' CHECK (referral_type IN ('general', 'creator')),
ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

-- 2. Create creator_referrals table
CREATE TABLE IF NOT EXISTS public.creator_referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_creator_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referral_code text NOT NULL,
  commission_percentage numeric NOT NULL DEFAULT 7.5,
  commission_duration_months integer NOT NULL DEFAULT 9,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'expired', 'cancelled')),
  created_at timestamp with time zone DEFAULT now(),
  activated_at timestamp with time zone,
  expires_at timestamp with time zone,
  total_earnings_tracked numeric DEFAULT 0,
  total_commission_earned numeric DEFAULT 0,
  last_commission_date timestamp with time zone,
  UNIQUE(referred_creator_id)
);

-- 3. Create creator_referral_commissions table
CREATE TABLE IF NOT EXISTS public.creator_referral_commissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_referral_id uuid NOT NULL REFERENCES public.creator_referrals(id) ON DELETE CASCADE,
  platform_revenue_id uuid REFERENCES public.platform_revenue(id) ON DELETE SET NULL,
  creator_earnings_amount numeric NOT NULL,
  commission_amount numeric NOT NULL,
  commission_date timestamp with time zone DEFAULT now(),
  invoice_id text NOT NULL,
  subscription_id uuid REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  included_in_payout_id uuid,
  created_at timestamp with time zone DEFAULT now()
);

-- 4. Create creator_referral_payouts table
CREATE TABLE IF NOT EXISTS public.creator_referral_payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  currency text NOT NULL DEFAULT 'usd',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  payout_method text CHECK (payout_method IN ('stripe_connect', 'credits')),
  stripe_transfer_id text,
  created_at timestamp with time zone DEFAULT now(),
  processed_at timestamp with time zone,
  commission_ids jsonb,
  minimum_threshold_met_at timestamp with time zone
);

-- 5. Create referral_fraud_checks table
CREATE TABLE IF NOT EXISTS public.referral_fraud_checks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referral_id uuid REFERENCES public.creator_referrals(id) ON DELETE CASCADE,
  ip_address text,
  device_fingerprint text,
  created_at timestamp with time zone DEFAULT now(),
  flagged boolean DEFAULT false,
  flag_reason text
);

-- 6. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_creator_referrals_referrer ON public.creator_referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_creator_referrals_creator ON public.creator_referrals(referred_creator_id);
CREATE INDEX IF NOT EXISTS idx_creator_referrals_status ON public.creator_referrals(status);
CREATE INDEX IF NOT EXISTS idx_referral_commissions_referral ON public.creator_referral_commissions(creator_referral_id);
CREATE INDEX IF NOT EXISTS idx_referral_payouts_referrer ON public.creator_referral_payouts(referrer_id);
CREATE INDEX IF NOT EXISTS idx_fraud_checks_user ON public.referral_fraud_checks(user_id);

-- 7. Enable RLS on all new tables
ALTER TABLE public.creator_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_referral_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_referral_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_fraud_checks ENABLE ROW LEVEL SECURITY;

-- 8. RLS Policies for creator_referrals
CREATE POLICY "Referrers can view own creator referrals"
  ON public.creator_referrals FOR SELECT
  USING (auth.uid() = referrer_id);

CREATE POLICY "Referred creators can view referrals about them"
  ON public.creator_referrals FOR SELECT
  USING (auth.uid() = referred_creator_id);

CREATE POLICY "System can create referrals"
  ON public.creator_referrals FOR INSERT
  WITH CHECK (true);

CREATE POLICY "System can update referrals"
  ON public.creator_referrals FOR UPDATE
  USING (true);

-- 9. RLS Policies for creator_referral_commissions
CREATE POLICY "View own commissions"
  ON public.creator_referral_commissions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.creator_referrals
      WHERE creator_referrals.id = creator_referral_commissions.creator_referral_id
      AND creator_referrals.referrer_id = auth.uid()
    )
  );

CREATE POLICY "System can insert commissions"
  ON public.creator_referral_commissions FOR INSERT
  WITH CHECK (true);

-- 10. RLS Policies for creator_referral_payouts
CREATE POLICY "View own payouts"
  ON public.creator_referral_payouts FOR SELECT
  USING (auth.uid() = referrer_id);

CREATE POLICY "System can manage payouts"
  ON public.creator_referral_payouts FOR ALL
  USING (true);

-- 11. RLS Policies for referral_fraud_checks
CREATE POLICY "Admins can view fraud checks"
  ON public.referral_fraud_checks FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "System can insert fraud checks"
  ON public.referral_fraud_checks FOR INSERT
  WITH CHECK (true);

-- 12. Function to activate creator referral
CREATE OR REPLACE FUNCTION public.activate_creator_referral(referral_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.creator_referrals
  SET 
    status = 'active',
    activated_at = now(),
    expires_at = now() + INTERVAL '9 months'
  WHERE id = referral_id AND status = 'pending';
END;
$$;

-- 13. Function to check for expired referrals
CREATE OR REPLACE FUNCTION public.check_expired_referrals()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.creator_referrals
  SET status = 'expired'
  WHERE status = 'active' 
    AND expires_at < now();
END;
$$;

-- 14. Function to process referral payout
CREATE OR REPLACE FUNCTION public.process_referral_payout(referrer_user_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total_unpaid numeric;
  commission_ids_array jsonb;
  new_payout_id uuid;
BEGIN
  -- Calculate total unpaid commissions
  SELECT 
    COALESCE(SUM(commission_amount), 0),
    jsonb_agg(id)
  INTO total_unpaid, commission_ids_array
  FROM public.creator_referral_commissions crc
  JOIN public.creator_referrals cr ON cr.id = crc.creator_referral_id
  WHERE cr.referrer_id = referrer_user_id
    AND crc.included_in_payout_id IS NULL;

  -- Only create payout if threshold is met
  IF total_unpaid >= 25 THEN
    INSERT INTO public.creator_referral_payouts (
      referrer_id,
      amount,
      commission_ids,
      minimum_threshold_met_at
    )
    VALUES (
      referrer_user_id,
      total_unpaid,
      commission_ids_array,
      now()
    )
    RETURNING id INTO new_payout_id;

    RETURN new_payout_id;
  END IF;

  RETURN NULL;
END;
$$;
-- Phase 2: Payments & Compliance

-- 1. PAYMENT TRANSACTIONS (Comprehensive audit trail)
CREATE TABLE IF NOT EXISTS public.payment_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  transaction_type text NOT NULL CHECK (transaction_type IN ('subscription_payment', 'refund', 'chargeback', 'transfer', 'fee')),
  amount numeric NOT NULL,
  currency text NOT NULL DEFAULT 'usd',
  status text NOT NULL CHECK (status IN ('pending', 'succeeded', 'failed', 'cancelled')),
  stripe_payment_intent_id text,
  stripe_charge_id text,
  stripe_invoice_id text,
  subscription_id uuid REFERENCES public.subscriptions(id),
  creator_id uuid,
  metadata jsonb,
  failure_reason text,
  ip_address inet,
  user_agent text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions"
ON public.payment_transactions
FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR auth.uid() = creator_id);

CREATE POLICY "Admins can view all transactions"
ON public.payment_transactions
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::user_role));

CREATE POLICY "System can insert transactions"
ON public.payment_transactions
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE INDEX idx_payment_transactions_user ON public.payment_transactions(user_id, created_at DESC);
CREATE INDEX idx_payment_transactions_creator ON public.payment_transactions(creator_id, created_at DESC);
CREATE INDEX idx_payment_transactions_stripe ON public.payment_transactions(stripe_payment_intent_id);

-- 2. COMPLIANCE ACCEPTANCES (TOS, Privacy Policy tracking)
CREATE TABLE IF NOT EXISTS public.compliance_acceptances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  document_type text NOT NULL CHECK (document_type IN ('terms_of_service', 'privacy_policy', 'cookie_policy', 'creator_agreement')),
  document_version text NOT NULL,
  accepted_at timestamp with time zone DEFAULT now(),
  ip_address inet,
  user_agent text,
  metadata jsonb
);

ALTER TABLE public.compliance_acceptances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own acceptances"
ON public.compliance_acceptances
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own acceptances"
ON public.compliance_acceptances
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all acceptances"
ON public.compliance_acceptances
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::user_role));

CREATE INDEX idx_compliance_acceptances_user ON public.compliance_acceptances(user_id, document_type);
CREATE INDEX idx_compliance_acceptances_type ON public.compliance_acceptances(document_type, accepted_at DESC);

-- 3. REFUND REQUESTS (User-initiated refund tracking)
CREATE TABLE IF NOT EXISTS public.refund_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  subscription_id uuid REFERENCES public.subscriptions(id),
  payment_transaction_id uuid REFERENCES public.payment_transactions(id),
  amount_requested numeric NOT NULL,
  currency text NOT NULL DEFAULT 'usd',
  reason text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'processed', 'failed')),
  admin_notes text,
  processed_by uuid,
  processed_at timestamp with time zone,
  stripe_refund_id text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.refund_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own refund requests"
ON public.refund_requests
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create refund requests"
ON public.refund_requests
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage refund requests"
ON public.refund_requests
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::user_role));

CREATE INDEX idx_refund_requests_user ON public.refund_requests(user_id, created_at DESC);
CREATE INDEX idx_refund_requests_status ON public.refund_requests(status, created_at DESC);

-- 4. PAYMENT METHODS (Secure payment method tracking)
CREATE TABLE IF NOT EXISTS public.payment_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  stripe_payment_method_id text NOT NULL UNIQUE,
  type text NOT NULL,
  card_brand text,
  card_last4 text,
  card_exp_month integer,
  card_exp_year integer,
  is_default boolean DEFAULT false,
  billing_details jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own payment methods"
ON public.payment_methods
FOR ALL
TO authenticated
USING (auth.uid() = user_id);

CREATE INDEX idx_payment_methods_user ON public.payment_methods(user_id);
CREATE INDEX idx_payment_methods_stripe ON public.payment_methods(stripe_payment_method_id);

-- HELPER FUNCTIONS

-- Function to log payment transactions
CREATE OR REPLACE FUNCTION public.log_payment_transaction(
  _user_id uuid,
  _transaction_type text,
  _amount numeric,
  _currency text DEFAULT 'usd',
  _status text DEFAULT 'pending',
  _stripe_payment_intent_id text DEFAULT NULL,
  _stripe_charge_id text DEFAULT NULL,
  _stripe_invoice_id text DEFAULT NULL,
  _subscription_id uuid DEFAULT NULL,
  _creator_id uuid DEFAULT NULL,
  _metadata jsonb DEFAULT NULL,
  _ip_address inet DEFAULT NULL,
  _user_agent text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  transaction_id uuid;
BEGIN
  INSERT INTO public.payment_transactions (
    user_id,
    transaction_type,
    amount,
    currency,
    status,
    stripe_payment_intent_id,
    stripe_charge_id,
    stripe_invoice_id,
    subscription_id,
    creator_id,
    metadata,
    ip_address,
    user_agent
  ) VALUES (
    _user_id,
    _transaction_type,
    _amount,
    _currency,
    _status,
    _stripe_payment_intent_id,
    _stripe_charge_id,
    _stripe_invoice_id,
    _subscription_id,
    _creator_id,
    _metadata,
    _ip_address,
    _user_agent
  ) RETURNING id INTO transaction_id;
  
  RETURN transaction_id;
END;
$$;

-- Function to check if user has accepted compliance document
CREATE OR REPLACE FUNCTION public.has_accepted_compliance(
  _user_id uuid,
  _document_type text,
  _document_version text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF _document_version IS NULL THEN
    RETURN EXISTS (
      SELECT 1 FROM public.compliance_acceptances
      WHERE user_id = _user_id
        AND document_type = _document_type
    );
  ELSE
    RETURN EXISTS (
      SELECT 1 FROM public.compliance_acceptances
      WHERE user_id = _user_id
        AND document_type = _document_type
        AND document_version = _document_version
    );
  END IF;
END;
$$;

-- Function to get payment statistics for a user
CREATE OR REPLACE FUNCTION public.get_payment_stats(_user_id uuid)
RETURNS TABLE(
  total_spent numeric,
  total_refunded numeric,
  active_subscriptions bigint,
  failed_payments bigint
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(SUM(CASE WHEN transaction_type = 'subscription_payment' AND status = 'succeeded' THEN amount ELSE 0 END), 0) as total_spent,
    COALESCE(SUM(CASE WHEN transaction_type = 'refund' AND status = 'succeeded' THEN amount ELSE 0 END), 0) as total_refunded,
    (SELECT COUNT(*) FROM public.subscriptions WHERE subscriber_id = _user_id AND status = 'active') as active_subscriptions,
    COALESCE(SUM(CASE WHEN transaction_type = 'subscription_payment' AND status = 'failed' THEN 1 ELSE 0 END), 0)::bigint as failed_payments
  FROM public.payment_transactions
  WHERE user_id = _user_id;
END;
$$;

-- Function to update payment transaction status
CREATE OR REPLACE FUNCTION public.update_payment_transaction_status(
  _transaction_id uuid,
  _status text,
  _failure_reason text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.payment_transactions
  SET 
    status = _status,
    failure_reason = _failure_reason,
    updated_at = now()
  WHERE id = _transaction_id;
END;
$$;

-- Trigger to update payment_transactions updated_at
CREATE OR REPLACE FUNCTION public.update_payment_transaction_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_payment_transactions_updated_at
BEFORE UPDATE ON public.payment_transactions
FOR EACH ROW
EXECUTE FUNCTION public.update_payment_transaction_timestamp();

-- Trigger to update refund_requests updated_at
CREATE TRIGGER update_refund_requests_updated_at
BEFORE UPDATE ON public.refund_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_payment_transaction_timestamp();
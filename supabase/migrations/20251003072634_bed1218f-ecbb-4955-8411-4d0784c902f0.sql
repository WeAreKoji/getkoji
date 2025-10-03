-- Phase 1: Authentication & Account Security

-- 1. TWO-FACTOR AUTHENTICATION (2FA)
CREATE TABLE IF NOT EXISTS public.user_2fa (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  secret text NOT NULL,
  backup_codes text[] NOT NULL,
  enabled boolean NOT NULL DEFAULT false,
  enabled_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.user_2fa ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own 2FA"
ON public.user_2fa
FOR ALL
TO authenticated
USING (auth.uid() = user_id);

-- 2. SESSION MANAGEMENT
CREATE TABLE IF NOT EXISTS public.user_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  session_token text NOT NULL UNIQUE,
  ip_address inet,
  user_agent text,
  device_info jsonb,
  last_active timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  expires_at timestamp with time zone NOT NULL,
  revoked boolean DEFAULT false,
  revoked_at timestamp with time zone,
  revoke_reason text
);

ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sessions"
ON public.user_sessions
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can revoke own sessions"
ON public.user_sessions
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Index for session lookups
CREATE INDEX idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX idx_user_sessions_token ON public.user_sessions(session_token);
CREATE INDEX idx_user_sessions_active ON public.user_sessions(user_id, last_active) WHERE revoked = false;

-- 3. SUSPICIOUS ACTIVITY DETECTION
CREATE TYPE security_event_type AS ENUM (
  'login_success',
  'login_failure',
  'password_change',
  'email_change',
  '2fa_enabled',
  '2fa_disabled',
  'new_device_login',
  'suspicious_location',
  'multiple_failed_attempts',
  'account_locked',
  'account_unlocked'
);

CREATE TABLE IF NOT EXISTS public.security_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  event_type security_event_type NOT NULL,
  ip_address inet,
  user_agent text,
  device_info jsonb,
  location_info jsonb,
  metadata jsonb,
  severity text CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  acknowledged boolean DEFAULT false,
  acknowledged_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own security events"
ON public.security_events
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can acknowledge own security events"
ON public.security_events
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "System can insert security events"
ON public.security_events
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Index for security event queries
CREATE INDEX idx_security_events_user_id ON public.security_events(user_id, created_at DESC);
CREATE INDEX idx_security_events_type ON public.security_events(event_type, created_at DESC);
CREATE INDEX idx_security_events_severity ON public.security_events(severity, acknowledged) WHERE acknowledged = false;

-- 4. ACCOUNT LOCKOUT
CREATE TABLE IF NOT EXISTS public.account_lockouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  locked_at timestamp with time zone DEFAULT now(),
  unlock_at timestamp with time zone NOT NULL,
  reason text NOT NULL,
  failed_attempts integer NOT NULL DEFAULT 0,
  last_failed_attempt timestamp with time zone,
  metadata jsonb,
  unlocked_at timestamp with time zone,
  unlock_method text CHECK (unlock_method IN ('automatic', 'admin', 'user_request'))
);

ALTER TABLE public.account_lockouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own lockout status"
ON public.account_lockouts
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage lockouts"
ON public.account_lockouts
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::user_role));

-- Index for lockout checks
CREATE INDEX idx_account_lockouts_user_id ON public.account_lockouts(user_id);
CREATE INDEX idx_account_lockouts_unlock ON public.account_lockouts(unlock_at) WHERE unlocked_at IS NULL;

-- 5. PASSWORD HISTORY
CREATE TABLE IF NOT EXISTS public.password_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  password_hash text NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.password_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "No direct access to password history"
ON public.password_history
FOR ALL
TO authenticated
USING (false);

-- Index for password history checks
CREATE INDEX idx_password_history_user_id ON public.password_history(user_id, created_at DESC);

-- HELPER FUNCTIONS

-- Function to log security events
CREATE OR REPLACE FUNCTION public.log_security_event(
  _user_id uuid,
  _event_type security_event_type,
  _severity text DEFAULT 'low',
  _ip_address inet DEFAULT NULL,
  _user_agent text DEFAULT NULL,
  _metadata jsonb DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  event_id uuid;
BEGIN
  INSERT INTO public.security_events (
    user_id,
    event_type,
    severity,
    ip_address,
    user_agent,
    metadata
  ) VALUES (
    _user_id,
    _event_type,
    _severity,
    _ip_address,
    _user_agent,
    _metadata
  ) RETURNING id INTO event_id;
  
  RETURN event_id;
END;
$$;

-- Function to check if account is locked
CREATE OR REPLACE FUNCTION public.is_account_locked(_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  lockout_record RECORD;
BEGIN
  SELECT * INTO lockout_record
  FROM public.account_lockouts
  WHERE user_id = _user_id
    AND unlocked_at IS NULL
    AND unlock_at > now();
  
  RETURN FOUND;
END;
$$;

-- Function to record failed login attempt
CREATE OR REPLACE FUNCTION public.record_failed_login(
  _user_id uuid,
  _ip_address inet DEFAULT NULL,
  _user_agent text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  recent_failures integer;
  lockout_duration interval;
BEGIN
  -- Count recent failed attempts (last 15 minutes)
  SELECT COUNT(*) INTO recent_failures
  FROM public.security_events
  WHERE user_id = _user_id
    AND event_type = 'login_failure'
    AND created_at > now() - interval '15 minutes';
  
  -- Log the failed attempt
  PERFORM log_security_event(
    _user_id,
    'login_failure'::security_event_type,
    CASE 
      WHEN recent_failures >= 5 THEN 'high'
      WHEN recent_failures >= 3 THEN 'medium'
      ELSE 'low'
    END,
    _ip_address,
    _user_agent,
    jsonb_build_object('attempt_number', recent_failures + 1)
  );
  
  -- Apply lockout if threshold exceeded
  IF recent_failures + 1 >= 5 THEN
    -- 5+ attempts = 15 minute lockout
    lockout_duration := interval '15 minutes';
  ELSIF recent_failures + 1 >= 8 THEN
    -- 8+ attempts = 1 hour lockout
    lockout_duration := interval '1 hour';
  ELSIF recent_failures + 1 >= 10 THEN
    -- 10+ attempts = 24 hour lockout
    lockout_duration := interval '24 hours';
  END IF;
  
  IF lockout_duration IS NOT NULL THEN
    INSERT INTO public.account_lockouts (
      user_id,
      unlock_at,
      reason,
      failed_attempts
    ) VALUES (
      _user_id,
      now() + lockout_duration,
      'Multiple failed login attempts',
      recent_failures + 1
    )
    ON CONFLICT (user_id) 
    DO UPDATE SET
      locked_at = now(),
      unlock_at = now() + lockout_duration,
      failed_attempts = EXCLUDED.failed_attempts,
      unlocked_at = NULL;
    
    PERFORM log_security_event(
      _user_id,
      'account_locked'::security_event_type,
      'critical',
      _ip_address,
      _user_agent,
      jsonb_build_object('duration_minutes', EXTRACT(epoch FROM lockout_duration) / 60)
    );
  END IF;
END;
$$;

-- Function to unlock account automatically
CREATE OR REPLACE FUNCTION public.check_unlock_accounts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.account_lockouts
  SET 
    unlocked_at = now(),
    unlock_method = 'automatic'
  WHERE unlock_at <= now()
    AND unlocked_at IS NULL;
END;
$$;

-- Function to clean up old sessions
CREATE OR REPLACE FUNCTION public.cleanup_expired_sessions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.user_sessions
  WHERE expires_at < now() - interval '7 days';
END;
$$;

-- Function to clean up old security events (keep 90 days)
CREATE OR REPLACE FUNCTION public.cleanup_old_security_events()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.security_events
  WHERE created_at < now() - interval '90 days'
    AND severity IN ('low', 'medium');
END;
$$;
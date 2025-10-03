-- Phase 0: Critical Security Fixes (Fixed)

-- 1. USER INTERESTS DATA EXPOSURE FIX
-- Create function to check if user can view interests
CREATE OR REPLACE FUNCTION public.can_view_user_interests(_viewer_id uuid, _profile_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Owner can always view their own interests
  IF _viewer_id = _profile_user_id THEN
    RETURN true;
  END IF;
  
  -- Admins can view all interests
  IF has_role(_viewer_id, 'admin'::user_role) THEN
    RETURN true;
  END IF;
  
  -- Check if viewer has matched with the profile user
  IF EXISTS (
    SELECT 1 FROM matches
    WHERE (user1_id = _viewer_id AND user2_id = _profile_user_id)
       OR (user1_id = _profile_user_id AND user2_id = _viewer_id)
  ) THEN
    RETURN true;
  END IF;
  
  -- Check privacy settings - if user allows showing interests
  IF EXISTS (
    SELECT 1 FROM profiles
    WHERE id = _profile_user_id
    AND COALESCE((privacy_settings->>'show_interests')::boolean, true) = true
  ) THEN
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$;

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Anyone can view user interests" ON public.user_interests;

-- Create restrictive policy
CREATE POLICY "Users can view interests based on privacy"
ON public.user_interests
FOR SELECT
TO authenticated
USING (can_view_user_interests(auth.uid(), user_id));

-- 2. DOCUMENT ACCESS SECURITY ENHANCEMENTS
-- Add one-time token table for document access
CREATE TABLE IF NOT EXISTS public.document_access_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  verification_id uuid NOT NULL REFERENCES public.creator_id_verification(id) ON DELETE CASCADE,
  document_type text NOT NULL CHECK (document_type IN ('front', 'back', 'selfie')),
  token text NOT NULL UNIQUE,
  created_by uuid NOT NULL,
  expires_at timestamp with time zone NOT NULL,
  used_at timestamp with time zone,
  ip_address inet,
  user_agent text,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.document_access_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage document tokens"
ON public.document_access_tokens
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::user_role));

-- Index for fast token lookup (without time-based predicate)
CREATE INDEX idx_document_tokens_token ON public.document_access_tokens(token);
CREATE INDEX idx_document_tokens_expires ON public.document_access_tokens(expires_at);
CREATE INDEX idx_document_tokens_used ON public.document_access_tokens(used_at);

-- Function to generate document access token
CREATE OR REPLACE FUNCTION public.generate_document_token(
  _verification_id uuid,
  _document_type text,
  _expires_minutes integer DEFAULT 5
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _token text;
BEGIN
  -- Check authorization
  IF NOT can_access_documents(auth.uid()) THEN
    RAISE EXCEPTION 'Unauthorized: Cannot generate document access token';
  END IF;
  
  -- Generate secure random token
  _token := encode(gen_random_bytes(32), 'base64');
  
  -- Insert token
  INSERT INTO public.document_access_tokens (
    verification_id,
    document_type,
    token,
    created_by,
    expires_at
  ) VALUES (
    _verification_id,
    _document_type,
    _token,
    auth.uid(),
    now() + (_expires_minutes || ' minutes')::interval
  );
  
  RETURN _token;
END;
$$;

-- Function to validate and consume token
CREATE OR REPLACE FUNCTION public.validate_document_token(_token text)
RETURNS TABLE(
  verification_id uuid,
  document_type text,
  is_valid boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _record RECORD;
BEGIN
  SELECT * INTO _record
  FROM public.document_access_tokens
  WHERE token = _token
    AND used_at IS NULL
    AND expires_at > now();
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT NULL::uuid, NULL::text, false;
    RETURN;
  END IF;
  
  -- Mark token as used
  UPDATE public.document_access_tokens
  SET used_at = now()
  WHERE id = _record.id;
  
  RETURN QUERY SELECT _record.verification_id, _record.document_type, true;
END;
$$;

-- 3. EMAIL PRIVACY ENHANCEMENT
-- Create function to get user email (admin only)
CREATE OR REPLACE FUNCTION public.get_user_email(_user_id uuid)
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _email text;
BEGIN
  -- Only owner or admin can get email
  IF auth.uid() != _user_id AND NOT has_role(auth.uid(), 'admin'::user_role) THEN
    RAISE EXCEPTION 'Unauthorized: Cannot access user email';
  END IF;
  
  SELECT email INTO _email
  FROM public.profiles
  WHERE id = _user_id;
  
  RETURN _email;
END;
$$;

-- 4. RATE LIMITING ENHANCEMENTS
-- Add indexes to rate_limits table for better performance
CREATE INDEX IF NOT EXISTS idx_rate_limits_identifier_window 
ON public.rate_limits(identifier, window_start);

-- Create function to clean up old rate limit records
CREATE OR REPLACE FUNCTION public.cleanup_expired_rate_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.rate_limits
  WHERE window_start < now() - interval '24 hours';
END;
$$;
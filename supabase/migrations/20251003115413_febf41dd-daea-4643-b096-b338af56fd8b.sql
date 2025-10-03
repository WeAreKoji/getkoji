-- Enhanced Document Security System

-- 1. IP Whitelist for Document Access
CREATE TABLE IF NOT EXISTS public.document_access_ip_whitelist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address inet NOT NULL UNIQUE,
  description text,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  created_by uuid REFERENCES auth.users(id)
);

ALTER TABLE public.document_access_ip_whitelist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only super admins manage IP whitelist"
ON public.document_access_ip_whitelist
FOR ALL
USING (has_role(auth.uid(), 'admin'::user_role));

-- 2. Anomaly Detection Function
CREATE OR REPLACE FUNCTION public.detect_suspicious_document_access(
  _user_id uuid,
  _window_minutes integer DEFAULT 60
)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  access_count integer;
  distinct_ips integer;
BEGIN
  -- Count recent accesses and distinct IPs
  SELECT COUNT(*), COUNT(DISTINCT ip_address)
  INTO access_count, distinct_ips
  FROM public.document_access_logs
  WHERE accessed_by = _user_id
    AND created_at > now() - (_window_minutes || ' minutes')::interval;
  
  -- Flag if >5 accesses from >3 different IPs in the time window
  RETURN (access_count > 5 AND distinct_ips > 3);
END;
$$;

-- 3. Enhanced Alert Trigger for Document Access
CREATE OR REPLACE FUNCTION public.alert_on_suspicious_document_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Alert if suspicious pattern detected
  IF detect_suspicious_document_access(NEW.accessed_by, 60) THEN
    -- Send notifications to all admins
    INSERT INTO public.notifications (user_id, type, title, message, data)
    SELECT user_id, 
           'security_alert',
           'Suspicious Document Access Detected',
           'Multiple document accesses from different IPs detected for user: ' || NEW.accessed_by::text,
           jsonb_build_object(
             'log_id', NEW.id,
             'accessed_by', NEW.accessed_by,
             'verification_id', NEW.verification_id,
             'timestamp', NEW.created_at
           )
    FROM public.user_roles
    WHERE role = 'admin'::user_role;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS trigger_alert_on_suspicious_document_access ON public.document_access_logs;

-- Create trigger
CREATE TRIGGER trigger_alert_on_suspicious_document_access
AFTER INSERT ON public.document_access_logs
FOR EACH ROW
EXECUTE FUNCTION public.alert_on_suspicious_document_access();

-- 4. Auto-revoke Expired Document Permissions
CREATE OR REPLACE FUNCTION public.revoke_expired_document_permissions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.document_access_permissions
  SET is_active = false
  WHERE expires_at < now()
    AND is_active = true;
END;
$$;

-- 5. Check IP Whitelist Function
CREATE OR REPLACE FUNCTION public.is_ip_whitelisted(_ip_address inet)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.document_access_ip_whitelist
    WHERE ip_address = _ip_address
      AND (expires_at IS NULL OR expires_at > now())
  );
$$;

-- 6. Enhanced Document Access Validation
CREATE OR REPLACE FUNCTION public.validate_document_access_request(
  _user_id uuid,
  _ip_address inet,
  _access_reason text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
  has_permission boolean;
  is_suspicious boolean;
  reason_valid boolean;
BEGIN
  -- Check if user has document access permission
  has_permission := can_access_documents(_user_id);
  
  IF NOT has_permission THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'No document access permission'
    );
  END IF;
  
  -- Check for suspicious activity
  is_suspicious := detect_suspicious_document_access(_user_id, 60);
  
  IF is_suspicious THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'Suspicious activity detected. Access temporarily blocked.'
    );
  END IF;
  
  -- Validate access reason (must be at least 10 characters)
  reason_valid := (_access_reason IS NOT NULL AND LENGTH(TRIM(_access_reason)) >= 10);
  
  IF NOT reason_valid THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'Access reason required (minimum 10 characters)',
      'requires_reason', true
    );
  END IF;
  
  -- All checks passed
  RETURN jsonb_build_object(
    'allowed', true,
    'reason', 'Access granted'
  );
END;
$$;

-- 7. Create index for performance
CREATE INDEX IF NOT EXISTS idx_document_access_logs_user_time 
ON public.document_access_logs(accessed_by, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_document_access_logs_verification 
ON public.document_access_logs(verification_id, created_at DESC);

-- Add helpful comments
COMMENT ON FUNCTION public.detect_suspicious_document_access IS 'Detects suspicious patterns in document access attempts';
COMMENT ON FUNCTION public.validate_document_access_request IS 'Validates document access requests with enhanced security checks';
COMMENT ON TABLE public.document_access_ip_whitelist IS 'Approved IP addresses for document access';
COMMENT ON FUNCTION public.revoke_expired_document_permissions IS 'Automatically revokes expired document access permissions';

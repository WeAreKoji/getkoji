-- Add location_info to user_sessions table
ALTER TABLE user_sessions 
ADD COLUMN IF NOT EXISTS location_info jsonb;

-- Add index for location queries
CREATE INDEX IF NOT EXISTS idx_sessions_location 
ON user_sessions USING gin(location_info);

-- Update log_security_event function to accept location_info
CREATE OR REPLACE FUNCTION public.log_security_event(
  _user_id uuid,
  _event_type security_event_type,
  _severity text DEFAULT 'low'::text,
  _ip_address inet DEFAULT NULL::inet,
  _user_agent text DEFAULT NULL::text,
  _metadata jsonb DEFAULT NULL::jsonb,
  _location_info jsonb DEFAULT NULL::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  event_id uuid;
BEGIN
  INSERT INTO public.security_events (
    user_id,
    event_type,
    severity,
    ip_address,
    user_agent,
    metadata,
    location_info
  ) VALUES (
    _user_id,
    _event_type,
    _severity,
    _ip_address,
    _user_agent,
    _metadata,
    _location_info
  ) RETURNING id INTO event_id;
  
  RETURN event_id;
END;
$function$;
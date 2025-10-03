-- Drop the overly permissive existing policy
DROP POLICY IF EXISTS "Users can view public profile info" ON public.profiles;

-- Create privacy-aware helper function
CREATE OR REPLACE FUNCTION public.can_view_profile_field(
  profile_user_id UUID,
  field_name TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  profile_privacy_settings JSONB;
  setting_key TEXT;
  setting_value TEXT;
BEGIN
  -- Owner and admins can see everything
  IF auth.uid() = profile_user_id OR has_role(auth.uid(), 'admin'::user_role) THEN
    RETURN true;
  END IF;

  -- Get privacy settings
  SELECT privacy_settings INTO profile_privacy_settings
  FROM public.profiles
  WHERE id = profile_user_id;

  -- Map field names to privacy settings
  setting_key := CASE field_name
    WHEN 'email' THEN NULL -- email always private except for owner/admin
    WHEN 'age' THEN 'show_age'
    WHEN 'city' THEN 'show_location'
    WHEN 'avatar_url' THEN 'show_photos'
    WHEN 'bio' THEN 'show_interests' -- bio often contains interests
    ELSE 'default'
  END;

  -- Email is always private
  IF field_name = 'email' THEN
    RETURN false;
  END IF;

  -- Check if setting exists and is true
  IF setting_key IS NOT NULL AND profile_privacy_settings ? setting_key THEN
    setting_value := profile_privacy_settings ->> setting_key;
    RETURN setting_value::BOOLEAN;
  END IF;

  -- Default to showing public fields
  RETURN true;
END;
$$;

-- Create new privacy-respecting policy for viewing profiles
CREATE POLICY "Users can view profiles with privacy controls"
ON public.profiles
FOR SELECT
USING (
  -- Users can always see their own full profile
  auth.uid() = id
  OR
  -- Admins can see everything
  has_role(auth.uid(), 'admin'::user_role)
  OR
  -- Others can see profiles if they're visible in discover
  (
    (privacy_settings ->> 'show_in_discover')::boolean = true
  )
);

-- Create a view for safe profile access that respects privacy
CREATE OR REPLACE VIEW public.safe_profiles AS
SELECT 
  p.id,
  p.display_name,
  p.username,
  -- Only show email to owner or admin
  CASE 
    WHEN auth.uid() = p.id OR has_role(auth.uid(), 'admin'::user_role) 
    THEN p.email 
    ELSE NULL 
  END as email,
  -- Show age based on privacy settings
  CASE 
    WHEN auth.uid() = p.id 
      OR has_role(auth.uid(), 'admin'::user_role) 
      OR (p.privacy_settings ->> 'show_age')::boolean = true 
    THEN p.age 
    ELSE NULL 
  END as age,
  -- Show city based on privacy settings
  CASE 
    WHEN auth.uid() = p.id 
      OR has_role(auth.uid(), 'admin'::user_role) 
      OR (p.privacy_settings ->> 'show_location')::boolean = true 
    THEN p.city 
    ELSE NULL 
  END as city,
  -- Show bio based on privacy settings
  CASE 
    WHEN auth.uid() = p.id 
      OR has_role(auth.uid(), 'admin'::user_role) 
      OR (p.privacy_settings ->> 'show_interests')::boolean = true 
    THEN p.bio 
    ELSE NULL 
  END as bio,
  -- Show avatar based on privacy settings
  CASE 
    WHEN auth.uid() = p.id 
      OR has_role(auth.uid(), 'admin'::user_role) 
      OR (p.privacy_settings ->> 'show_photos')::boolean = true 
    THEN p.avatar_url 
    ELSE NULL 
  END as avatar_url,
  -- Always show username and intent (public fields)
  p.intent,
  -- Show privacy settings to owner only
  CASE 
    WHEN auth.uid() = p.id OR has_role(auth.uid(), 'admin'::user_role) 
    THEN p.privacy_settings 
    ELSE NULL 
  END as privacy_settings,
  p.created_at,
  p.updated_at,
  p.username_updated_at
FROM public.profiles p;

-- Grant access to the safe view
GRANT SELECT ON public.safe_profiles TO authenticated;
GRANT SELECT ON public.safe_profiles TO anon;

-- Add index to improve privacy_settings queries
CREATE INDEX IF NOT EXISTS idx_profiles_privacy_show_in_discover 
ON public.profiles ((privacy_settings ->> 'show_in_discover'));

-- Create audit log for profile access
CREATE TABLE IF NOT EXISTS public.profile_access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  accessed_by UUID,
  access_type TEXT NOT NULL CHECK (access_type IN ('view', 'search', 'discovery')),
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on audit logs
ALTER TABLE public.profile_access_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view logs for their own profile
CREATE POLICY "Users can view own profile access logs"
ON public.profile_access_logs
FOR SELECT
USING (
  profile_id = auth.uid() OR has_role(auth.uid(), 'admin'::user_role)
);

-- Policy: System can insert logs
CREATE POLICY "System can insert profile access logs"
ON public.profile_access_logs
FOR INSERT
WITH CHECK (true);

-- Create function to log profile access
CREATE OR REPLACE FUNCTION public.log_profile_access(
  _profile_id UUID,
  _access_type TEXT DEFAULT 'view',
  _ip_address INET DEFAULT NULL,
  _user_agent TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  log_id UUID;
BEGIN
  INSERT INTO public.profile_access_logs (
    profile_id,
    accessed_by,
    access_type,
    ip_address,
    user_agent
  )
  VALUES (
    _profile_id,
    auth.uid(),
    _access_type,
    _ip_address,
    _user_agent
  )
  RETURNING id INTO log_id;

  RETURN log_id;
END;
$$;

-- Add comment explaining the privacy model
COMMENT ON TABLE public.profiles IS 'User profiles with privacy-aware access controls. Use safe_profiles view for privacy-respecting queries.';
COMMENT ON VIEW public.safe_profiles IS 'Privacy-respecting view of profiles that filters sensitive data based on user privacy settings.';
-- Fix email exposure in profiles table
-- Step 1: Update RLS policy to restrict profile viewing
DROP POLICY IF EXISTS "Users can view profiles with privacy controls" ON public.profiles;

CREATE POLICY "Users can view own profile or admin can view all"
ON public.profiles
FOR SELECT
USING (
  auth.uid() = id 
  OR has_role(auth.uid(), 'admin'::user_role)
);

-- Step 2: Create a safe public view for discoverable profiles (NO EMAIL)
CREATE OR REPLACE VIEW public.discoverable_profiles AS
SELECT 
  p.id,
  p.display_name,
  p.username,
  p.age,
  p.city,
  p.bio,
  p.avatar_url,
  p.intent,
  p.privacy_settings,
  p.created_at,
  p.updated_at
FROM public.profiles p
WHERE COALESCE((p.privacy_settings ->> 'show_in_discover')::boolean, true) = true;

-- Grant SELECT on the view to authenticated users
GRANT SELECT ON public.discoverable_profiles TO authenticated;

COMMENT ON VIEW public.discoverable_profiles IS 
'Public view of profiles that have opted into discovery. Email addresses are NEVER exposed through this view. Use this for browse/discover features.';

-- Step 3: Update get_safe_profile function to be more explicit about email protection
CREATE OR REPLACE FUNCTION public.get_safe_profile(profile_id UUID)
RETURNS TABLE (
  id UUID,
  display_name TEXT,
  username TEXT,
  email TEXT,
  age INTEGER,
  city TEXT,
  bio TEXT,
  avatar_url TEXT,
  intent TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.display_name,
    p.username,
    -- CRITICAL: Only show email to owner or admin, NEVER to others
    CASE 
      WHEN auth.uid() = p.id OR has_role(auth.uid(), 'admin'::user_role) 
      THEN p.email 
      ELSE NULL 
    END as email,
    -- Show age based on privacy settings
    CASE 
      WHEN auth.uid() = p.id 
        OR has_role(auth.uid(), 'admin'::user_role) 
        OR COALESCE((p.privacy_settings ->> 'show_age')::boolean, true)
      THEN p.age 
      ELSE NULL 
    END as age,
    -- Show city based on privacy settings
    CASE 
      WHEN auth.uid() = p.id 
        OR has_role(auth.uid(), 'admin'::user_role) 
        OR COALESCE((p.privacy_settings ->> 'show_location')::boolean, true)
      THEN p.city 
      ELSE NULL 
    END as city,
    -- Show bio based on privacy settings
    CASE 
      WHEN auth.uid() = p.id 
        OR has_role(auth.uid(), 'admin'::user_role) 
        OR COALESCE((p.privacy_settings ->> 'show_interests')::boolean, true)
      THEN p.bio 
      ELSE NULL 
    END as bio,
    -- Show avatar based on privacy settings
    CASE 
      WHEN auth.uid() = p.id 
        OR has_role(auth.uid(), 'admin'::user_role) 
        OR COALESCE((p.privacy_settings ->> 'show_photos')::boolean, true)
      THEN p.avatar_url 
      ELSE NULL 
    END as avatar_url,
    p.intent,
    p.created_at
  FROM public.profiles p
  WHERE p.id = profile_id
    AND (
      -- Must be able to see this profile
      auth.uid() = p.id
      OR has_role(auth.uid(), 'admin'::user_role)
      OR COALESCE((p.privacy_settings ->> 'show_in_discover')::boolean, true)
    );
END;
$$;

COMMENT ON FUNCTION public.get_safe_profile IS 
'Returns a single profile with privacy-aware field filtering. Email is ONLY visible to the profile owner and admins. Use this function when displaying profile data to respect user privacy.';
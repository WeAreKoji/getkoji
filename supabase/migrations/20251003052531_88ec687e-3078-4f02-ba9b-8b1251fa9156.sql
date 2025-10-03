-- Drop and recreate the safe_profiles view without SECURITY DEFINER
-- The underlying RLS policies on profiles table will handle access control
DROP VIEW IF EXISTS public.safe_profiles;

CREATE VIEW public.safe_profiles AS
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
FROM public.profiles p
-- The RLS policies on profiles will restrict which rows are visible
WHERE (
  -- Users can see their own profile
  auth.uid() = p.id
  OR
  -- Admins can see all profiles
  has_role(auth.uid(), 'admin'::user_role)
  OR
  -- Others can see profiles visible in discover
  COALESCE((p.privacy_settings ->> 'show_in_discover')::boolean, true)
);

-- Grant access to the view
GRANT SELECT ON public.safe_profiles TO authenticated;
GRANT SELECT ON public.safe_profiles TO anon;

-- Update comment
COMMENT ON VIEW public.safe_profiles IS 'Privacy-respecting view of profiles that filters sensitive data based on user privacy settings. Access controlled by RLS policies on underlying profiles table.';
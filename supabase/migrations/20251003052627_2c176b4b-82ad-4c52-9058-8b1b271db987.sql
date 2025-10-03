-- Drop the safe_profiles view entirely
-- Views with auth.uid() are automatically security definer, which is flagged by linter
-- Instead, applications should query profiles table directly with RLS protection
-- and handle field-level privacy in application code or via functions

DROP VIEW IF EXISTS public.safe_profiles;

-- Update the profiles table comment with usage guidelines
COMMENT ON TABLE public.profiles IS 
'User profiles with privacy-aware RLS. 
IMPORTANT: Email addresses are ONLY visible to profile owner and admins. 
Other fields respect privacy_settings JSONB column.
Applications should check privacy_settings before displaying:
- show_age: whether to show age field
- show_location: whether to show city field  
- show_photos: whether to show avatar_url
- show_interests: whether to show bio
- show_in_discover: whether profile appears in discovery

Example query with privacy respect:
SELECT 
  id, display_name, username,
  CASE WHEN can_view_email(id) THEN email ELSE NULL END as email,
  CASE WHEN (privacy_settings->>''show_age'')::boolean THEN age END as age
FROM profiles 
WHERE id = $1;';

-- Create a helper function for safe profile queries that respects privacy
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
    p.intent,
    p.created_at
  FROM public.profiles p
  WHERE p.id = profile_id
    AND (
      -- Must be able to see this profile per RLS
      auth.uid() = p.id
      OR has_role(auth.uid(), 'admin'::user_role)
      OR COALESCE((p.privacy_settings ->> 'show_in_discover')::boolean, true)
    );
END;
$$;

COMMENT ON FUNCTION public.get_safe_profile IS 'Returns a single profile with privacy-aware field filtering. Use this function when you need to display profile data to respect user privacy settings.';
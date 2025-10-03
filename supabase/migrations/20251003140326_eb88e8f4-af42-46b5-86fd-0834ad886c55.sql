-- Drop and recreate get_safe_profile function with correct enum handling
DROP FUNCTION IF EXISTS public.get_safe_profile(uuid);

CREATE FUNCTION public.get_safe_profile(profile_id UUID)
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
  gender TEXT,
  interested_in_gender TEXT[],
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.display_name,
    p.username,
    -- Email is ONLY visible to the profile owner and admins
    CASE 
      WHEN auth.uid() = p.id OR has_role(auth.uid(), 'admin'::user_role) 
      THEN p.email 
      ELSE NULL 
    END as email,
    -- Age handling based on privacy settings
    CASE 
      WHEN auth.uid() = p.id OR has_role(auth.uid(), 'admin'::user_role) THEN p.age
      WHEN COALESCE((p.privacy_settings ->> 'show_age')::text, 'exact') = 'exact' THEN p.age
      WHEN COALESCE((p.privacy_settings ->> 'show_age')::text, 'exact') = 'range' THEN 
        -- Round to nearest 5 for range display
        ((p.age / 5) * 5)::INTEGER
      ELSE NULL  -- hidden
    END as age,
    -- City handling based on privacy settings
    CASE 
      WHEN auth.uid() = p.id OR has_role(auth.uid(), 'admin'::user_role) THEN p.city
      WHEN COALESCE((p.privacy_settings ->> 'show_location')::text, 'exact') = 'exact' THEN p.city
      WHEN COALESCE((p.privacy_settings ->> 'show_location')::text, 'exact') = 'region' THEN 
        -- Show only city for now; in future, could extract region
        p.city
      ELSE NULL  -- hidden
    END as city,
    p.bio,
    p.avatar_url,
    -- Cast enum types to TEXT
    p.intent::TEXT as intent,
    p.gender::TEXT as gender,
    p.interested_in_gender,
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

COMMENT ON FUNCTION public.get_safe_profile IS 'Returns a single profile with privacy-aware field filtering. Email is ONLY visible to the profile owner and admins. Enum types are cast to TEXT.';
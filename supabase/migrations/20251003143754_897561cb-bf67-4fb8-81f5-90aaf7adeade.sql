-- Create optimized RPC function to fetch creators with profiles in a single query
CREATE OR REPLACE FUNCTION public.get_creators_with_profiles()
RETURNS TABLE (
  creator_id uuid,
  user_id uuid,
  subscription_price numeric,
  subscriber_count integer,
  id_verified boolean,
  welcome_video_url text,
  cover_image_url text,
  tagline text,
  showcase_bio text,
  creator_created_at timestamptz,
  display_name text,
  username text,
  avatar_url text,
  bio text,
  city text,
  age integer,
  profile_created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    cp.id as creator_id,
    cp.user_id,
    cp.subscription_price,
    cp.subscriber_count,
    cp.id_verified,
    cp.welcome_video_url,
    cp.cover_image_url,
    cp.tagline,
    cp.showcase_bio,
    cp.created_at as creator_created_at,
    -- Profile fields with privacy logic
    p.display_name,
    p.username,
    p.avatar_url,
    p.bio,
    -- City with privacy
    CASE 
      WHEN COALESCE((p.privacy_settings ->> 'show_location')::text, 'exact') = 'exact' THEN p.city
      WHEN COALESCE((p.privacy_settings ->> 'show_location')::text, 'exact') = 'region' THEN p.city
      ELSE NULL
    END as city,
    -- Age with privacy
    CASE 
      WHEN COALESCE((p.privacy_settings ->> 'show_age')::text, 'exact') = 'exact' THEN p.age
      WHEN COALESCE((p.privacy_settings ->> 'show_age')::text, 'exact') = 'range' THEN ((p.age / 5) * 5)::INTEGER
      ELSE NULL
    END as age,
    p.created_at as profile_created_at
  FROM public.creator_profiles cp
  INNER JOIN public.profiles p ON p.id = cp.user_id
  WHERE COALESCE((p.privacy_settings->>'show_in_discover')::boolean, true) = true
  ORDER BY cp.created_at DESC;
END;
$$;
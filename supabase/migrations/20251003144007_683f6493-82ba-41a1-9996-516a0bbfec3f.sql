-- Update get_creators_with_profiles to support pagination
DROP FUNCTION IF EXISTS public.get_creators_with_profiles();

CREATE OR REPLACE FUNCTION public.get_creators_with_profiles(
  p_limit integer DEFAULT 12,
  p_offset integer DEFAULT 0
)
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
  profile_created_at timestamptz,
  total_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH creator_data AS (
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
      p.display_name,
      p.username,
      p.avatar_url,
      p.bio,
      CASE 
        WHEN COALESCE((p.privacy_settings ->> 'show_location')::text, 'exact') = 'exact' THEN p.city
        WHEN COALESCE((p.privacy_settings ->> 'show_location')::text, 'exact') = 'region' THEN p.city
        ELSE NULL
      END as city,
      CASE 
        WHEN COALESCE((p.privacy_settings ->> 'show_age')::text, 'exact') = 'exact' THEN p.age
        WHEN COALESCE((p.privacy_settings ->> 'show_age')::text, 'exact') = 'range' THEN ((p.age / 5) * 5)::INTEGER
        ELSE NULL
      END as age,
      p.created_at as profile_created_at,
      COUNT(*) OVER() as total_count
    FROM public.creator_profiles cp
    INNER JOIN public.profiles p ON p.id = cp.user_id
    WHERE COALESCE((p.privacy_settings->>'show_in_discover')::boolean, true) = true
    ORDER BY cp.created_at DESC
    LIMIT p_limit
    OFFSET p_offset
  )
  SELECT * FROM creator_data;
END;
$$;
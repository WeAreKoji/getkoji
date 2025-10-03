-- Drop existing function
DROP FUNCTION IF EXISTS public.get_creators_with_profiles(integer, integer);

-- Create enhanced version with filters
CREATE OR REPLACE FUNCTION public.get_creators_with_profiles(
  p_limit integer DEFAULT 12,
  p_offset integer DEFAULT 0,
  p_search text DEFAULT NULL,
  p_gender text DEFAULT NULL,
  p_location text DEFAULT NULL,
  p_min_age integer DEFAULT NULL,
  p_max_age integer DEFAULT NULL,
  p_min_price numeric DEFAULT NULL,
  p_max_price numeric DEFAULT NULL,
  p_verified_only boolean DEFAULT false,
  p_min_subscribers integer DEFAULT NULL,
  p_sort_by text DEFAULT 'created_at',
  p_sort_direction text DEFAULT 'desc'
)
RETURNS TABLE(
  creator_id uuid,
  user_id uuid,
  subscription_price numeric,
  subscriber_count integer,
  id_verified boolean,
  welcome_video_url text,
  cover_image_url text,
  tagline text,
  showcase_bio text,
  creator_created_at timestamp with time zone,
  display_name text,
  username text,
  avatar_url text,
  bio text,
  city text,
  age integer,
  profile_created_at timestamp with time zone,
  total_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH filtered_creators AS (
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
      p.gender
    FROM public.creator_profiles cp
    INNER JOIN public.profiles p ON p.id = cp.user_id
    WHERE COALESCE((p.privacy_settings->>'show_in_discover')::boolean, true) = true
      -- Search filter
      AND (p_search IS NULL OR 
           p.display_name ILIKE '%' || p_search || '%' OR 
           p.username ILIKE '%' || p_search || '%' OR
           p.bio ILIKE '%' || p_search || '%')
      -- Gender filter
      AND (p_gender IS NULL OR p.gender::text = p_gender)
      -- Location filter
      AND (p_location IS NULL OR p.city ILIKE '%' || p_location || '%')
      -- Age filters
      AND (p_min_age IS NULL OR p.age >= p_min_age)
      AND (p_max_age IS NULL OR p.age <= p_max_age)
      -- Price filters
      AND (p_min_price IS NULL OR cp.subscription_price >= p_min_price)
      AND (p_max_price IS NULL OR cp.subscription_price <= p_max_price)
      -- Verified filter
      AND (p_verified_only = false OR cp.id_verified = true)
      -- Subscriber count filter
      AND (p_min_subscribers IS NULL OR cp.subscriber_count >= p_min_subscribers)
  ),
  sorted_creators AS (
    SELECT *,
      COUNT(*) OVER() as total_count
    FROM filtered_creators
    ORDER BY
      CASE WHEN p_sort_by = 'created_at' AND p_sort_direction = 'desc' THEN creator_created_at END DESC,
      CASE WHEN p_sort_by = 'created_at' AND p_sort_direction = 'asc' THEN creator_created_at END ASC,
      CASE WHEN p_sort_by = 'subscriber_count' AND p_sort_direction = 'desc' THEN subscriber_count END DESC,
      CASE WHEN p_sort_by = 'subscriber_count' AND p_sort_direction = 'asc' THEN subscriber_count END ASC,
      CASE WHEN p_sort_by = 'subscription_price' AND p_sort_direction = 'desc' THEN subscription_price END DESC,
      CASE WHEN p_sort_by = 'subscription_price' AND p_sort_direction = 'asc' THEN subscription_price END ASC,
      creator_created_at DESC
    LIMIT p_limit
    OFFSET p_offset
  )
  SELECT 
    creator_id,
    user_id,
    subscription_price,
    subscriber_count,
    id_verified,
    welcome_video_url,
    cover_image_url,
    tagline,
    showcase_bio,
    creator_created_at,
    display_name,
    username,
    avatar_url,
    bio,
    city,
    age,
    profile_created_at,
    total_count
  FROM sorted_creators;
END;
$$;
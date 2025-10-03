-- Add location columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8),
ADD COLUMN IF NOT EXISTS location_updated_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS location_sharing_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS location_accuracy TEXT DEFAULT 'approximate';

-- Add geospatial index for efficient distance queries
CREATE INDEX IF NOT EXISTS idx_profiles_location 
ON public.profiles (latitude, longitude)
WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- Function to calculate distance between two points (Haversine formula)
CREATE OR REPLACE FUNCTION public.calculate_distance(
  lat1 DECIMAL, lon1 DECIMAL,
  lat2 DECIMAL, lon2 DECIMAL
) RETURNS DECIMAL
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  R CONSTANT DECIMAL := 6371; -- Earth radius in km
  dLat DECIMAL;
  dLon DECIMAL;
  a DECIMAL;
  c DECIMAL;
BEGIN
  IF lat1 IS NULL OR lon1 IS NULL OR lat2 IS NULL OR lon2 IS NULL THEN
    RETURN NULL;
  END IF;
  
  dLat := radians(lat2 - lat1);
  dLon := radians(lon2 - lon1);
  
  a := sin(dLat/2) * sin(dLat/2) +
       cos(radians(lat1)) * cos(radians(lat2)) *
       sin(dLon/2) * sin(dLon/2);
  
  c := 2 * atan2(sqrt(a), sqrt(1-a));
  
  RETURN R * c;
END;
$$;

-- Update get_discover_profiles to include distance calculation
CREATE OR REPLACE FUNCTION public.get_discover_profiles_with_distance(
  user_id uuid,
  max_count integer DEFAULT 10,
  max_distance_km integer DEFAULT NULL,
  user_lat DECIMAL DEFAULT NULL,
  user_lon DECIMAL DEFAULT NULL
)
RETURNS TABLE(
  id uuid,
  display_name text,
  username text,
  age integer,
  city text,
  bio text,
  avatar_url text,
  intent text,
  privacy_settings jsonb,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  photos jsonb,
  photo_count integer,
  interests text[],
  is_creator boolean,
  creator_subscription_price numeric,
  creator_tagline text,
  id_verified boolean,
  distance_km DECIMAL
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  user_prefs RECORD;
BEGIN
  SELECT 
    COALESCE(dp.min_age, 18) as min_age,
    COALESCE(dp.max_age, 99) as max_age,
    COALESCE(dp.max_distance_km, 50) as max_distance_km,
    COALESCE(dp.interested_in, ARRAY['open_to_dating', 'make_friends', 'support_creators']) as interested_in,
    COALESCE(dp.show_verified_only, false) as show_verified_only,
    COALESCE(dp.show_creators_only, false) as show_creators_only,
    COALESCE(dp.show_non_creators, true) as show_non_creators,
    COALESCE(dp.interested_in_gender, ARRAY['male', 'female', 'non_binary', 'other']) as interested_in_gender
  INTO user_prefs
  FROM discovery_preferences dp
  WHERE dp.user_id = get_discover_profiles_with_distance.user_id;
  
  IF NOT FOUND THEN
    user_prefs.min_age := 18;
    user_prefs.max_age := 99;
    user_prefs.max_distance_km := 50;
    user_prefs.interested_in := ARRAY['open_to_dating', 'make_friends', 'support_creators'];
    user_prefs.show_verified_only := false;
    user_prefs.show_creators_only := false;
    user_prefs.show_non_creators := true;
    user_prefs.interested_in_gender := ARRAY['male', 'female', 'non_binary', 'other'];
  END IF;
  
  RETURN QUERY
  SELECT 
    p.id,
    p.display_name,
    p.username,
    p.age,
    p.city,
    p.bio,
    p.avatar_url,
    p.intent::TEXT,
    p.privacy_settings,
    p.created_at,
    p.updated_at,
    COALESCE(
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'id', pp.id,
            'photo_url', pp.photo_url,
            'order_index', pp.order_index
          ) ORDER BY pp.order_index
        )
        FROM profile_photos pp
        WHERE pp.user_id = p.id
      ),
      '[]'::jsonb
    ) as photos,
    COALESCE(
      (SELECT COUNT(*)::integer FROM profile_photos pp WHERE pp.user_id = p.id),
      0
    ) as photo_count,
    COALESCE(
      (
        SELECT array_agg(i.name)
        FROM user_interests ui
        JOIN interests i ON i.id = ui.interest_id
        WHERE ui.user_id = p.id
      ),
      ARRAY[]::text[]
    ) as interests,
    (cp.id IS NOT NULL) as is_creator,
    cp.subscription_price as creator_subscription_price,
    cp.tagline as creator_tagline,
    COALESCE(cp.id_verified, false) as id_verified,
    CASE 
      WHEN user_lat IS NOT NULL AND user_lon IS NOT NULL AND p.latitude IS NOT NULL AND p.longitude IS NOT NULL
      THEN calculate_distance(user_lat, user_lon, p.latitude, p.longitude)
      ELSE NULL
    END as distance_km
  FROM profiles p
  LEFT JOIN creator_profiles cp ON cp.user_id = p.id
  WHERE p.id != get_discover_profiles_with_distance.user_id
    AND COALESCE((p.privacy_settings->>'show_in_discover')::boolean, true) = true
    AND p.id NOT IN (
      SELECT blocked_id FROM blocked_users WHERE blocker_id = get_discover_profiles_with_distance.user_id
      UNION
      SELECT blocker_id FROM blocked_users WHERE blocked_id = get_discover_profiles_with_distance.user_id
    )
    AND p.id NOT IN (
      SELECT swiped_id FROM swipes WHERE swiper_id = get_discover_profiles_with_distance.user_id
    )
    AND p.age >= user_prefs.min_age
    AND p.age <= user_prefs.max_age
    AND (p.intent::TEXT = ANY(user_prefs.interested_in))
    AND (p.gender IS NULL OR p.gender::TEXT = ANY(user_prefs.interested_in_gender))
    AND (
      (user_prefs.show_creators_only = false AND user_prefs.show_non_creators = true)
      OR (user_prefs.show_creators_only = true AND user_prefs.show_non_creators = false AND cp.id IS NOT NULL)
      OR (user_prefs.show_creators_only = false AND user_prefs.show_non_creators = false AND cp.id IS NULL)
    )
    AND (
      user_prefs.show_verified_only = false
      OR (cp.id IS NOT NULL AND cp.id_verified = true)
    )
    AND (
      max_distance_km IS NULL 
      OR user_lat IS NULL 
      OR user_lon IS NULL
      OR p.latitude IS NULL
      OR p.longitude IS NULL
      OR calculate_distance(user_lat, user_lon, p.latitude, p.longitude) <= max_distance_km
    )
  ORDER BY p.created_at DESC
  LIMIT max_count;
END;
$$;
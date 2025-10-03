-- Phase 1: Fix get_discover_profiles RPC with correct ENUM values and casting
DROP FUNCTION IF EXISTS public.get_discover_profiles(uuid, integer);

CREATE OR REPLACE FUNCTION public.get_discover_profiles(user_id uuid, max_count integer DEFAULT 10)
RETURNS SETOF discoverable_profile_type
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  user_prefs RECORD;
BEGIN
  -- Get user's discovery preferences (with defaults if not found)
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
  WHERE dp.user_id = get_discover_profiles.user_id;
  
  -- If no preferences record, use all defaults
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
    p.intent,
    p.privacy_settings,
    p.created_at,
    p.updated_at
  FROM discoverable_profiles p
  LEFT JOIN creator_profiles cp ON cp.user_id = p.id
  WHERE p.id != get_discover_profiles.user_id
    -- Not already swiped
    AND p.id NOT IN (
      SELECT swiped_id
      FROM swipes
      WHERE swiper_id = get_discover_profiles.user_id
    )
    -- Age filter
    AND p.age >= user_prefs.min_age
    AND p.age <= user_prefs.max_age
    -- Intent filter - CAST p.intent to TEXT for comparison
    AND (
      p.intent::TEXT = ANY(user_prefs.interested_in)
    )
    -- Gender filter - if profile has gender set, match with user preferences
    AND (
      p.gender IS NULL 
      OR p.gender::TEXT = ANY(user_prefs.interested_in_gender)
    )
    -- Creator filter logic
    AND (
      -- If show both creators and non-creators (default)
      (user_prefs.show_creators_only = false AND user_prefs.show_non_creators = true)
      -- If show only creators
      OR (user_prefs.show_creators_only = true AND user_prefs.show_non_creators = false AND cp.id IS NOT NULL)
      -- If show only non-creators
      OR (user_prefs.show_creators_only = false AND user_prefs.show_non_creators = false AND cp.id IS NULL)
    )
    -- Verified only filter
    AND (
      user_prefs.show_verified_only = false
      OR (cp.id IS NOT NULL AND cp.id_verified = true)
    )
  ORDER BY p.created_at DESC
  LIMIT max_count;
END;
$function$;

-- Phase 1: Update discovery_preferences default values to match ENUM
ALTER TABLE public.discovery_preferences 
ALTER COLUMN interested_in SET DEFAULT ARRAY['open_to_dating', 'make_friends', 'support_creators'];

-- Phase 2: Add gender enum and columns
CREATE TYPE public.gender AS ENUM ('male', 'female', 'non_binary', 'other', 'prefer_not_to_say');

-- Add gender column to profiles
ALTER TABLE public.profiles 
ADD COLUMN gender public.gender,
ADD COLUMN interested_in_gender TEXT[] DEFAULT ARRAY['male', 'female', 'non_binary', 'other'];

-- Add gender filter to discovery_preferences
ALTER TABLE public.discovery_preferences
ADD COLUMN interested_in_gender TEXT[] DEFAULT ARRAY['male', 'female', 'non_binary', 'other'];

-- Update discoverable_profiles view to include gender
DROP VIEW IF EXISTS public.discoverable_profiles CASCADE;

CREATE VIEW public.discoverable_profiles AS
SELECT 
  p.id,
  p.display_name,
  p.username,
  p.age,
  p.city,
  p.bio,
  p.avatar_url,
  p.intent,
  p.gender,
  p.privacy_settings,
  p.created_at,
  p.updated_at
FROM public.profiles p
WHERE COALESCE((p.privacy_settings->>'show_in_discover')::boolean, true) = true;
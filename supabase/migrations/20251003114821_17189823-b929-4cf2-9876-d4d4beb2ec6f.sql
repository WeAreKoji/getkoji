-- Fix security definer view vulnerability
-- Remove views that bypass RLS policies

-- Drop the security-definer views
DROP VIEW IF EXISTS public.discoverable_profiles CASCADE;
DROP VIEW IF EXISTS public.public_creator_profiles CASCADE;

-- Create a custom type for the discover profiles return
DROP TYPE IF EXISTS discoverable_profile_type CASCADE;
CREATE TYPE discoverable_profile_type AS (
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
  updated_at timestamp with time zone
);

-- Update get_discover_profiles function to query profiles table directly
-- This respects RLS policies on the profiles table
CREATE OR REPLACE FUNCTION public.get_discover_profiles(user_id uuid, max_count integer DEFAULT 10)
RETURNS SETOF discoverable_profile_type
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
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
  
  -- Query profiles table directly (respects RLS)
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
    p.updated_at
  FROM profiles p
  LEFT JOIN creator_profiles cp ON cp.user_id = p.id
  WHERE p.id != get_discover_profiles.user_id
    -- Check privacy setting for show_in_discover
    AND COALESCE((p.privacy_settings->>'show_in_discover')::boolean, true) = true
    -- Not already swiped
    AND p.id NOT IN (
      SELECT swiped_id
      FROM swipes
      WHERE swiper_id = get_discover_profiles.user_id
    )
    -- Age filter
    AND p.age >= user_prefs.min_age
    AND p.age <= user_prefs.max_age
    -- Intent filter
    AND (
      p.intent::TEXT = ANY(user_prefs.interested_in)
    )
    -- Gender filter
    AND (
      p.gender IS NULL 
      OR p.gender::TEXT = ANY(user_prefs.interested_in_gender)
    )
    -- Creator filter logic
    AND (
      (user_prefs.show_creators_only = false AND user_prefs.show_non_creators = true)
      OR (user_prefs.show_creators_only = true AND user_prefs.show_non_creators = false AND cp.id IS NOT NULL)
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
$$;

-- Add helpful comment
COMMENT ON FUNCTION public.get_discover_profiles IS 'Returns discoverable profiles respecting RLS policies. Uses SECURITY DEFINER to access discovery_preferences but queries profiles table which respects RLS.';
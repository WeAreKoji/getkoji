-- Fix get_discover_profiles function to exclude email
-- Create a safe return type for discoverable profiles
CREATE TYPE public.discoverable_profile_type AS (
  id uuid,
  display_name text,
  username text,
  age integer,
  city text,
  bio text,
  avatar_url text,
  intent user_intent,
  privacy_settings jsonb,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
);

-- Drop and recreate the function with safe return type
DROP FUNCTION IF EXISTS public.get_discover_profiles(uuid, integer);

CREATE OR REPLACE FUNCTION public.get_discover_profiles(user_id uuid, max_count integer DEFAULT 10)
RETURNS SETOF discoverable_profile_type
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  -- Return profiles from the secure view (excludes email)
  SELECT 
    id,
    display_name,
    username,
    age,
    city,
    bio,
    avatar_url,
    intent,
    privacy_settings,
    created_at,
    updated_at
  FROM discoverable_profiles
  WHERE id != user_id
  AND id NOT IN (
    SELECT swiped_id
    FROM swipes
    WHERE swiper_id = user_id
  )
  ORDER BY created_at DESC
  LIMIT max_count;
$$;
-- Create saved_profiles table
CREATE TABLE public.saved_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  saved_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, saved_profile_id),
  CHECK (user_id != saved_profile_id)
);

-- Enable RLS
ALTER TABLE public.saved_profiles ENABLE ROW LEVEL SECURITY;

-- RLS policies for saved_profiles
CREATE POLICY "Users can view own saved profiles"
  ON public.saved_profiles
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can save profiles"
  ON public.saved_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own saved profiles"
  ON public.saved_profiles
  FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own saved profiles"
  ON public.saved_profiles
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX idx_saved_profiles_user_id ON public.saved_profiles(user_id);
CREATE INDEX idx_saved_profiles_saved_profile_id ON public.saved_profiles(saved_profile_id);

-- Create blocked_users table
CREATE TABLE public.blocked_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(blocker_id, blocked_id),
  CHECK (blocker_id != blocked_id)
);

-- Enable RLS
ALTER TABLE public.blocked_users ENABLE ROW LEVEL SECURITY;

-- RLS policies for blocked_users
CREATE POLICY "Users can view own blocks"
  ON public.blocked_users
  FOR SELECT
  USING (auth.uid() = blocker_id);

CREATE POLICY "Users can block other users"
  ON public.blocked_users
  FOR INSERT
  WITH CHECK (auth.uid() = blocker_id);

CREATE POLICY "Users can unblock"
  ON public.blocked_users
  FOR DELETE
  USING (auth.uid() = blocker_id);

-- Create indexes
CREATE INDEX idx_blocked_users_blocker_id ON public.blocked_users(blocker_id);
CREATE INDEX idx_blocked_users_blocked_id ON public.blocked_users(blocked_id);

-- Update get_discover_profiles to exclude blocked users
CREATE OR REPLACE FUNCTION public.get_discover_profiles(user_id uuid, max_count integer DEFAULT 10)
RETURNS SETOF discoverable_profile_type
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $function$
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
  WHERE dp.user_id = get_discover_profiles.user_id;
  
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
    p.updated_at
  FROM profiles p
  LEFT JOIN creator_profiles cp ON cp.user_id = p.id
  WHERE p.id != get_discover_profiles.user_id
    AND COALESCE((p.privacy_settings->>'show_in_discover')::boolean, true) = true
    -- Exclude blocked users (both ways)
    AND p.id NOT IN (
      SELECT blocked_id FROM blocked_users WHERE blocker_id = get_discover_profiles.user_id
      UNION
      SELECT blocker_id FROM blocked_users WHERE blocked_id = get_discover_profiles.user_id
    )
    AND p.id NOT IN (
      SELECT swiped_id FROM swipes WHERE swiper_id = get_discover_profiles.user_id
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
  ORDER BY p.created_at DESC
  LIMIT max_count;
END;
$function$;
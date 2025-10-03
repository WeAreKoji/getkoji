-- Create discovery_preferences table
CREATE TABLE public.discovery_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  
  -- Age preferences
  min_age INTEGER DEFAULT 18 CHECK (min_age >= 18 AND min_age <= 100),
  max_age INTEGER DEFAULT 99 CHECK (max_age >= 18 AND max_age <= 100),
  
  -- Location/Distance preferences
  max_distance_km INTEGER DEFAULT 50 CHECK (max_distance_km > 0 AND max_distance_km <= 500),
  
  -- Intent preferences (array of intents they're interested in seeing)
  interested_in TEXT[] DEFAULT ARRAY['dating', 'friendship', 'networking'],
  
  -- Verification/Creator filters
  show_verified_only BOOLEAN DEFAULT false,
  show_creators_only BOOLEAN DEFAULT false,
  show_non_creators BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.discovery_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage own discovery preferences"
ON public.discovery_preferences
FOR ALL
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_discovery_preferences_updated_at
BEFORE UPDATE ON public.discovery_preferences
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Update get_discover_profiles to respect preferences
CREATE OR REPLACE FUNCTION public.get_discover_profiles(
  user_id UUID, 
  max_count INTEGER DEFAULT 10
)
RETURNS SETOF discoverable_profile_type
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  user_prefs RECORD;
BEGIN
  -- Get user's discovery preferences (with defaults if not found)
  SELECT 
    COALESCE(dp.min_age, 18) as min_age,
    COALESCE(dp.max_age, 99) as max_age,
    COALESCE(dp.max_distance_km, 50) as max_distance_km,
    COALESCE(dp.interested_in, ARRAY['dating', 'friendship', 'networking']) as interested_in,
    COALESCE(dp.show_verified_only, false) as show_verified_only,
    COALESCE(dp.show_creators_only, false) as show_creators_only,
    COALESCE(dp.show_non_creators, true) as show_non_creators
  INTO user_prefs
  FROM discovery_preferences dp
  WHERE dp.user_id = get_discover_profiles.user_id;
  
  -- If no preferences record, use all defaults
  IF NOT FOUND THEN
    user_prefs.min_age := 18;
    user_prefs.max_age := 99;
    user_prefs.max_distance_km := 50;
    user_prefs.interested_in := ARRAY['dating', 'friendship', 'networking'];
    user_prefs.show_verified_only := false;
    user_prefs.show_creators_only := false;
    user_prefs.show_non_creators := true;
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
    -- Intent filter (show if their intent matches what user is interested in)
    AND (
      p.intent = ANY(user_prefs.interested_in)
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
$$;
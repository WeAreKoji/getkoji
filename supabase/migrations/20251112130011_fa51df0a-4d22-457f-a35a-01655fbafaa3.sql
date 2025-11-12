-- Phase 1: Post Analytics, Typing Indicators, Photo Sharing, Smart Ranking

-- 1. Post Analytics Table
CREATE TABLE IF NOT EXISTS public.post_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.creator_posts(id) ON DELETE CASCADE,
  view_count INTEGER DEFAULT 0,
  engagement_count INTEGER DEFAULT 0,
  unique_viewers INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(post_id)
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_post_analytics_post_id ON public.post_analytics(post_id);
CREATE INDEX IF NOT EXISTS idx_post_analytics_engagement ON public.post_analytics(engagement_count DESC);

-- 2. Extend messages table for photo sharing
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'photo', 'system')),
ADD COLUMN IF NOT EXISTS media_url TEXT,
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Index for message types
CREATE INDEX IF NOT EXISTS idx_messages_type ON public.messages(message_type);

-- 3. Typing Indicators Table (short-lived real-time data)
CREATE TABLE IF NOT EXISTS public.typing_indicators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  is_typing BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT (now() + interval '5 seconds'),
  UNIQUE(match_id, user_id)
);

-- Index for real-time queries
CREATE INDEX IF NOT EXISTS idx_typing_match_id ON public.typing_indicators(match_id);
CREATE INDEX IF NOT EXISTS idx_typing_expires ON public.typing_indicators(expires_at);

-- 4. Profile Activity Tracking for Smart Ranking
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMPTZ DEFAULT now(),
ADD COLUMN IF NOT EXISTS profile_quality_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS response_rate NUMERIC(3,2) DEFAULT 0.00;

-- Index for activity-based queries
CREATE INDEX IF NOT EXISTS idx_profiles_last_active ON public.profiles(last_active_at DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_quality_score ON public.profiles(profile_quality_score DESC);

-- 5. Update post_analytics automatically
CREATE OR REPLACE FUNCTION public.increment_post_view(p_post_id UUID, p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.post_analytics (post_id, view_count, unique_viewers)
  VALUES (p_post_id, 1, 1)
  ON CONFLICT (post_id) 
  DO UPDATE SET 
    view_count = post_analytics.view_count + 1,
    updated_at = now();
END;
$$;

-- 6. Calculate profile quality score
CREATE OR REPLACE FUNCTION public.calculate_profile_quality_score(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  score INTEGER := 0;
  photo_count INTEGER;
BEGIN
  -- Base score for having a profile
  score := 10;
  
  -- Check profile completeness
  SELECT 
    CASE WHEN bio IS NOT NULL AND LENGTH(bio) > 20 THEN 15 ELSE 0 END +
    CASE WHEN avatar_url IS NOT NULL THEN 10 ELSE 0 END +
    CASE WHEN city IS NOT NULL THEN 5 ELSE 0 END +
    CASE WHEN age IS NOT NULL THEN 5 ELSE 0 END +
    CASE WHEN intent IS NOT NULL THEN 5 ELSE 0 END
  INTO score
  FROM public.profiles
  WHERE id = p_user_id;
  
  -- Add points for photos
  SELECT COUNT(*) INTO photo_count
  FROM public.profile_photos
  WHERE user_id = p_user_id;
  
  score := score + LEAST(photo_count * 10, 30);
  
  -- Add points for interests
  SELECT score + LEAST(COUNT(*) * 3, 15) INTO score
  FROM public.user_interests
  WHERE user_id = p_user_id;
  
  -- Add points for verification
  IF EXISTS (SELECT 1 FROM public.creator_profiles WHERE user_id = p_user_id AND id_verified = true) THEN
    score := score + 20;
  END IF;
  
  RETURN LEAST(score, 100);
END;
$$;

-- 7. Enhanced discover function with smart ranking
CREATE OR REPLACE FUNCTION public.get_discover_profiles_ranked(
  user_id UUID,
  max_count INTEGER DEFAULT 10,
  max_distance_km INTEGER DEFAULT NULL,
  user_lat NUMERIC DEFAULT NULL,
  user_lon NUMERIC DEFAULT NULL
)
RETURNS TABLE(
  id UUID,
  display_name TEXT,
  username TEXT,
  age INTEGER,
  city TEXT,
  bio TEXT,
  avatar_url TEXT,
  intent TEXT,
  privacy_settings JSONB,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  photos JSONB,
  photo_count INTEGER,
  interests TEXT[],
  is_creator BOOLEAN,
  creator_subscription_price NUMERIC,
  creator_tagline TEXT,
  id_verified BOOLEAN,
  distance_km NUMERIC,
  match_score INTEGER
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_prefs RECORD;
  user_interests TEXT[];
BEGIN
  -- Get user preferences
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
  WHERE dp.user_id = get_discover_profiles_ranked.user_id;
  
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
  
  -- Get user's interests for compatibility scoring
  SELECT ARRAY_AGG(i.name) INTO user_interests
  FROM user_interests ui
  JOIN interests i ON i.id = ui.interest_id
  WHERE ui.user_id = get_discover_profiles_ranked.user_id;
  
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
    END as distance_km,
    -- Calculate match score
    (
      -- Base score from profile quality
      COALESCE(p.profile_quality_score, 0) +
      -- Activity bonus (active in last 7 days)
      CASE WHEN p.last_active_at > now() - interval '7 days' THEN 15 ELSE 0 END +
      -- Interest overlap (up to 30 points)
      LEAST(
        (
          SELECT COUNT(*) * 5
          FROM user_interests ui
          JOIN interests i ON i.id = ui.interest_id
          WHERE ui.user_id = p.id
          AND i.name = ANY(user_interests)
        ),
        30
      ) +
      -- Creator bonus if user interested in creators
      CASE 
        WHEN user_prefs.show_creators_only AND cp.id IS NOT NULL THEN 10
        ELSE 0
      END +
      -- Verified bonus
      CASE WHEN cp.id_verified THEN 10 ELSE 0 END
    )::INTEGER as match_score
  FROM profiles p
  LEFT JOIN creator_profiles cp ON cp.user_id = p.id
  WHERE p.id != get_discover_profiles_ranked.user_id
    AND COALESCE((p.privacy_settings->>'show_in_discover')::boolean, true) = true
    AND p.id NOT IN (
      SELECT blocked_id FROM blocked_users WHERE blocker_id = get_discover_profiles_ranked.user_id
      UNION
      SELECT blocker_id FROM blocked_users WHERE blocked_id = get_discover_profiles_ranked.user_id
    )
    AND p.id NOT IN (
      SELECT swiped_id FROM swipes WHERE swiper_id = get_discover_profiles_ranked.user_id
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
  ORDER BY match_score DESC, p.last_active_at DESC NULLS LAST
  LIMIT max_count;
END;
$$;

-- 8. RLS Policies

-- Post Analytics
ALTER TABLE public.post_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Creators can view own post analytics"
ON public.post_analytics FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.creator_posts
    WHERE creator_posts.id = post_analytics.post_id
    AND creator_posts.creator_id = auth.uid()
  )
);

CREATE POLICY "System can update post analytics"
ON public.post_analytics FOR ALL
USING (true);

-- Typing Indicators
ALTER TABLE public.typing_indicators ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage typing in own matches"
ON public.typing_indicators FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.matches
    WHERE matches.id = typing_indicators.match_id
    AND (matches.user1_id = auth.uid() OR matches.user2_id = auth.uid())
  )
);

-- Cleanup function for expired typing indicators
CREATE OR REPLACE FUNCTION public.cleanup_expired_typing_indicators()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.typing_indicators
  WHERE expires_at < now();
END;
$$;
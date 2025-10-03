-- Drop and recreate get_discover_profiles with new columns
DROP FUNCTION IF EXISTS public.get_discover_profiles(uuid, integer);

CREATE OR REPLACE FUNCTION public.get_discover_profiles(user_id uuid, max_count integer DEFAULT 10)
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
  id_verified boolean
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
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
    p.updated_at,
    -- Aggregate photos as JSONB array
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
    -- Photo count
    COALESCE(
      (SELECT COUNT(*)::integer FROM profile_photos pp WHERE pp.user_id = p.id),
      0
    ) as photo_count,
    -- Interests array
    COALESCE(
      (
        SELECT array_agg(i.name)
        FROM user_interests ui
        JOIN interests i ON i.id = ui.interest_id
        WHERE ui.user_id = p.id
      ),
      ARRAY[]::text[]
    ) as interests,
    -- Creator info
    (cp.id IS NOT NULL) as is_creator,
    cp.subscription_price as creator_subscription_price,
    cp.tagline as creator_tagline,
    COALESCE(cp.id_verified, false) as id_verified
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

-- Update check_for_match trigger to create notifications
CREATE OR REPLACE FUNCTION public.check_for_match()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  match_id uuid;
  user1_name text;
  user2_name text;
  user1_avatar text;
  user2_avatar text;
BEGIN
  IF NEW.is_like = TRUE THEN
    -- Check if the other user also liked
    IF EXISTS (
      SELECT 1 FROM public.swipes
      WHERE swiper_id = NEW.swiped_id
      AND swiped_id = NEW.swiper_id
      AND is_like = TRUE
    ) THEN
      -- Create match (ensure user1_id < user2_id for uniqueness)
      INSERT INTO public.matches (user1_id, user2_id)
      VALUES (
        LEAST(NEW.swiper_id, NEW.swiped_id),
        GREATEST(NEW.swiper_id, NEW.swiped_id)
      )
      ON CONFLICT (user1_id, user2_id) DO NOTHING
      RETURNING id INTO match_id;
      
      -- Only create notifications if match was actually created (not a duplicate)
      IF match_id IS NOT NULL THEN
        -- Get profile info for both users
        SELECT display_name, avatar_url INTO user1_name, user1_avatar
        FROM profiles WHERE id = NEW.swiper_id;
        
        SELECT display_name, avatar_url INTO user2_name, user2_avatar
        FROM profiles WHERE id = NEW.swiped_id;
        
        -- Create notification for swiper (user who just swiped)
        INSERT INTO public.notifications (user_id, type, title, message, data)
        VALUES (
          NEW.swiper_id,
          'match',
          'It''s a Match! 🎉',
          'You matched with ' || user2_name,
          jsonb_build_object(
            'match_id', match_id,
            'matched_user_id', NEW.swiped_id,
            'matched_user_name', user2_name,
            'matched_user_avatar', user2_avatar
          )
        );
        
        -- Create notification for the other user
        INSERT INTO public.notifications (user_id, type, title, message, data)
        VALUES (
          NEW.swiped_id,
          'match',
          'It''s a Match! 🎉',
          'You matched with ' || user1_name,
          jsonb_build_object(
            'match_id', match_id,
            'matched_user_id', NEW.swiper_id,
            'matched_user_name', user1_name,
            'matched_user_avatar', user1_avatar
          )
        );
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;
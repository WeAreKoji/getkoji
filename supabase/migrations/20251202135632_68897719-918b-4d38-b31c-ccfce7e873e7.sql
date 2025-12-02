-- Drop and recreate get_likes_received with photos and interests
DROP FUNCTION IF EXISTS public.get_likes_received(uuid);

CREATE OR REPLACE FUNCTION public.get_likes_received(p_user_id uuid)
 RETURNS TABLE(id uuid, display_name text, username text, age integer, city text, bio text, avatar_url text, liked_at timestamp with time zone, is_creator boolean, id_verified boolean, photos jsonb, interests text[])
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.display_name,
    p.username,
    p.age,
    p.city,
    p.bio,
    p.avatar_url,
    s.created_at as liked_at,
    (cp.id IS NOT NULL) as is_creator,
    COALESCE(cp.id_verified, false) as id_verified,
    COALESCE(
      (SELECT jsonb_agg(
        jsonb_build_object(
          'id', pp.id,
          'photo_url', pp.photo_url,
          'order_index', pp.order_index
        ) ORDER BY pp.order_index
      )
      FROM profile_photos pp WHERE pp.user_id = p.id),
      '[]'::jsonb
    ) as photos,
    COALESCE(
      (SELECT array_agg(i.name)
       FROM user_interests ui
       JOIN interests i ON i.id = ui.interest_id
       WHERE ui.user_id = p.id),
      ARRAY[]::text[]
    ) as interests
  FROM swipes s
  INNER JOIN profiles p ON p.id = s.swiper_id
  LEFT JOIN creator_profiles cp ON cp.user_id = p.id
  WHERE s.swiped_id = p_user_id
    AND s.is_like = true
    AND s.swiper_id NOT IN (
      SELECT swiped_id FROM swipes WHERE swiper_id = p_user_id
    )
    AND s.swiper_id NOT IN (
      SELECT blocked_id FROM blocked_users WHERE blocker_id = p_user_id
      UNION
      SELECT blocker_id FROM blocked_users WHERE blocked_id = p_user_id
    )
    AND NOT EXISTS (
      SELECT 1 FROM matches m 
      WHERE (m.user1_id = p_user_id AND m.user2_id = s.swiper_id)
         OR (m.user2_id = p_user_id AND m.user1_id = s.swiper_id)
    )
  ORDER BY s.created_at DESC;
END;
$function$;
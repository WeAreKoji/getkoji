-- Update the check_for_match function to use 'new_match' instead of 'match'
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
          'new_match',
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
          'new_match',
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
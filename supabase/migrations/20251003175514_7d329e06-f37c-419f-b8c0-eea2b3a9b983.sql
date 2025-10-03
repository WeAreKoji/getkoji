-- Add read_at column to messages table
ALTER TABLE public.messages 
ADD COLUMN read_at timestamp with time zone;

-- Add index for efficient unread message queries
CREATE INDEX idx_messages_read_at ON public.messages(match_id, read_at) WHERE read_at IS NULL;

-- Add soft delete columns to matches table
ALTER TABLE public.matches 
ADD COLUMN deleted_by_user1 boolean DEFAULT false,
ADD COLUMN deleted_by_user2 boolean DEFAULT false,
ADD COLUMN last_message_at timestamp with time zone,
ADD COLUMN last_message_content text,
ADD COLUMN last_message_sender_id uuid;

-- Create index for efficient match queries
CREATE INDEX idx_matches_last_message ON public.matches(last_message_at DESC);

-- Create function to get matches with all details in a single query
CREATE OR REPLACE FUNCTION public.get_matches_with_details(p_user_id uuid)
RETURNS TABLE(
  match_id uuid,
  matched_at timestamp with time zone,
  other_user_id uuid,
  other_user_name text,
  other_user_avatar text,
  other_user_bio text,
  last_message_content text,
  last_message_created_at timestamp with time zone,
  last_message_sender_id uuid,
  unread_count bigint
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    m.id as match_id,
    m.matched_at,
    CASE 
      WHEN m.user1_id = p_user_id THEN m.user2_id
      ELSE m.user1_id
    END as other_user_id,
    p.display_name as other_user_name,
    p.avatar_url as other_user_avatar,
    p.bio as other_user_bio,
    m.last_message_content,
    m.last_message_at as last_message_created_at,
    m.last_message_sender_id,
    COALESCE(
      (
        SELECT COUNT(*)
        FROM messages msg
        WHERE msg.match_id = m.id
          AND msg.sender_id != p_user_id
          AND msg.read_at IS NULL
      ),
      0
    ) as unread_count
  FROM matches m
  INNER JOIN profiles p ON p.id = CASE 
    WHEN m.user1_id = p_user_id THEN m.user2_id
    ELSE m.user1_id
  END
  WHERE (m.user1_id = p_user_id OR m.user2_id = p_user_id)
    AND (
      (m.user1_id = p_user_id AND COALESCE(m.deleted_by_user1, false) = false)
      OR (m.user2_id = p_user_id AND COALESCE(m.deleted_by_user2, false) = false)
    )
  ORDER BY COALESCE(m.last_message_at, m.matched_at) DESC;
END;
$function$;

-- Create trigger to update match last_message fields
CREATE OR REPLACE FUNCTION public.update_match_last_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.matches
  SET 
    last_message_at = NEW.created_at,
    last_message_content = NEW.content,
    last_message_sender_id = NEW.sender_id
  WHERE id = NEW.match_id;
  
  RETURN NEW;
END;
$function$;

-- Create trigger on messages insert
DROP TRIGGER IF EXISTS update_match_last_message_trigger ON public.messages;
CREATE TRIGGER update_match_last_message_trigger
AFTER INSERT ON public.messages
FOR EACH ROW
EXECUTE FUNCTION public.update_match_last_message();

-- Enable realtime for matches table (messages already enabled)
ALTER PUBLICATION supabase_realtime ADD TABLE public.matches;
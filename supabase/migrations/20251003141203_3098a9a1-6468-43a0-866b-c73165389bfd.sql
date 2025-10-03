-- Create function to resolve username to user_id (bypasses RLS)
CREATE OR REPLACE FUNCTION public.get_user_id_by_username(p_username text)
RETURNS TABLE (id uuid)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id 
  FROM public.profiles p 
  WHERE p.username = p_username 
  LIMIT 1;
$$;

COMMENT ON FUNCTION public.get_user_id_by_username IS 'Resolves a username to a user ID, bypassing RLS for public username lookups';
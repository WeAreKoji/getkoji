-- Add username column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN username text UNIQUE,
ADD COLUMN username_updated_at timestamp with time zone;

-- Create index for fast username lookups
CREATE INDEX idx_profiles_username ON public.profiles(username);

-- Create function to validate username format
CREATE OR REPLACE FUNCTION public.validate_username()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Check if username is provided
  IF NEW.username IS NOT NULL THEN
    -- Convert to lowercase
    NEW.username := LOWER(NEW.username);
    
    -- Check length (3-30 characters)
    IF LENGTH(NEW.username) < 3 OR LENGTH(NEW.username) > 30 THEN
      RAISE EXCEPTION 'Username must be between 3 and 30 characters';
    END IF;
    
    -- Check format (alphanumeric and underscores only)
    IF NEW.username !~ '^[a-z0-9_]+$' THEN
      RAISE EXCEPTION 'Username can only contain lowercase letters, numbers, and underscores';
    END IF;
    
    -- Check for reserved words
    IF NEW.username IN ('admin', 'api', 'auth', 'profile', 'user', 'settings', 'discover', 'matches', 'chat', 'creators', 'about', 'privacy', 'terms', 'support') THEN
      RAISE EXCEPTION 'This username is reserved';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for username validation
CREATE TRIGGER validate_username_trigger
BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.validate_username();

-- Create function to check username availability
CREATE OR REPLACE FUNCTION public.check_username_available(desired_username text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE username = LOWER(desired_username)
  );
$$;
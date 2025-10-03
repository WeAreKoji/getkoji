-- Fix discoverable_profiles view to use security_invoker
DROP VIEW IF EXISTS public.discoverable_profiles;

CREATE VIEW public.discoverable_profiles
WITH (security_invoker = true) AS
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
FROM public.profiles
WHERE COALESCE((privacy_settings ->> 'show_in_discover')::boolean, true) = true;
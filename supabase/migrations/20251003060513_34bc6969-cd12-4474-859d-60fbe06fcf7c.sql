-- Fix discoverable profiles security issue
-- Add policy to allow authenticated users to view profiles in discovery
-- while respecting privacy settings

CREATE POLICY "Authenticated users can view discoverable profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  -- Users can view profiles that opted into discovery
  COALESCE((privacy_settings ->> 'show_in_discover')::boolean, true) = true
);
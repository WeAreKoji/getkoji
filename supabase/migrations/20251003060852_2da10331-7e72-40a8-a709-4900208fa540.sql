-- Fix email exposure in discoverable profiles
-- Drop the overly permissive policy that exposes emails
DROP POLICY IF EXISTS "Authenticated users can view discoverable profiles" ON public.profiles;

-- The discoverable_profiles VIEW already excludes email and should be used for discovery
-- Profiles table policies remain strict (owner or admin only)

-- Add a comment to document the security pattern
COMMENT ON VIEW public.discoverable_profiles IS 
'Security-safe view for user discovery. Excludes sensitive fields like email. 
Use this view for discovery features instead of querying profiles table directly.';
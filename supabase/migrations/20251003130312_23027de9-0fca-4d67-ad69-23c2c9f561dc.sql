-- Fix creator profiles visibility for all authenticated users
-- Drop the restrictive SELECT policy
DROP POLICY IF EXISTS "Owners and admins can view creator profiles" ON public.creator_profiles;

-- Create new public view policy for authenticated users
CREATE POLICY "Anyone can view creator profiles"
  ON public.creator_profiles
  FOR SELECT
  TO authenticated
  USING (true);

-- Note: INSERT and UPDATE policies remain unchanged (creators can manage own profile)
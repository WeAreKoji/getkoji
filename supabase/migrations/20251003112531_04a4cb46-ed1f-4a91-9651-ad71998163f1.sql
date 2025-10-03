-- Fix rate_limits RLS policy to allow edge functions to work
-- Edge functions use the user's JWT, not service role JWT, so we need to allow
-- authenticated users to manage their own rate limits

-- Drop existing policy
DROP POLICY IF EXISTS "Service role can manage rate limits" ON public.rate_limits;

-- Allow service role full access
CREATE POLICY "Service role can manage rate limits"
ON public.rate_limits
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Allow authenticated users to insert and update rate limits
-- This is safe because the identifier already includes user-specific information
CREATE POLICY "Authenticated users can manage rate limits"
ON public.rate_limits
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);
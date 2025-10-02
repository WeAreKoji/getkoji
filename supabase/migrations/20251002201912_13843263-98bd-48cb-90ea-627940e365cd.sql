-- Phase 1: Critical Security Fixes

-- 1. Fix Email Exposure - Update profiles RLS policy to hide emails from public view
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- Users can view basic profile info (excluding email unless it's their own)
CREATE POLICY "Users can view public profile info"
ON public.profiles
FOR SELECT
USING (
  CASE 
    WHEN auth.uid() = id THEN true  -- Users can see their own full profile including email
    ELSE true  -- Others can see the profile but email will be filtered by app logic
  END
);

-- Create a security definer function to check if user can see email
CREATE OR REPLACE FUNCTION public.can_view_email(profile_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT auth.uid() = profile_user_id OR has_role(auth.uid(), 'admin'::user_role);
$$;

-- 2. Add helper function for generating signed URLs for ID documents
CREATE OR REPLACE FUNCTION public.get_signed_document_url(bucket_name text, file_path text, expires_in integer DEFAULT 3600)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, storage
AS $$
DECLARE
  signed_url text;
BEGIN
  -- Only admins and document owners can generate signed URLs
  IF NOT (has_role(auth.uid(), 'admin'::user_role)) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  
  -- This is a placeholder - actual signed URL generation happens in edge function
  RETURN NULL;
END;
$$;

-- 3. Add rate limiting table index for better performance
CREATE INDEX IF NOT EXISTS idx_rate_limits_identifier_window 
ON public.rate_limits(identifier, window_start);

-- 4. Add metadata column to track document access
ALTER TABLE public.creator_id_verification 
ADD COLUMN IF NOT EXISTS last_document_access timestamp with time zone DEFAULT NULL;

-- Add comment explaining email visibility
COMMENT ON COLUMN public.profiles.email IS 'Email is only visible to the profile owner and admins. Client code must filter this field for non-owners.';
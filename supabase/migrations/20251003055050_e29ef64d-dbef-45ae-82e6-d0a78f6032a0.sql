-- Phase 1 & 2: Critical Security Fixes

-- 1.1 Fix Creator Profiles Financial Data Exposure
-- Drop existing overly permissive policy
DROP POLICY IF EXISTS "Anyone can view creator profiles" ON public.creator_profiles;

-- Create restrictive policy: only owners and admins can view full data
CREATE POLICY "Owners and admins can view creator profiles"
ON public.creator_profiles
FOR SELECT
USING (
  auth.uid() = user_id 
  OR has_role(auth.uid(), 'admin'::user_role)
);

-- Create public view with only non-sensitive creator data
CREATE OR REPLACE VIEW public.public_creator_profiles AS
SELECT 
  user_id,
  subscription_price,
  subscriber_count,
  id_verified,
  created_at
FROM public.creator_profiles;

-- Grant access to authenticated users
GRANT SELECT ON public.public_creator_profiles TO authenticated;

-- 2.1 Fix Profile View Tracking - Require Authentication
-- Drop overly permissive policy
DROP POLICY IF EXISTS "Anyone can create profile views" ON public.profile_views;

-- Require authentication and validate viewer_id
CREATE POLICY "Authenticated users can create own profile views"
ON public.profile_views
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = viewer_id OR viewer_id IS NULL);

-- 2.2 Restrict User Roles Visibility
-- Drop public access policy
DROP POLICY IF EXISTS "Anyone can view user roles" ON public.user_roles;

-- Only allow authenticated users to view roles
CREATE POLICY "Authenticated users can view user roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (true);
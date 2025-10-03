-- Fix profile photos privacy - Critical Security Issue
-- Drop the insecure policy that allows anyone to view all photos
DROP POLICY IF EXISTS "Anyone can view profile photos" ON public.profile_photos;

-- Create secure policy that respects privacy settings
CREATE POLICY "Authenticated users can view photos based on privacy"
ON public.profile_photos
FOR SELECT
TO authenticated
USING (
  -- Owner can always see their own photos
  auth.uid() = user_id
  OR
  -- Others can see photos if privacy setting allows
  EXISTS (
    SELECT 1 
    FROM public.profiles 
    WHERE profiles.id = profile_photos.user_id
    AND COALESCE((profiles.privacy_settings ->> 'show_photos')::boolean, true) = true
  )
);
-- Create storage bucket for creator content
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'creator-content',
  'creator-content',
  true,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/quicktime']
);

-- Storage RLS policies for creator content
CREATE POLICY "Anyone can view creator content"
ON storage.objects FOR SELECT
USING (bucket_id = 'creator-content');

CREATE POLICY "Creators can upload their own content"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'creator-content' 
  AND auth.uid()::text = (storage.foldername(name))[1]
  AND EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'creator'
  )
);

CREATE POLICY "Creators can delete their own content"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'creator-content' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Create edge function to handle secure role assignment
-- This fixes the RLS issue where users can't insert their own roles
CREATE OR REPLACE FUNCTION public.request_creator_role(application_text text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result json;
BEGIN
  -- Check if user is authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Check if user already has creator role
  IF EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'creator'
  ) THEN
    RETURN json_build_object(
      'success', false,
      'message', 'User already has creator role'
    );
  END IF;

  -- For MVP: Auto-approve and grant creator role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (auth.uid(), 'creator')
  ON CONFLICT (user_id, role) DO NOTHING;

  -- Return success
  RETURN json_build_object(
    'success', true,
    'message', 'Creator role granted successfully'
  );
END;
$$;
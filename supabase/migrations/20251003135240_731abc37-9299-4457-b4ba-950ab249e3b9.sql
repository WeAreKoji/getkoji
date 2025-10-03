-- Add new columns to creator_profiles for showcase customization
ALTER TABLE public.creator_profiles 
ADD COLUMN IF NOT EXISTS welcome_video_url TEXT,
ADD COLUMN IF NOT EXISTS cover_image_url TEXT,
ADD COLUMN IF NOT EXISTS tagline TEXT,
ADD COLUMN IF NOT EXISTS showcase_bio TEXT,
ADD COLUMN IF NOT EXISTS card_style JSONB DEFAULT '{}'::jsonb;

-- Create storage bucket for creator welcome videos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'creator-welcome-videos',
  'creator-welcome-videos',
  true,
  10485760, -- 10MB limit
  ARRAY['video/mp4', 'video/webm', 'video/quicktime']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for welcome videos
CREATE POLICY "Anyone can view welcome videos"
ON storage.objects FOR SELECT
USING (bucket_id = 'creator-welcome-videos');

CREATE POLICY "Creators can upload own welcome videos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'creator-welcome-videos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Creators can update own welcome videos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'creator-welcome-videos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Creators can delete own welcome videos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'creator-welcome-videos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
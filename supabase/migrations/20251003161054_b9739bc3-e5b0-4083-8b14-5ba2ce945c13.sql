-- Create profile_likes table for tracking profile likes
CREATE TABLE IF NOT EXISTS public.profile_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  liker_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  liked_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(liker_id, liked_id)
);

-- Enable RLS
ALTER TABLE public.profile_likes ENABLE ROW LEVEL SECURITY;

-- Policies for profile_likes
CREATE POLICY "Users can like profiles"
  ON public.profile_likes
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = liker_id);

CREATE POLICY "Users can unlike profiles"
  ON public.profile_likes
  FOR DELETE
  TO authenticated
  USING (auth.uid() = liker_id);

CREATE POLICY "Users can view their own likes"
  ON public.profile_likes
  FOR SELECT
  TO authenticated
  USING (auth.uid() = liker_id);

CREATE POLICY "Users can view likes on their profile"
  ON public.profile_likes
  FOR SELECT
  TO authenticated
  USING (auth.uid() = liked_id);

-- Create index for performance
CREATE INDEX idx_profile_likes_liker ON public.profile_likes(liker_id);
CREATE INDEX idx_profile_likes_liked ON public.profile_likes(liked_id);

-- Enable realtime for profile_views table
ALTER PUBLICATION supabase_realtime ADD TABLE public.profile_views;
-- Add content moderation fields to creator_posts
ALTER TABLE public.creator_posts
ADD COLUMN moderation_status text DEFAULT 'pending' CHECK (moderation_status IN ('pending', 'approved', 'rejected')),
ADD COLUMN moderated_by uuid REFERENCES auth.users(id),
ADD COLUMN moderated_at timestamp with time zone,
ADD COLUMN moderation_reason text;

-- Add index for faster moderation queries
CREATE INDEX idx_creator_posts_moderation_status ON public.creator_posts(moderation_status);

-- Create function to check if creator is verified
CREATE OR REPLACE FUNCTION public.is_creator_verified(creator_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT id_verified FROM public.creator_profiles WHERE user_id = creator_user_id),
    false
  )
$$;

-- Update RLS policy for creator posts to only show approved posts to non-creators
DROP POLICY IF EXISTS "Anyone can view creator posts" ON public.creator_posts;

CREATE POLICY "Anyone can view approved creator posts"
ON public.creator_posts
FOR SELECT
USING (
  moderation_status = 'approved' 
  OR auth.uid() = creator_id 
  OR has_role(auth.uid(), 'admin'::user_role)
);

-- Add RLS policy for moderators to update posts
CREATE POLICY "Admins can moderate posts"
ON public.creator_posts
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::user_role));

-- Create admin analytics view
CREATE OR REPLACE VIEW public.admin_verification_stats AS
SELECT 
  COUNT(*) FILTER (WHERE status = 'pending') as pending_verifications,
  COUNT(*) FILTER (WHERE status = 'approved') as approved_verifications,
  COUNT(*) FILTER (WHERE status = 'rejected') as rejected_verifications,
  COUNT(*) as total_verifications
FROM public.creator_id_verification;

-- Create admin content moderation view
CREATE OR REPLACE VIEW public.admin_moderation_stats AS
SELECT 
  COUNT(*) FILTER (WHERE moderation_status = 'pending') as pending_posts,
  COUNT(*) FILTER (WHERE moderation_status = 'approved') as approved_posts,
  COUNT(*) FILTER (WHERE moderation_status = 'rejected') as rejected_posts,
  COUNT(*) as total_posts
FROM public.creator_posts;
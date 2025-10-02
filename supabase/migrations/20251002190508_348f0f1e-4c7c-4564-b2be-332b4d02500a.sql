-- Enable RLS on the views
ALTER VIEW public.admin_verification_stats SET (security_barrier = true);
ALTER VIEW public.admin_moderation_stats SET (security_barrier = true);

-- Grant select permissions only to authenticated users
GRANT SELECT ON public.admin_verification_stats TO authenticated;
GRANT SELECT ON public.admin_moderation_stats TO authenticated;

-- Note: Views don't support RLS policies directly, but we can create functions instead
-- Drop the views and create security definer functions
DROP VIEW IF EXISTS public.admin_verification_stats;
DROP VIEW IF EXISTS public.admin_moderation_stats;

-- Create function for verification stats
CREATE OR REPLACE FUNCTION public.get_verification_stats()
RETURNS TABLE (
  pending_verifications bigint,
  approved_verifications bigint,
  rejected_verifications bigint,
  total_verifications bigint
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    COUNT(*) FILTER (WHERE status = 'pending') as pending_verifications,
    COUNT(*) FILTER (WHERE status = 'approved') as approved_verifications,
    COUNT(*) FILTER (WHERE status = 'rejected') as rejected_verifications,
    COUNT(*) as total_verifications
  FROM public.creator_id_verification
  WHERE has_role(auth.uid(), 'admin'::user_role);
$$;

-- Create function for moderation stats
CREATE OR REPLACE FUNCTION public.get_moderation_stats()
RETURNS TABLE (
  pending_posts bigint,
  approved_posts bigint,
  rejected_posts bigint,
  total_posts bigint
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    COUNT(*) FILTER (WHERE moderation_status = 'pending') as pending_posts,
    COUNT(*) FILTER (WHERE moderation_status = 'approved') as approved_posts,
    COUNT(*) FILTER (WHERE moderation_status = 'rejected') as rejected_posts,
    COUNT(*) as total_posts
  FROM public.creator_posts
  WHERE has_role(auth.uid(), 'admin'::user_role);
$$;
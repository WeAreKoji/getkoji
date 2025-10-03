-- Phase 3: Content Security & Moderation Enhancement (Fixed)

-- Drop existing function
DROP FUNCTION IF EXISTS public.get_moderation_stats();

-- 1. CONTENT REPORTS (User-initiated reporting)
CREATE TABLE IF NOT EXISTS public.content_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL,
  content_type text NOT NULL CHECK (content_type IN ('post', 'message', 'profile', 'comment')),
  content_id uuid NOT NULL,
  report_category text NOT NULL CHECK (report_category IN ('harassment', 'spam', 'inappropriate_content', 'false_information', 'violence', 'hate_speech', 'other')),
  description text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'resolved', 'dismissed')),
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  reviewed_by uuid,
  reviewed_at timestamp with time zone,
  resolution_notes text,
  action_taken text,
  ip_address inet,
  user_agent text,
  metadata jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.content_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create reports"
ON public.content_reports
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Users can view own reports"
ON public.content_reports
FOR SELECT
TO authenticated
USING (auth.uid() = reporter_id);

CREATE POLICY "Admins can view all reports"
ON public.content_reports
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::user_role));

CREATE POLICY "Admins can update reports"
ON public.content_reports
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::user_role));

CREATE INDEX IF NOT EXISTS idx_content_reports_status ON public.content_reports(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_content_reports_content ON public.content_reports(content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_content_reports_reporter ON public.content_reports(reporter_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_content_reports_priority ON public.content_reports(priority, status);

-- 2. AUTOMATED CONTENT FLAGS (AI-powered detection)
CREATE TABLE IF NOT EXISTS public.content_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type text NOT NULL CHECK (content_type IN ('post', 'message', 'profile', 'comment', 'media')),
  content_id uuid NOT NULL,
  flag_type text NOT NULL CHECK (flag_type IN ('nsfw', 'violence', 'hate_speech', 'spam', 'phishing', 'copyright', 'suspicious_pattern', 'toxicity')),
  confidence_score numeric NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 1),
  ai_analysis jsonb,
  auto_action text CHECK (auto_action IN ('none', 'shadow_ban', 'require_review', 'auto_remove')),
  status text NOT NULL DEFAULT 'flagged' CHECK (status IN ('flagged', 'confirmed', 'false_positive', 'resolved')),
  reviewed_by uuid,
  reviewed_at timestamp with time zone,
  review_notes text,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.content_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all flags"
ON public.content_flags
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::user_role));

CREATE POLICY "System can create flags"
ON public.content_flags
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Admins can update flags"
ON public.content_flags
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::user_role));

CREATE INDEX IF NOT EXISTS idx_content_flags_content ON public.content_flags(content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_content_flags_status ON public.content_flags(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_content_flags_confidence ON public.content_flags(confidence_score DESC) WHERE status = 'flagged';
CREATE INDEX IF NOT EXISTS idx_content_flags_type ON public.content_flags(flag_type, status);

-- 3. CONTENT MODERATION ACTIONS (Audit trail)
CREATE TABLE IF NOT EXISTS public.moderation_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  moderator_id uuid NOT NULL,
  action_type text NOT NULL CHECK (action_type IN ('approve', 'reject', 'remove', 'warn_user', 'ban_user', 'flag_review', 'restore')),
  content_type text NOT NULL CHECK (content_type IN ('post', 'message', 'profile', 'comment', 'user_account')),
  content_id uuid NOT NULL,
  target_user_id uuid,
  reason text NOT NULL,
  details jsonb,
  related_report_id uuid REFERENCES public.content_reports(id),
  related_flag_id uuid REFERENCES public.content_flags(id),
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.moderation_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view moderation actions"
ON public.moderation_actions
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::user_role));

CREATE POLICY "Admins can create moderation actions"
ON public.moderation_actions
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::user_role) AND auth.uid() = moderator_id);

CREATE INDEX IF NOT EXISTS idx_moderation_actions_moderator ON public.moderation_actions(moderator_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_moderation_actions_content ON public.moderation_actions(content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_moderation_actions_user ON public.moderation_actions(target_user_id, created_at DESC);

-- 4. USER WARNINGS (Progressive enforcement)
CREATE TABLE IF NOT EXISTS public.user_warnings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  warning_type text NOT NULL CHECK (warning_type IN ('content_violation', 'harassment', 'spam', 'inappropriate_behavior', 'terms_violation')),
  severity text NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  description text NOT NULL,
  issued_by uuid NOT NULL,
  acknowledged boolean DEFAULT false,
  acknowledged_at timestamp with time zone,
  expires_at timestamp with time zone,
  related_content_id uuid,
  related_report_id uuid REFERENCES public.content_reports(id),
  metadata jsonb,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.user_warnings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own warnings"
ON public.user_warnings
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can acknowledge own warnings"
ON public.user_warnings
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage warnings"
ON public.user_warnings
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::user_role));

CREATE INDEX IF NOT EXISTS idx_user_warnings_user ON public.user_warnings(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_warnings_active ON public.user_warnings(user_id, expires_at) WHERE acknowledged = false;

-- HELPER FUNCTIONS

-- Function to create content report
CREATE OR REPLACE FUNCTION public.create_content_report(
  _content_type text,
  _content_id uuid,
  _report_category text,
  _description text DEFAULT NULL,
  _ip_address inet DEFAULT NULL,
  _user_agent text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  report_id uuid;
  report_count integer;
BEGIN
  -- Check if user has reported this content already
  IF EXISTS (
    SELECT 1 FROM public.content_reports
    WHERE reporter_id = auth.uid()
      AND content_id = _content_id
      AND created_at > now() - interval '24 hours'
  ) THEN
    RAISE EXCEPTION 'You have already reported this content recently';
  END IF;

  -- Count recent reports from this user
  SELECT COUNT(*) INTO report_count
  FROM public.content_reports
  WHERE reporter_id = auth.uid()
    AND created_at > now() - interval '1 hour';

  IF report_count >= 10 THEN
    RAISE EXCEPTION 'Rate limit exceeded for reports';
  END IF;

  INSERT INTO public.content_reports (
    reporter_id,
    content_type,
    content_id,
    report_category,
    description,
    ip_address,
    user_agent
  ) VALUES (
    auth.uid(),
    _content_type,
    _content_id,
    _report_category,
    _description,
    _ip_address,
    _user_agent
  ) RETURNING id INTO report_id;

  RETURN report_id;
END;
$$;

-- Function to create automated flag
CREATE OR REPLACE FUNCTION public.create_content_flag(
  _content_type text,
  _content_id uuid,
  _flag_type text,
  _confidence_score numeric,
  _ai_analysis jsonb DEFAULT NULL,
  _auto_action text DEFAULT 'none'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  flag_id uuid;
BEGIN
  INSERT INTO public.content_flags (
    content_type,
    content_id,
    flag_type,
    confidence_score,
    ai_analysis,
    auto_action
  ) VALUES (
    _content_type,
    _content_id,
    _flag_type,
    _confidence_score,
    _ai_analysis,
    _auto_action
  ) RETURNING id INTO flag_id;

  -- Auto-action based on confidence and type
  IF _confidence_score >= 0.9 AND _auto_action = 'auto_remove' THEN
    -- Trigger content removal
    PERFORM log_admin_action(
      'auto_content_removal',
      _content_type,
      _content_id,
      jsonb_build_object('flag_id', flag_id, 'confidence', _confidence_score)
    );
  END IF;

  RETURN flag_id;
END;
$$;

-- Recreate moderation stats with new columns
CREATE OR REPLACE FUNCTION public.get_moderation_stats()
RETURNS TABLE(
  pending_reports bigint,
  pending_flags bigint,
  pending_verifications bigint,
  pending_posts bigint,
  approved_posts bigint,
  rejected_posts bigint,
  total_posts bigint
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT has_role(auth.uid(), 'admin'::user_role) THEN
    RAISE EXCEPTION 'Only admins can view moderation stats';
  END IF;

  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM public.content_reports WHERE status = 'pending')::bigint as pending_reports,
    (SELECT COUNT(*) FROM public.content_flags WHERE status = 'flagged')::bigint as pending_flags,
    (SELECT COUNT(*) FROM public.creator_id_verification WHERE status = 'pending')::bigint as pending_verifications,
    (SELECT COUNT(*) FROM public.creator_posts WHERE moderation_status = 'pending')::bigint as pending_posts,
    (SELECT COUNT(*) FROM public.creator_posts WHERE moderation_status = 'approved')::bigint as approved_posts,
    (SELECT COUNT(*) FROM public.creator_posts WHERE moderation_status = 'rejected')::bigint as rejected_posts,
    (SELECT COUNT(*) FROM public.creator_posts)::bigint as total_posts;
END;
$$;

-- Trigger to update content_reports updated_at
CREATE OR REPLACE FUNCTION public.update_content_reports_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_content_reports_updated_at
BEFORE UPDATE ON public.content_reports
FOR EACH ROW
EXECUTE FUNCTION public.update_content_reports_timestamp();
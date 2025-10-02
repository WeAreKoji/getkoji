-- Phase 1 & 2: Security, Notifications, and Features Setup

-- Create notifications table
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('new_subscriber', 'failed_transfer', 'verification_update', 'subscription_renewal', 'post_moderation', 'new_verification', 'new_post_pending')),
  title text NOT NULL,
  message text NOT NULL,
  data jsonb,
  read boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

-- Create notification preferences table
CREATE TABLE public.notification_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  email_new_subscriber boolean DEFAULT true,
  email_failed_transfer boolean DEFAULT true,
  email_verification_update boolean DEFAULT true,
  email_subscription_renewal boolean DEFAULT true,
  email_post_moderation boolean DEFAULT true,
  in_app_enabled boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Add post scheduling and status columns
ALTER TABLE public.creator_posts
ADD COLUMN IF NOT EXISTS status text DEFAULT 'published' CHECK (status IN ('draft', 'scheduled', 'published', 'archived')),
ADD COLUMN IF NOT EXISTS scheduled_publish_at timestamp with time zone;

-- Create moderation notes table
CREATE TABLE public.moderation_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES public.creator_posts(id) ON DELETE CASCADE,
  verification_id uuid REFERENCES public.creator_id_verification(id) ON DELETE CASCADE,
  moderator_id uuid NOT NULL REFERENCES auth.users(id),
  note text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CHECK ((post_id IS NOT NULL AND verification_id IS NULL) OR (post_id IS NULL AND verification_id IS NOT NULL))
);

-- Create subscriber analytics table
CREATE TABLE public.subscriber_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscriber_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id uuid REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  total_paid numeric DEFAULT 0,
  subscription_started_at timestamp with time zone DEFAULT now(),
  last_payment_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now()
);

-- Create dispute management tables
CREATE TABLE public.disputes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id uuid REFERENCES public.subscriptions(id),
  creator_id uuid NOT NULL REFERENCES auth.users(id),
  subscriber_id uuid NOT NULL REFERENCES auth.users(id),
  stripe_dispute_id text,
  reason text NOT NULL,
  status text DEFAULT 'open' CHECK (status IN ('open', 'under_review', 'resolved', 'lost', 'won')),
  amount numeric NOT NULL,
  evidence jsonb,
  resolution_notes text,
  created_at timestamp with time zone DEFAULT now(),
  resolved_at timestamp with time zone
);

-- Phase 4: Add performance indexes
CREATE INDEX IF NOT EXISTS idx_creator_posts_moderation_status ON public.creator_posts(moderation_status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_creator_posts_creator_id ON public.creator_posts(creator_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_creator_posts_status ON public.creator_posts(status, scheduled_publish_at);
CREATE INDEX IF NOT EXISTS idx_verification_status ON public.creator_id_verification(status, submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_subscriptions_creator_status ON public.subscriptions(creator_id, status);
CREATE INDEX IF NOT EXISTS idx_failed_transfers_resolved ON public.failed_transfers(creator_id, resolved_at) WHERE resolved_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON public.notifications(user_id, read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_subscriber_analytics_creator ON public.subscriber_analytics(creator_id, subscription_started_at DESC);

-- Enable RLS on new tables
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moderation_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriber_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for notifications
CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications" ON public.notifications
  FOR INSERT WITH CHECK (true);

-- RLS Policies for notification preferences
CREATE POLICY "Users can view own preferences" ON public.notification_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own preferences" ON public.notification_preferences
  FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for moderation notes
CREATE POLICY "Admins can view moderation notes" ON public.moderation_notes
  FOR SELECT USING (has_role(auth.uid(), 'admin'::user_role));

CREATE POLICY "Admins can create moderation notes" ON public.moderation_notes
  FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::user_role));

-- RLS Policies for subscriber analytics
CREATE POLICY "Creators can view own subscriber analytics" ON public.subscriber_analytics
  FOR SELECT USING (auth.uid() = creator_id);

CREATE POLICY "System can manage subscriber analytics" ON public.subscriber_analytics
  FOR ALL USING (true);

-- RLS Policies for disputes
CREATE POLICY "Users can view own disputes" ON public.disputes
  FOR SELECT USING (auth.uid() = creator_id OR auth.uid() = subscriber_id OR has_role(auth.uid(), 'admin'::user_role));

CREATE POLICY "Admins can manage disputes" ON public.disputes
  FOR ALL USING (has_role(auth.uid(), 'admin'::user_role));

-- Create function to auto-publish scheduled posts
CREATE OR REPLACE FUNCTION public.publish_scheduled_posts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.creator_posts
  SET status = 'published',
      moderation_status = 'pending'
  WHERE status = 'scheduled'
    AND scheduled_publish_at <= now();
END;
$$;

-- Create function to send notification
CREATE OR REPLACE FUNCTION public.create_notification(
  _user_id uuid,
  _type text,
  _title text,
  _message text,
  _data jsonb DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  notification_id uuid;
BEGIN
  INSERT INTO public.notifications (user_id, type, title, message, data)
  VALUES (_user_id, _type, _title, _message, _data)
  RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$;

-- Trigger to create notification preferences on user creation
CREATE OR REPLACE FUNCTION public.handle_new_user_notifications()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.notification_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_notifications
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_notifications();
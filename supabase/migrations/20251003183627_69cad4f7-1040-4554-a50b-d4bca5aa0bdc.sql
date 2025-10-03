-- Create achievements table
CREATE TABLE public.achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  icon text NOT NULL,
  category text NOT NULL,
  points integer NOT NULL DEFAULT 0,
  requirement_type text NOT NULL,
  requirement_value integer NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);

-- Create user_achievements table
CREATE TABLE public.user_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id uuid NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  earned_at timestamp with time zone DEFAULT now(),
  progress integer DEFAULT 0,
  UNIQUE(user_id, achievement_id)
);

-- Create user_points table for gamification
CREATE TABLE public.user_points (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  total_points integer DEFAULT 0,
  level integer DEFAULT 1,
  streak_days integer DEFAULT 0,
  last_activity_date date DEFAULT CURRENT_DATE,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create activity_logs table
CREATE TABLE public.activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type text NOT NULL,
  points_earned integer DEFAULT 0,
  metadata jsonb,
  created_at timestamp with time zone DEFAULT now()
);

-- Create rewards table
CREATE TABLE public.rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  points_required integer NOT NULL,
  reward_type text NOT NULL,
  reward_value jsonb,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);

-- Create user_rewards table
CREATE TABLE public.user_rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reward_id uuid NOT NULL REFERENCES public.rewards(id) ON DELETE CASCADE,
  redeemed_at timestamp with time zone DEFAULT now(),
  status text DEFAULT 'pending'
);

-- Create notification_queue table for advanced notifications
CREATE TABLE public.notification_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  data jsonb,
  scheduled_for timestamp with time zone DEFAULT now(),
  sent_at timestamp with time zone,
  status text DEFAULT 'pending',
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_queue ENABLE ROW LEVEL SECURITY;

-- RLS Policies for achievements
CREATE POLICY "Anyone can view active achievements"
  ON public.achievements FOR SELECT
  USING (is_active = true);

-- RLS Policies for user_achievements
CREATE POLICY "Users can view own achievements"
  ON public.user_achievements FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert user achievements"
  ON public.user_achievements FOR INSERT
  WITH CHECK (true);

-- RLS Policies for user_points
CREATE POLICY "Users can view own points"
  ON public.user_points FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view leaderboard"
  ON public.user_points FOR SELECT
  USING (true);

CREATE POLICY "System can manage points"
  ON public.user_points FOR ALL
  USING (true);

-- RLS Policies for activity_logs
CREATE POLICY "Users can view own activity"
  ON public.activity_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert activity logs"
  ON public.activity_logs FOR INSERT
  WITH CHECK (true);

-- RLS Policies for rewards
CREATE POLICY "Anyone can view active rewards"
  ON public.rewards FOR SELECT
  USING (is_active = true);

-- RLS Policies for user_rewards
CREATE POLICY "Users can view own rewards"
  ON public.user_rewards FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can redeem rewards"
  ON public.user_rewards FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for notification_queue
CREATE POLICY "Users can view own queued notifications"
  ON public.notification_queue FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can manage notification queue"
  ON public.notification_queue FOR ALL
  USING (true);

-- Functions for gamification
CREATE OR REPLACE FUNCTION public.award_points(
  _user_id uuid,
  _points integer,
  _activity_type text,
  _metadata jsonb DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert or update user points
  INSERT INTO public.user_points (user_id, total_points)
  VALUES (_user_id, _points)
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    total_points = user_points.total_points + _points,
    level = FLOOR((user_points.total_points + _points) / 1000) + 1,
    updated_at = now();
  
  -- Log the activity
  INSERT INTO public.activity_logs (user_id, activity_type, points_earned, metadata)
  VALUES (_user_id, _activity_type, _points, _metadata);
END;
$$;

CREATE OR REPLACE FUNCTION public.check_achievements(_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  achievement RECORD;
  user_stat integer;
BEGIN
  FOR achievement IN 
    SELECT * FROM public.achievements WHERE is_active = true
  LOOP
    -- Check different achievement types
    CASE achievement.requirement_type
      WHEN 'total_points' THEN
        SELECT total_points INTO user_stat 
        FROM public.user_points 
        WHERE user_id = _user_id;
        
      WHEN 'matches_count' THEN
        SELECT COUNT(*) INTO user_stat 
        FROM public.matches 
        WHERE user1_id = _user_id OR user2_id = _user_id;
        
      WHEN 'profile_views' THEN
        SELECT COUNT(*) INTO user_stat 
        FROM public.profile_views 
        WHERE profile_id = _user_id;
        
      ELSE
        user_stat := 0;
    END CASE;
    
    -- Award achievement if requirement met
    IF user_stat >= achievement.requirement_value THEN
      INSERT INTO public.user_achievements (user_id, achievement_id, progress)
      VALUES (_user_id, achievement.id, achievement.requirement_value)
      ON CONFLICT (user_id, achievement_id) DO NOTHING;
    END IF;
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_streak(_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  last_date date;
  current_streak integer;
BEGIN
  SELECT last_activity_date, streak_days INTO last_date, current_streak
  FROM public.user_points
  WHERE user_id = _user_id;
  
  IF last_date = CURRENT_DATE - INTERVAL '1 day' THEN
    -- Continue streak
    UPDATE public.user_points
    SET streak_days = streak_days + 1,
        last_activity_date = CURRENT_DATE
    WHERE user_id = _user_id;
  ELSIF last_date < CURRENT_DATE - INTERVAL '1 day' THEN
    -- Reset streak
    UPDATE public.user_points
    SET streak_days = 1,
        last_activity_date = CURRENT_DATE
    WHERE user_id = _user_id;
  END IF;
END;
$$;

-- Insert default achievements
INSERT INTO public.achievements (name, description, icon, category, points, requirement_type, requirement_value) VALUES
('First Match', 'Get your first match', '🎉', 'social', 50, 'matches_count', 1),
('Popular Profile', 'Get 100 profile views', '👀', 'social', 100, 'profile_views', 100),
('Power User', 'Earn 1000 points', '⭐', 'engagement', 200, 'total_points', 1000),
('Match Master', 'Get 10 matches', '💫', 'social', 150, 'matches_count', 10),
('Profile Pro', 'Get 500 profile views', '🔥', 'social', 250, 'profile_views', 500);

-- Insert default rewards
INSERT INTO public.rewards (name, description, points_required, reward_type, reward_value) VALUES
('Profile Boost', 'Boost your profile visibility for 24 hours', 500, 'boost', '{"duration_hours": 24}'::jsonb),
('Premium Badge', 'Get a premium badge on your profile for 7 days', 1000, 'badge', '{"duration_days": 7}'::jsonb),
('Super Like', 'Send 5 super likes', 300, 'feature', '{"super_likes": 5}'::jsonb);
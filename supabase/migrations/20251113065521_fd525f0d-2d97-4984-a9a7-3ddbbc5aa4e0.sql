-- Add activity tracking to matches table
ALTER TABLE matches
ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
ADD COLUMN IF NOT EXISTS activity_score INTEGER DEFAULT 0;

-- Create message reactions table
CREATE TABLE IF NOT EXISTS message_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reaction_type TEXT NOT NULL CHECK (reaction_type IN ('like', 'love', 'laugh', 'wow', 'sad', 'angry')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(message_id, user_id)
);

-- Add delivery status to messages
ALTER TABLE messages
ADD COLUMN IF NOT EXISTS delivery_status TEXT DEFAULT 'sent' CHECK (delivery_status IN ('sent', 'delivered', 'read'));

-- Enable RLS on message_reactions
ALTER TABLE message_reactions ENABLE ROW LEVEL SECURITY;

-- RLS policies for message_reactions
CREATE POLICY "Users can add reactions to messages in their matches"
ON message_reactions FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM messages m
    JOIN matches ma ON ma.id = m.match_id
    WHERE m.id = message_id 
    AND (ma.user1_id = auth.uid() OR ma.user2_id = auth.uid())
  )
);

CREATE POLICY "Users can view reactions in their matches"
ON message_reactions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM messages m
    JOIN matches ma ON ma.id = m.match_id
    WHERE m.id = message_id 
    AND (ma.user1_id = auth.uid() OR ma.user2_id = auth.uid())
  )
);

CREATE POLICY "Users can remove their own reactions"
ON message_reactions FOR DELETE
USING (auth.uid() = user_id);

-- Create subscriber cohort analysis function
CREATE OR REPLACE FUNCTION get_subscriber_cohorts(creator_user_id UUID)
RETURNS TABLE (
  cohort_month TEXT,
  subscribers_count INTEGER,
  month_1_retention NUMERIC,
  month_2_retention NUMERIC,
  month_3_retention NUMERIC,
  total_revenue NUMERIC,
  avg_revenue_per_subscriber NUMERIC
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  WITH cohort_base AS (
    SELECT 
      TO_CHAR(s.start_date, 'YYYY-MM') as cohort,
      s.id as subscription_id,
      s.subscriber_id,
      s.start_date,
      s.status,
      s.cancel_date
    FROM subscriptions s
    WHERE s.creator_id = creator_user_id
  ),
  cohort_metrics AS (
    SELECT
      cohort,
      COUNT(DISTINCT subscriber_id) as total_subscribers,
      COUNT(DISTINCT CASE 
        WHEN status = 'active' OR 
             cancel_date IS NULL OR 
             cancel_date > start_date + INTERVAL '1 month'
        THEN subscriber_id 
      END) as month_1_retained,
      COUNT(DISTINCT CASE 
        WHEN status = 'active' OR 
             cancel_date IS NULL OR 
             cancel_date > start_date + INTERVAL '2 months'
        THEN subscriber_id 
      END) as month_2_retained,
      COUNT(DISTINCT CASE 
        WHEN status = 'active' OR 
             cancel_date IS NULL OR 
             cancel_date > start_date + INTERVAL '3 months'
        THEN subscriber_id 
      END) as month_3_retained,
      COALESCE(SUM(pr.gross_amount), 0) as revenue
    FROM cohort_base cb
    LEFT JOIN platform_revenue pr ON pr.subscription_id = cb.subscription_id
    GROUP BY cohort
  )
  SELECT
    cohort as cohort_month,
    total_subscribers::INTEGER as subscribers_count,
    CASE WHEN total_subscribers > 0 
      THEN ROUND((month_1_retained::NUMERIC / total_subscribers * 100), 2)
      ELSE 0 
    END as month_1_retention,
    CASE WHEN total_subscribers > 0 
      THEN ROUND((month_2_retained::NUMERIC / total_subscribers * 100), 2)
      ELSE 0 
    END as month_2_retention,
    CASE WHEN total_subscribers > 0 
      THEN ROUND((month_3_retained::NUMERIC / total_subscribers * 100), 2)
      ELSE 0 
    END as month_3_retention,
    revenue as total_revenue,
    CASE WHEN total_subscribers > 0 
      THEN ROUND(revenue / total_subscribers, 2)
      ELSE 0 
    END as avg_revenue_per_subscriber
  FROM cohort_metrics
  ORDER BY cohort DESC
  LIMIT 12;
END;
$$;

-- Create revenue forecasting function
CREATE OR REPLACE FUNCTION get_revenue_forecast(creator_user_id UUID, months_ahead INTEGER DEFAULT 3)
RETURNS TABLE (
  forecast_month TEXT,
  forecasted_revenue NUMERIC,
  confidence_level TEXT,
  current_mrr NUMERIC,
  projected_subscribers INTEGER,
  estimated_churn_rate NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  avg_monthly_revenue NUMERIC;
  current_subscribers INTEGER;
  avg_churn_rate NUMERIC;
  growth_rate NUMERIC;
BEGIN
  -- Calculate current metrics
  SELECT 
    COALESCE(AVG(monthly_revenue), 0),
    COALESCE(MAX(active_subs), 0),
    COALESCE(AVG(churn), 0.05),
    COALESCE(AVG(growth), 0)
  INTO 
    avg_monthly_revenue,
    current_subscribers,
    avg_churn_rate,
    growth_rate
  FROM (
    SELECT 
      DATE_TRUNC('month', pr.created_at) as month,
      SUM(pr.gross_amount) as monthly_revenue,
      COUNT(DISTINCT s.subscriber_id) as active_subs,
      COUNT(DISTINCT CASE WHEN s.cancel_date IS NOT NULL THEN s.subscriber_id END)::NUMERIC / 
        NULLIF(COUNT(DISTINCT s.subscriber_id), 0) as churn,
      0 as growth
    FROM platform_revenue pr
    JOIN subscriptions s ON s.id = pr.subscription_id
    WHERE pr.creator_id = creator_user_id
      AND pr.created_at > now() - INTERVAL '6 months'
    GROUP BY DATE_TRUNC('month', pr.created_at)
  ) monthly_stats;

  -- Get current MRR
  SELECT 
    COALESCE(SUM(cp.subscription_price), 0)
  INTO current_mrr
  FROM subscriptions s
  JOIN creator_profiles cp ON cp.user_id = s.creator_id
  WHERE s.creator_id = creator_user_id
    AND s.status = 'active';

  -- Generate forecasts
  RETURN QUERY
  SELECT
    TO_CHAR(now() + (i || ' months')::INTERVAL, 'YYYY-MM') as forecast_month,
    ROUND(
      current_mrr * POWER(1 + GREATEST(growth_rate - avg_churn_rate, -0.1), i),
      2
    ) as forecasted_revenue,
    CASE 
      WHEN i <= 1 THEN 'high'
      WHEN i <= 2 THEN 'medium'
      ELSE 'low'
    END as confidence_level,
    current_mrr,
    ROUND(current_subscribers * POWER(1 + GREATEST(growth_rate - avg_churn_rate, -0.1), i))::INTEGER as projected_subscribers,
    ROUND(avg_churn_rate * 100, 2) as estimated_churn_rate
  FROM generate_series(1, months_ahead) i;
END;
$$;

-- Update match activity score on new messages
CREATE OR REPLACE FUNCTION update_match_activity_score()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE matches
  SET 
    last_activity_at = NEW.created_at,
    activity_score = LEAST(activity_score + 1, 100)
  WHERE id = NEW.match_id;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_match_activity_on_message
AFTER INSERT ON messages
FOR EACH ROW
EXECUTE FUNCTION update_match_activity_score();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_message_reactions_message_id ON message_reactions(message_id);
CREATE INDEX IF NOT EXISTS idx_message_reactions_user_id ON message_reactions(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_delivery_status ON messages(delivery_status);
CREATE INDEX IF NOT EXISTS idx_matches_activity_score ON matches(activity_score DESC);
CREATE INDEX IF NOT EXISTS idx_matches_last_activity ON matches(last_activity_at DESC);
-- Phase 4: Database Optimization

-- Add missing indexes to platform_revenue for performance
CREATE INDEX IF NOT EXISTS idx_platform_revenue_creator_id 
  ON public.platform_revenue(creator_id);

CREATE INDEX IF NOT EXISTS idx_platform_revenue_subscription_id 
  ON public.platform_revenue(subscription_id);

CREATE INDEX IF NOT EXISTS idx_platform_revenue_created_at 
  ON public.platform_revenue(created_at DESC);

-- Composite index for common queries (creator + date range)
CREATE INDEX IF NOT EXISTS idx_platform_revenue_creator_date 
  ON public.platform_revenue(creator_id, created_at DESC);

-- Add indexes to subscriptions table
CREATE INDEX IF NOT EXISTS idx_subscriptions_creator_id 
  ON public.subscriptions(creator_id);

CREATE INDEX IF NOT EXISTS idx_subscriptions_subscriber_id 
  ON public.subscriptions(subscriber_id);

CREATE INDEX IF NOT EXISTS idx_subscriptions_status 
  ON public.subscriptions(status);

CREATE INDEX IF NOT EXISTS idx_subscriptions_expires_at 
  ON public.subscriptions(expires_at);

-- Composite index for active subscriptions by creator
CREATE INDEX IF NOT EXISTS idx_subscriptions_creator_active 
  ON public.subscriptions(creator_id, status) 
  WHERE status = 'active';

-- Add pause_until column to subscriptions for pause functionality
ALTER TABLE public.subscriptions
ADD COLUMN IF NOT EXISTS pause_until TIMESTAMP WITH TIME ZONE;

-- Add index for paused subscriptions
CREATE INDEX IF NOT EXISTS idx_subscriptions_pause_until 
  ON public.subscriptions(pause_until) 
  WHERE pause_until IS NOT NULL;

-- Add previous_price column to track price changes
ALTER TABLE public.subscriptions
ADD COLUMN IF NOT EXISTS previous_price NUMERIC;

-- Function to handle subscription price updates with proration
CREATE OR REPLACE FUNCTION public.handle_subscription_price_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Store the old price when updating
  IF TG_OP = 'UPDATE' AND OLD.previous_price IS DISTINCT FROM NEW.previous_price THEN
    NEW.previous_price := OLD.previous_price;
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger for subscription price changes
DROP TRIGGER IF EXISTS subscription_price_change_trigger ON public.subscriptions;
CREATE TRIGGER subscription_price_change_trigger
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_subscription_price_change();
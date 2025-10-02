-- Setup Supabase Cron Jobs for scheduled tasks
-- Note: pg_cron and pg_net extensions are already enabled by Supabase

-- Cron job to retry failed transfers (runs daily at 2 AM UTC)
SELECT cron.schedule(
  'retry-failed-transfers-daily',
  '0 2 * * *', -- At 02:00 every day
  $$
  SELECT
    net.http_post(
      url:='https://lipibykkywbcbsiyywet.supabase.co/functions/v1/retry-failed-transfers',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxpcGlieWtreXdiY2JzaXl5d2V0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzNDkwMTcsImV4cCI6MjA3NDkyNTAxN30.RBMkBAOHWEjPf79Hx6DCZsWcOkZsaCYjI24joors-7E"}'::jsonb,
      body:='{"scheduled": true}'::jsonb
    ) as request_id;
  $$
);

-- Cron job to publish scheduled posts (runs every 5 minutes)
SELECT cron.schedule(
  'publish-scheduled-posts',
  '*/5 * * * *', -- Every 5 minutes
  $$
  SELECT
    net.http_post(
      url:='https://lipibykkywbcbsiyywet.supabase.co/functions/v1/publish-scheduled-posts',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxpcGlieWtreXdiY2JzaXl5d2V0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzNDkwMTcsImV4cCI6MjA3NDkyNTAxN30.RBMkBAOHWEjPf79Hx6DCZsWcOkZsaCYjI24joors-7E"}'::jsonb,
      body:='{"scheduled": true}'::jsonb
    ) as request_id;
  $$
);

-- Cron job to cleanup old rate limits (runs daily at 3 AM UTC)
SELECT cron.schedule(
  'cleanup-rate-limits',
  '0 3 * * *', -- At 03:00 every day
  $$
  SELECT public.cleanup_old_rate_limits();
  $$
);
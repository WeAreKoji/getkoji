-- Enable pg_cron and pg_net extensions for scheduled edge function calls
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Grant permissions to run cron jobs
GRANT USAGE ON SCHEMA cron TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA cron TO postgres;

-- Schedule the retry-failed-transfers function to run every hour
SELECT cron.schedule(
  'retry-failed-transfers-hourly',
  '0 * * * *', -- Run at the start of every hour
  $$
  SELECT
    net.http_post(
        url:='https://lipibykkywbcbsiyywet.supabase.co/functions/v1/retry-failed-transfers',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxpcGlieWtreXdiY2JzaXl5d2V0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzNDkwMTcsImV4cCI6MjA3NDkyNTAxN30.RBMkBAOHWEjPf79Hx6DCZsWcOkZsaCYjI24joors-7E"}'::jsonb,
        body:='{}'::jsonb
    ) as request_id;
  $$
);
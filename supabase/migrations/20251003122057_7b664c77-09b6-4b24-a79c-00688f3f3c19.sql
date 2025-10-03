-- Force PostgREST to reload its schema cache
-- This fixes the issue where PostgREST still references the dropped public_creator_profiles view

-- Method 1: Direct NOTIFY command to PostgREST
NOTIFY pgrst, 'reload schema';

-- Method 2: Add a comment to trigger cache invalidation (backup method)
COMMENT ON TABLE public.creator_profiles IS 'Creator profile information - schema cache reloaded';

-- Method 3: Refresh all materialized views (if any exist)
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN 
    SELECT schemaname, matviewname 
    FROM pg_matviews 
    WHERE schemaname = 'public'
  LOOP
    EXECUTE 'REFRESH MATERIALIZED VIEW ' || quote_ident(r.schemaname) || '.' || quote_ident(r.matviewname);
  END LOOP;
END $$;
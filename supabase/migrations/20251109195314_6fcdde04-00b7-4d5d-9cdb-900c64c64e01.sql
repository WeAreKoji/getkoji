-- Fix RLS policy for discovery_preferences to allow INSERT operations
DROP POLICY IF EXISTS "Users can manage own discovery preferences" ON public.discovery_preferences;

-- Create separate policies for better clarity and proper INSERT support
CREATE POLICY "Users can view own discovery preferences"
ON public.discovery_preferences
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own discovery preferences"
ON public.discovery_preferences
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own discovery preferences"
ON public.discovery_preferences
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own discovery preferences"
ON public.discovery_preferences
FOR DELETE
USING (auth.uid() = user_id);

COMMENT ON TABLE public.discovery_preferences IS 'Stores user discovery preferences with proper RLS policies for CRUD operations';
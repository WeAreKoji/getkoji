-- Create table to track failed transfer attempts
CREATE TABLE IF NOT EXISTS public.failed_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL,
  invoice_id TEXT NOT NULL,
  subscription_id UUID,
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL,
  error_message TEXT NOT NULL,
  retry_count INTEGER DEFAULT 0,
  last_retry_at TIMESTAMP WITH TIME ZONE,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_failed_transfers_creator_id ON public.failed_transfers(creator_id);
CREATE INDEX IF NOT EXISTS idx_failed_transfers_resolved ON public.failed_transfers(resolved_at) WHERE resolved_at IS NULL;

-- RLS policies
ALTER TABLE public.failed_transfers ENABLE ROW LEVEL SECURITY;

-- Creators can view their own failed transfers
CREATE POLICY "Creators can view own failed transfers"
  ON public.failed_transfers
  FOR SELECT
  USING (auth.uid() = creator_id);

-- Service role can manage all failed transfers
CREATE POLICY "Service role can manage failed transfers"
  ON public.failed_transfers
  FOR ALL
  USING (auth.role() = 'service_role');
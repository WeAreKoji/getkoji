-- Create platform_revenue table to track company earnings
CREATE TABLE IF NOT EXISTS public.platform_revenue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID REFERENCES public.subscriptions(id),
  invoice_id TEXT NOT NULL,
  creator_id UUID NOT NULL,
  gross_amount NUMERIC NOT NULL,
  stripe_fee NUMERIC NOT NULL,
  platform_commission NUMERIC NOT NULL,
  creator_earnings NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.platform_revenue ENABLE ROW LEVEL SECURITY;

-- Only admins can view platform revenue (no user access)
CREATE POLICY "No public access to platform revenue"
  ON public.platform_revenue
  FOR ALL
  USING (false);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_platform_revenue_creator_id 
  ON public.platform_revenue(creator_id);

CREATE INDEX IF NOT EXISTS idx_platform_revenue_invoice_id 
  ON public.platform_revenue(invoice_id);
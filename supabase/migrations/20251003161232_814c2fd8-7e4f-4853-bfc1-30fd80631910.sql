-- Add last_active column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS last_active TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Create function to update last_active
CREATE OR REPLACE FUNCTION public.update_last_active()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET last_active = now()
  WHERE id = auth.uid();
END;
$$;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_profiles_last_active ON public.profiles(last_active);

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.update_last_active() TO authenticated;
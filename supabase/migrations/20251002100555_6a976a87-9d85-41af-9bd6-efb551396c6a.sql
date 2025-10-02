-- Add helper functions for managing creator subscriber counts and earnings

CREATE OR REPLACE FUNCTION public.increment_subscriber_count(creator_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.creator_profiles
  SET subscriber_count = subscriber_count + 1
  WHERE user_id = creator_user_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.decrement_subscriber_count(creator_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.creator_profiles
  SET subscriber_count = GREATEST(0, subscriber_count - 1)
  WHERE user_id = creator_user_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.add_creator_earnings(creator_user_id uuid, amount numeric)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.creator_profiles
  SET total_earnings = total_earnings + amount
  WHERE user_id = creator_user_id;
END;
$$;
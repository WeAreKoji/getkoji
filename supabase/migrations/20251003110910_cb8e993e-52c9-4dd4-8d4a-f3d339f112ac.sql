-- Update default values for discovery_preferences table
ALTER TABLE public.discovery_preferences 
ALTER COLUMN interested_in_gender SET DEFAULT ARRAY['male', 'female'];

-- Clean up existing user preferences to remove non_binary and other
UPDATE public.discovery_preferences
SET interested_in_gender = (
  SELECT ARRAY_AGG(gender)
  FROM unnest(interested_in_gender) AS gender
  WHERE gender IN ('male', 'female')
)
WHERE 'non_binary' = ANY(interested_in_gender) OR 'other' = ANY(interested_in_gender);

-- Ensure no empty arrays after cleanup
UPDATE public.discovery_preferences
SET interested_in_gender = ARRAY['male', 'female']
WHERE interested_in_gender = ARRAY[]::text[] OR interested_in_gender IS NULL OR cardinality(interested_in_gender) = 0;
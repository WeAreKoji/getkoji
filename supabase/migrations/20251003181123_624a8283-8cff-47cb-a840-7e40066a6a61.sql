-- Phase 2 (P1) Database Enhancements

-- Add distance unit preference to discovery_preferences
ALTER TABLE discovery_preferences 
ADD COLUMN IF NOT EXISTS distance_unit text DEFAULT 'km' CHECK (distance_unit IN ('km', 'miles'));

-- Add interests filter to discovery_preferences
ALTER TABLE discovery_preferences 
ADD COLUMN IF NOT EXISTS interested_in_interests uuid[];

-- Create index for interests array queries
CREATE INDEX IF NOT EXISTS idx_discovery_preferences_interests 
ON discovery_preferences USING GIN(interested_in_interests);

COMMENT ON COLUMN discovery_preferences.distance_unit IS 'Preferred distance unit: km or miles';
COMMENT ON COLUMN discovery_preferences.interested_in_interests IS 'Array of interest IDs to filter by';
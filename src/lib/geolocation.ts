import { supabase } from "@/integrations/supabase/client";

export interface LocationInfo {
  country: string;
  countryCode: string;
  region: string;
  regionName: string;
  city: string;
  timezone: string;
  lat: number;
  lon: number;
}

export const getLocationFromIP = async (ip?: string): Promise<LocationInfo | null> => {
  try {
    const { data, error } = await supabase.functions.invoke('get-user-location', {
      body: { ip },
    });

    if (error) throw error;
    return data as LocationInfo;
  } catch (error) {
    console.error('[GEOLOCATION] Error fetching location:', error);
    return null;
  }
};

export const getCountryFlag = (countryCode: string): string => {
  if (!countryCode || countryCode === 'XX') return '🌍';
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
};

export const formatLocation = (locationInfo: LocationInfo | null): string => {
  if (!locationInfo) return 'Unknown';
  
  const parts = [];
  if (locationInfo.city && locationInfo.city !== 'Unknown') {
    parts.push(locationInfo.city);
  }
  if (locationInfo.regionName && locationInfo.regionName !== locationInfo.city) {
    parts.push(locationInfo.regionName);
  }
  if (locationInfo.country && locationInfo.country !== 'Unknown') {
    parts.push(locationInfo.country);
  }
  
  return parts.length > 0 ? parts.join(', ') : 'Unknown';
};

export const getLocationDisplay = (locationInfo: LocationInfo | null, ip?: string): string => {
  const flag = locationInfo ? getCountryFlag(locationInfo.countryCode) : '🌍';
  const location = formatLocation(locationInfo);
  const ipDisplay = ip ? ` (${ip})` : '';
  
  return `${flag} ${location}${ipDisplay}`;
};

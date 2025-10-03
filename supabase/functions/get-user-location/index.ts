import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simple in-memory cache for IP locations (5 min TTL)
const locationCache = new Map<string, { data: any; expires: number }>();

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { ip } = await req.json();
    
    // Auto-detect IP if not provided
    const clientIp = ip || req.headers.get('x-forwarded-for')?.split(',')[0] || 
                          req.headers.get('x-real-ip') || 'unknown';

    console.log('[GET-USER-LOCATION] Looking up IP:', clientIp);

    // Check cache first
    const cached = locationCache.get(clientIp);
    if (cached && cached.expires > Date.now()) {
      console.log('[GET-USER-LOCATION] Cache hit for IP:', clientIp);
      return new Response(JSON.stringify(cached.data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Skip geolocation for local/private IPs
    if (clientIp === 'unknown' || clientIp.startsWith('192.168.') || 
        clientIp.startsWith('10.') || clientIp === '127.0.0.1') {
      const localResponse = {
        country: 'Unknown',
        countryCode: 'XX',
        region: '',
        regionName: '',
        city: 'Local',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        lat: 0,
        lon: 0,
      };
      return new Response(JSON.stringify(localResponse), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Use ip-api.com (free, 45 req/min, no key required)
    const geoResponse = await fetch(`http://ip-api.com/json/${clientIp}?fields=status,message,country,countryCode,region,regionName,city,timezone,lat,lon`);
    
    if (!geoResponse.ok) {
      throw new Error('Geolocation API request failed');
    }

    const geoData = await geoResponse.json();

    if (geoData.status === 'fail') {
      console.error('[GET-USER-LOCATION] Geolocation failed:', geoData.message);
      throw new Error(geoData.message || 'Failed to get location');
    }

    const locationData = {
      country: geoData.country,
      countryCode: geoData.countryCode,
      region: geoData.region,
      regionName: geoData.regionName,
      city: geoData.city,
      timezone: geoData.timezone,
      lat: geoData.lat,
      lon: geoData.lon,
    };

    // Cache for 5 minutes
    locationCache.set(clientIp, {
      data: locationData,
      expires: Date.now() + 5 * 60 * 1000,
    });

    console.log('[GET-USER-LOCATION] Location found:', locationData.city, locationData.country);

    return new Response(JSON.stringify(locationData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('[GET-USER-LOCATION] Error:', error.message);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        country: 'Unknown',
        countryCode: 'XX',
        city: 'Unknown',
      }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

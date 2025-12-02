interface RateLimitConfig {
  maxAttempts: number;
  windowMinutes: number;
  identifier: string; // user_id, ip, or combined
}

interface RateLimitRecord {
  id: string;
  identifier: string;
  attempts: number;
  window_start: string;
  created_at: string;
}

export async function checkRateLimit(
  supabase: any,
  config: RateLimitConfig
): Promise<{ allowed: boolean; remaining: number; resetAt: Date }> {
  const now = new Date();
  const windowStart = new Date(now.getTime() - config.windowMinutes * 60 * 1000);

  // Try to get existing rate limit record
  const { data: existing, error: fetchError } = await supabase
    .from("rate_limits")
    .select("*")
    .eq("identifier", config.identifier)
    .gte("window_start", windowStart.toISOString())
    .maybeSingle();

  if (fetchError && fetchError.code !== "PGRST116") {
    console.error("Rate limit check error:", fetchError);
    // Fail open - allow the request if we can't check
    return {
      allowed: true,
      remaining: config.maxAttempts,
      resetAt: new Date(now.getTime() + config.windowMinutes * 60 * 1000),
    };
  }

  const typedExisting = existing as RateLimitRecord | null;

  if (!typedExisting) {
    // Create new rate limit entry using upsert to handle race conditions
    const { data: upsertedData, error: upsertError } = await supabase
      .from("rate_limits")
      .upsert(
        {
          identifier: config.identifier,
          attempts: 1,
          window_start: windowStart.toISOString(),
        },
        { 
          onConflict: 'identifier,window_start',
          ignoreDuplicates: false 
        }
      )
      .select()
      .single();

    if (upsertError) {
      // If upsert fails, try to fetch existing record (another request may have created it)
      const { data: retryData } = await supabase
        .from("rate_limits")
        .select("*")
        .eq("identifier", config.identifier)
        .gte("window_start", windowStart.toISOString())
        .maybeSingle();
      
      if (retryData) {
        // Record exists, check and increment
        if (retryData.attempts >= config.maxAttempts) {
          return {
            allowed: false,
            remaining: 0,
            resetAt: new Date(new Date(retryData.window_start).getTime() + config.windowMinutes * 60 * 1000),
          };
        }
        
        await supabase
          .from("rate_limits")
          .update({ attempts: retryData.attempts + 1 })
          .eq("id", retryData.id);
        
        return {
          allowed: true,
          remaining: config.maxAttempts - (retryData.attempts + 1),
          resetAt: new Date(new Date(retryData.window_start).getTime() + config.windowMinutes * 60 * 1000),
        };
      }
      
      // Fail open if we can't determine rate limit status
      console.error("Rate limit upsert error:", upsertError);
      return {
        allowed: true,
        remaining: config.maxAttempts - 1,
        resetAt: new Date(now.getTime() + config.windowMinutes * 60 * 1000),
      };
    }

    return {
      allowed: true,
      remaining: config.maxAttempts - 1,
      resetAt: new Date(now.getTime() + config.windowMinutes * 60 * 1000),
    };
  }

  // Check if limit exceeded
  if (typedExisting.attempts >= config.maxAttempts) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: new Date(new Date(typedExisting.window_start).getTime() + config.windowMinutes * 60 * 1000),
    };
  }

  // Increment attempts
  const { error: updateError } = await supabase
    .from("rate_limits")
    .update({ attempts: typedExisting.attempts + 1 })
    .eq("id", typedExisting.id);

  if (updateError) {
    console.error("Rate limit update error:", updateError);
  }

  return {
    allowed: true,
    remaining: config.maxAttempts - (typedExisting.attempts + 1),
    resetAt: new Date(new Date(typedExisting.window_start).getTime() + config.windowMinutes * 60 * 1000),
  };
}

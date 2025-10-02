import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface RateLimitConfig {
  maxAttempts: number;
  windowMinutes: number;
  identifier: string; // user_id, ip, or combined
}

export async function checkRateLimit(
  supabase: ReturnType<typeof createClient>,
  config: RateLimitConfig
): Promise<{ allowed: boolean; remaining: number; resetAt: Date }> {
  const now = new Date();
  const windowStart = new Date(now.getTime() - config.windowMinutes * 60 * 1000);

  // Create a rate_limits table entry or check existing
  const tableName = "rate_limits";
  
  // Try to get existing rate limit record
  const { data: existing, error: fetchError } = await supabase
    .from(tableName)
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

  if (!existing) {
    // Create new rate limit entry
    const { error: insertError } = await supabase
      .from(tableName)
      .insert({
        identifier: config.identifier,
        attempts: 1,
        window_start: windowStart.toISOString(),
      });

    if (insertError) {
      console.error("Rate limit insert error:", insertError);
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
  if (existing.attempts >= config.maxAttempts) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: new Date(new Date(existing.window_start).getTime() + config.windowMinutes * 60 * 1000),
    };
  }

  // Increment attempts
  const { error: updateError } = await supabase
    .from(tableName)
    .update({ attempts: existing.attempts + 1 })
    .eq("id", existing.id);

  if (updateError) {
    console.error("Rate limit update error:", updateError);
  }

  return {
    allowed: true,
    remaining: config.maxAttempts - (existing.attempts + 1),
    resetAt: new Date(new Date(existing.window_start).getTime() + config.windowMinutes * 60 * 1000),
  };
}

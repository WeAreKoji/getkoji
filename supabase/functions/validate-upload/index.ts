import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { validateFile } from "../_shared/file-validator.ts";
import { checkRateLimit } from "../_shared/rate-limiter.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Rate limiting: 5 uploads per 15 minutes
    const rateLimit = await checkRateLimit(supabaseClient, {
      maxAttempts: 5,
      windowMinutes: 15,
      identifier: `upload:${user.id}`,
    });

    if (!rateLimit.allowed) {
      return new Response(
        JSON.stringify({ 
          error: "Rate limit exceeded",
          resetAt: rateLimit.resetAt.toISOString(),
        }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const bucket = formData.get("bucket") as string;
    const mimeType = formData.get("mimeType") as string;

    if (!file || !bucket || !mimeType) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: file, bucket, mimeType" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate file
    const validation = await validateFile(file, bucket, mimeType);

    if (!validation.valid) {
      return new Response(
        JSON.stringify({ 
          error: validation.error,
          valid: false,
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ 
        valid: true,
        message: "File validation passed",
        remaining: rateLimit.remaining,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in validate-upload:", error);
    return new Response(
      JSON.stringify({ error: error?.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

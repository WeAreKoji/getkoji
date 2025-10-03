import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as OTPAuth from "https://esm.sh/otpauth@9.1.4";

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
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
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

    // Check if 2FA is already enabled
    const { data: existing2FA } = await supabaseClient
      .from("user_2fa")
      .select("*")
      .eq("user_id", user.id)
      .eq("enabled", true)
      .maybeSingle();

    if (existing2FA) {
      return new Response(
        JSON.stringify({ error: "2FA is already enabled" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate secret for TOTP
    const secret = new OTPAuth.Secret({ size: 20 });
    const totp = new OTPAuth.TOTP({
      issuer: "Koji",
      label: user.email || "User",
      algorithm: "SHA1",
      digits: 6,
      period: 30,
      secret: secret,
    });

    // Generate backup codes
    const backupCodes = Array.from({ length: 8 }, () =>
      Math.random().toString(36).substring(2, 10).toUpperCase()
    );

    // Store 2FA setup (not enabled yet)
    const { error: insertError } = await supabaseClient
      .from("user_2fa")
      .upsert({
        user_id: user.id,
        secret: secret.base32,
        backup_codes: backupCodes,
        enabled: false,
      });

    if (insertError) {
      console.error("Error storing 2FA setup:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to setup 2FA" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate QR code URL
    const qrCodeUrl = totp.toString();

    return new Response(
      JSON.stringify({
        secret: secret.base32,
        qrCodeUrl: qrCodeUrl,
        backupCodes: backupCodes,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in enable-2fa:", error);
    return new Response(
      JSON.stringify({ error: error?.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

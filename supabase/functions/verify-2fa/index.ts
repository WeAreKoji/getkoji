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

    const { code } = await req.json();

    if (!code || code.length !== 6) {
      return new Response(
        JSON.stringify({ error: "Invalid verification code" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get user's 2FA setup
    const { data: user2FA, error: fetchError } = await supabaseClient
      .from("user_2fa")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (fetchError || !user2FA) {
      return new Response(
        JSON.stringify({ error: "2FA not setup" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if it's a backup code
    if (user2FA.backup_codes.includes(code.toUpperCase())) {
      // Remove used backup code
      const updatedBackupCodes = user2FA.backup_codes.filter(
        (c: string) => c !== code.toUpperCase()
      );

      const { error: updateError } = await supabaseClient
        .from("user_2fa")
        .update({
          backup_codes: updatedBackupCodes,
          enabled: true,
          enabled_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);

      if (updateError) {
        console.error("Error updating backup codes:", updateError);
        return new Response(
          JSON.stringify({ error: "Failed to verify code" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Log security event
      await supabaseClient.rpc("log_security_event", {
        _user_id: user.id,
        _event_type: "2fa_enabled",
        _severity: "medium",
      });

      return new Response(
        JSON.stringify({
          verified: true,
          message: "Backup code verified successfully",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify TOTP code
    const secret = OTPAuth.Secret.fromBase32(user2FA.secret);
    const totp = new OTPAuth.TOTP({
      issuer: "Koji",
      label: user.email || "User",
      algorithm: "SHA1",
      digits: 6,
      period: 30,
      secret: secret,
    });

    const delta = totp.validate({ token: code, window: 1 });

    if (delta === null) {
      return new Response(
        JSON.stringify({
          verified: false,
          error: "Invalid verification code",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Enable 2FA
    const { error: enableError } = await supabaseClient
      .from("user_2fa")
      .update({
        enabled: true,
        enabled_at: new Date().toISOString(),
      })
      .eq("user_id", user.id);

    if (enableError) {
      console.error("Error enabling 2FA:", enableError);
      return new Response(
        JSON.stringify({ error: "Failed to enable 2FA" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Log security event
    await supabaseClient.rpc("log_security_event", {
      _user_id: user.id,
      _event_type: "2fa_enabled",
      _severity: "medium",
    });

    return new Response(
      JSON.stringify({
        verified: true,
        message: "2FA enabled successfully",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in verify-2fa:", error);
    return new Response(
      JSON.stringify({ error: error?.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

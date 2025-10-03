import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[NOTIFY-REFERRED-CREATOR] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    const { creator_referral_id } = await req.json();
    logStep("Processing notification for referral", { creator_referral_id });

    if (!creator_referral_id) {
      throw new Error("creator_referral_id is required");
    }

    // Get the creator referral details
    const { data: referral, error: referralError } = await supabaseClient
      .from("creator_referrals")
      .select("referrer_id, referred_creator_id, status")
      .eq("id", creator_referral_id)
      .single();

    if (referralError || !referral) {
      throw new Error(`Failed to fetch referral: ${referralError?.message}`);
    }

    logStep("Fetched referral data", { 
      referrer_id: referral.referrer_id, 
      referred_creator_id: referral.referred_creator_id,
      status: referral.status
    });

    // Only send notification if status is 'active'
    if (referral.status !== "active") {
      logStep("Referral not active, skipping notification", { status: referral.status });
      return new Response(
        JSON.stringify({ message: "Referral not active, notification not sent" }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // Get referrer profile info
    const { data: referrerProfile, error: profileError } = await supabaseClient
      .from("profiles")
      .select("display_name, username")
      .eq("id", referral.referrer_id)
      .single();

    if (profileError) {
      logStep("Warning: Could not fetch referrer profile", { error: profileError.message });
    }

    const referrerName = referrerProfile?.display_name || referrerProfile?.username || "A Koji member";
    logStep("Referrer name", { referrerName });

    // Create notification for the referred creator
    const { error: notificationError } = await supabaseClient
      .from("notifications")
      .insert({
        user_id: referral.referred_creator_id,
        type: "creator_referral_activated",
        title: "Welcome to Koji Creator Program! 🎉",
        message: `${referrerName} referred you to Koji! They'll earn a commission on your success for the next 9 months.`,
        data: {
          referrer_id: referral.referrer_id,
          referrer_name: referrerName,
          creator_referral_id: creator_referral_id
        }
      });

    if (notificationError) {
      throw new Error(`Failed to create notification: ${notificationError.message}`);
    }

    logStep("Notification created successfully");

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Notification sent to referred creator" 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

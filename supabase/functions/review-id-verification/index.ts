import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

    // Verify the user is an admin
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: adminCheck } = await supabaseClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!adminCheck) {
      return new Response(
        JSON.stringify({ error: "Forbidden - Admin access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { verification_id, approved, rejection_reason } = await req.json();

    if (!verification_id || typeof approved !== "boolean") {
      return new Response(
        JSON.stringify({ error: "Missing required fields: verification_id, approved" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get the verification record
    const { data: verification, error: verificationError } = await supabaseClient
      .from("creator_id_verification")
      .select("creator_id, status")
      .eq("id", verification_id)
      .single();

    if (verificationError || !verification) {
      return new Response(
        JSON.stringify({ error: "Verification not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (verification.status !== "pending") {
      return new Response(
        JSON.stringify({ error: "Verification has already been reviewed" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use service role client for privileged operations
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const now = new Date().toISOString();
    const newStatus = approved ? "approved" : "rejected";

    // Update verification status
    const { error: updateError } = await supabaseAdmin
      .from("creator_id_verification")
      .update({
        status: newStatus,
        reviewed_at: now,
        reviewed_by: user.id,
        rejection_reason: approved ? null : rejection_reason,
      })
      .eq("id", verification_id);

    if (updateError) {
      console.error("Error updating verification:", updateError);
      return new Response(
        JSON.stringify({ error: "Failed to update verification status" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // If approved, update creator profile
    if (approved) {
      const { error: profileError } = await supabaseAdmin
        .from("creator_profiles")
        .update({
          id_verified: true,
          id_verification_date: now,
        })
        .eq("user_id", verification.creator_id);

      if (profileError) {
        console.error("Error updating creator profile:", profileError);
      }
    }

    console.log(`Verification ${verification_id} ${newStatus} by admin ${user.id}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        status: newStatus,
        message: `Verification ${newStatus} successfully` 
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in review-id-verification:", error);
    return new Response(
      JSON.stringify({ error: error?.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

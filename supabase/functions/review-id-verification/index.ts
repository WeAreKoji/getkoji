import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { checkRateLimit } from "../_shared/rate-limiter.ts";
import { sanitizeText } from "../_shared/input-sanitizer.ts";

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

    // Rate limiting for admin actions: 60 reviews per hour
    const rateLimit = await checkRateLimit(supabaseClient, {
      maxAttempts: 60,
      windowMinutes: 60,
      identifier: `review:${user.id}`,
    });

    if (!rateLimit.allowed) {
      return new Response(
        JSON.stringify({ 
          error: "Rate limit exceeded. Please try again later.",
          resetAt: rateLimit.resetAt.toISOString(),
        }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { verification_id, approved, rejection_reason } = await req.json();

    if (!verification_id || typeof approved !== "boolean") {
      return new Response(
        JSON.stringify({ error: "Missing required fields: verification_id, approved" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Sanitize rejection reason if provided
    const sanitizedRejectionReason = rejection_reason ? sanitizeText(rejection_reason) : null;

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
        rejection_reason: approved ? null : sanitizedRejectionReason,
      })
      .eq("id", verification_id);

    if (updateError) {
      console.error("Error updating verification:", updateError);
      return new Response(
        JSON.stringify({ error: "Failed to update verification status" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Log admin action
    await supabaseAdmin.rpc("log_admin_action", {
      _action: approved ? "approve_verification" : "reject_verification",
      _resource_type: "creator_id_verification",
      _resource_id: verification_id,
      _details: {
        creator_id: verification.creator_id,
        rejection_reason: sanitizedRejectionReason
      }
    });

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

    // Create in-app notification
    await supabaseAdmin.rpc("create_notification", {
      _user_id: verification.creator_id,
      _type: "verification_update",
      _title: approved ? "Verification Approved!" : "Verification Update Required",
      _message: approved 
        ? "Your creator verification has been approved. You can now access all creator features."
        : `Your verification needs attention: ${rejection_reason || "Please review and resubmit your documents"}`,
      _data: { verification_id, approved, rejection_reason }
    });

    // Send email notification
    try {
      const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
      
      // Get user profile for email
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("display_name, email")
        .eq("id", verification.creator_id)
        .single();

      if (profile && profile.email) {
        const emailHtml = approved
          ? `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #10b981;">Congratulations, ${profile.display_name}! 🎉</h2>
              <p>Your creator verification has been approved!</p>
              <p>You can now access all creator features and start earning.</p>
            </div>
          `
          : `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #ef4444;">Verification Update Required</h2>
              <p>Hello ${profile.display_name},</p>
              <p>Your verification submission needs attention:</p>
              <p><strong>${rejection_reason || "Please review and resubmit your documents"}</strong></p>
              <p>Please resubmit your verification with the necessary corrections.</p>
            </div>
          `;

        await resend.emails.send({
          from: "Koji <onboarding@getkoji.net>",
          to: [profile.email],
          subject: approved 
            ? "Your Creator Verification is Approved! 🎉"
            : "Action Required: Update Your Verification",
          html: emailHtml,
        });

        console.log(`Email sent to ${profile.email}`);
      }
    } catch (emailError) {
      console.error("Error sending email:", emailError);
      // Don't fail the request if email fails
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

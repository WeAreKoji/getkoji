import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

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
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Fetch pending notifications from queue
    const { data: pendingNotifications, error: fetchError } = await supabaseClient
      .from("notification_queue")
      .select("*")
      .eq("status", "pending")
      .lte("scheduled_for", new Date().toISOString())
      .limit(50);

    if (fetchError) throw fetchError;

    if (!pendingNotifications || pendingNotifications.length === 0) {
      return new Response(
        JSON.stringify({ message: "No pending notifications" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const processed = [];

    for (const notification of pendingNotifications) {
      try {
        // Get user email and preferences
        const { data: profile } = await supabaseClient
          .from("profiles")
          .select("email")
          .eq("id", notification.user_id)
          .single();

        if (!profile?.email) continue;

        const { data: preferences } = await supabaseClient
          .from("notification_preferences")
          .select("*")
          .eq("user_id", notification.user_id)
          .single();

        // Check if user wants email notifications
        const emailEnabled = preferences?.in_app_enabled ?? true;

        if (emailEnabled) {
          // Send email
          await resend.emails.send({
            from: "Notifications <notifications@getkoji.net>",
            to: [profile.email],
            subject: notification.title,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #333;">${notification.title}</h2>
                <p style="color: #666; line-height: 1.6;">${notification.message}</p>
                ${notification.data ? `<div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin-top: 20px;">
                  <p style="color: #999; font-size: 12px; margin: 0;">Additional details available in-app</p>
                </div>` : ''}
              </div>
            `,
          });
        }

        // Create in-app notification
        await supabaseClient.rpc("create_notification", {
          _user_id: notification.user_id,
          _type: notification.notification_type,
          _title: notification.title,
          _message: notification.message,
          _data: notification.data,
        });

        // Mark as sent
        await supabaseClient
          .from("notification_queue")
          .update({ status: "sent", sent_at: new Date().toISOString() })
          .eq("id", notification.id);

        processed.push(notification.id);
      } catch (error) {
        console.error(`Failed to process notification ${notification.id}:`, error);
        // Mark as failed
        await supabaseClient
          .from("notification_queue")
          .update({ status: "failed" })
          .eq("id", notification.id);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        processed: processed.length,
        failed: pendingNotifications.length - processed.length
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in process-notifications function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

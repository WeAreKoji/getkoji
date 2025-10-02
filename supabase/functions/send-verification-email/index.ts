import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, displayName, type } = await req.json();

    if (!email || !displayName || type !== "submitted") {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
    const appUrl = Deno.env.get("SUPABASE_URL")?.replace(".supabase.co", ".lovable.app") || "https://yourapp.lovable.app";

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #333;">Verification Submitted Successfully</h2>
        <p>Hello ${displayName},</p>
        <p>Thank you for submitting your verification documents. We're currently reviewing them and will get back to you soon.</p>
        <p>This process typically takes 1-2 business days.</p>
        <p>You'll receive an email notification once your verification has been reviewed.</p>
        <a href="${appUrl}" style="display: inline-block; margin-top: 20px; padding: 12px 24px; background-color: #10b981; color: white; text-decoration: none; border-radius: 6px;">Visit Dashboard</a>
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="color: #999; font-size: 12px;">If you didn't submit this verification, please contact our support team immediately.</p>
      </div>
    `;

    await resend.emails.send({
      from: "Koji <onboarding@resend.dev>",
      to: [email],
      subject: "Verification Submitted - We're Reviewing Your Documents",
      html: emailHtml,
    });

    console.log(`Verification submitted email sent to ${email}`);

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error sending verification email:", error);
    return new Response(
      JSON.stringify({ error: error?.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

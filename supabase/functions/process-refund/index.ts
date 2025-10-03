import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[PROCESS-REFUND] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw userError;
    
    const user = userData.user;
    if (!user) throw new Error("User not authenticated");

    // Check if user is admin
    const { data: roleData } = await supabaseClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .single();

    if (!roleData) {
      throw new Error("Only admins can process refunds");
    }

    const { refundRequestId, action } = await req.json();
    logStep("Processing refund request", { refundRequestId, action });

    // Get refund request
    const { data: refundRequest, error: refundError } = await supabaseClient
      .from("refund_requests")
      .select("*, subscriptions(stripe_subscription_id, subscriber_id)")
      .eq("id", refundRequestId)
      .single();

    if (refundError) throw refundError;
    if (!refundRequest) throw new Error("Refund request not found");

    if (action === "approve") {
      const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

      // Get the payment intent from the subscription
      if (!refundRequest.subscriptions?.stripe_subscription_id) {
        throw new Error("No Stripe subscription found");
      }

      const subscription = await stripe.subscriptions.retrieve(
        refundRequest.subscriptions.stripe_subscription_id
      );

      const latestInvoice = await stripe.invoices.retrieve(subscription.latest_invoice as string);
      const paymentIntentId = latestInvoice.payment_intent as string;

      // Create the refund
      const refund = await stripe.refunds.create({
        payment_intent: paymentIntentId,
        amount: Math.round(refundRequest.amount_requested * 100), // Convert to cents
        reason: "requested_by_customer",
      });

      logStep("Stripe refund created", { refundId: refund.id });

      // Update refund request
      await supabaseClient
        .from("refund_requests")
        .update({
          status: "processed",
          stripe_refund_id: refund.id,
          processed_by: user.id,
          processed_at: new Date().toISOString(),
        })
        .eq("id", refundRequestId);

      // Log transaction
      await supabaseClient.rpc("log_payment_transaction", {
        _user_id: refundRequest.user_id,
        _transaction_type: "refund",
        _amount: refundRequest.amount_requested,
        _status: "succeeded",
        _stripe_payment_intent_id: paymentIntentId,
        _subscription_id: refundRequest.subscription_id,
      });

      return new Response(JSON.stringify({ success: true, refund }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    } else if (action === "reject") {
      const { adminNotes } = await req.json();

      await supabaseClient
        .from("refund_requests")
        .update({
          status: "rejected",
          admin_notes: adminNotes,
          processed_by: user.id,
          processed_at: new Date().toISOString(),
        })
        .eq("id", refundRequestId);

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    throw new Error("Invalid action");
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

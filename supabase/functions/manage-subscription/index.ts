import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[MANAGE-SUBSCRIPTION] ${step}${detailsStr}`);
};

interface ManageSubscriptionRequest {
  action: "upgrade" | "downgrade" | "pause" | "resume" | "cancel";
  creatorId: string;
  newPriceId?: string; // For upgrade/downgrade
  pauseUntil?: string; // For pause (ISO date string)
}

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
    if (userError || !userData.user) throw new Error("Authentication failed");

    const userId = userData.user.id;
    logStep("User authenticated", { userId });

    const body: ManageSubscriptionRequest = await req.json();
    const { action, creatorId, newPriceId, pauseUntil } = body;

    logStep("Request received", { action, creatorId });

    // Get subscriber's subscription to this creator
    const { data: subscription } = await supabaseClient
      .from("subscriptions")
      .select("*, creator_profiles!inner(stripe_price_id)")
      .eq("subscriber_id", userId)
      .eq("creator_id", creatorId)
      .eq("status", "active")
      .single();

    if (!subscription) {
      throw new Error("No active subscription found");
    }

    if (!subscription.stripe_subscription_id) {
      throw new Error("No Stripe subscription ID found");
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    let result;

    switch (action) {
      case "upgrade":
      case "downgrade":
        if (!newPriceId) throw new Error("New price ID required for upgrade/downgrade");
        
        logStep("Changing subscription price", { newPriceId });

        // Get current subscription from Stripe
        const stripeSubscription = await stripe.subscriptions.retrieve(
          subscription.stripe_subscription_id
        );

        // Update the subscription with proration
        result = await stripe.subscriptions.update(
          subscription.stripe_subscription_id,
          {
            items: [{
              id: stripeSubscription.items.data[0].id,
              price: newPriceId,
            }],
            proration_behavior: 'create_prorations',
          }
        );

        logStep("Subscription updated with proration", { subscriptionId: result.id });
        break;

      case "pause":
        if (!pauseUntil) throw new Error("Pause date required");
        
        logStep("Pausing subscription", { pauseUntil });

        // Pause via Stripe
        result = await stripe.subscriptions.update(
          subscription.stripe_subscription_id,
          {
            pause_collection: {
              behavior: 'void',
              resumes_at: Math.floor(new Date(pauseUntil).getTime() / 1000),
            },
          }
        );

        // Update in Supabase
        await supabaseClient
          .from("subscriptions")
          .update({ pause_until: pauseUntil })
          .eq("id", subscription.id);

        logStep("Subscription paused", { resumesAt: pauseUntil });
        break;

      case "resume":
        logStep("Resuming subscription");

        // Resume via Stripe
        result = await stripe.subscriptions.update(
          subscription.stripe_subscription_id,
          {
            pause_collection: null,
          }
        );

        // Update in Supabase
        await supabaseClient
          .from("subscriptions")
          .update({ pause_until: null })
          .eq("id", subscription.id);

        logStep("Subscription resumed");
        break;

      case "cancel":
        logStep("Cancelling subscription");

        // Cancel at period end via Stripe
        result = await stripe.subscriptions.update(
          subscription.stripe_subscription_id,
          {
            cancel_at_period_end: true,
          }
        );

        logStep("Subscription will cancel at period end");
        break;

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return new Response(JSON.stringify({
      success: true,
      action,
      subscriptionId: subscription.stripe_subscription_id,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

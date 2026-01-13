import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[FIX-CREATOR-STRIPE] ${step}${detailsStr}`);
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
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user) throw new Error("User not authenticated");
    logStep("User authenticated", { userId: user.id });

    // Check if caller is the creator themselves or an admin
    const { data: creatorProfile, error: profileError } = await supabaseClient
      .from("creator_profiles")
      .select("id, user_id, subscription_price, stripe_price_id, stripe_product_id")
      .eq("user_id", user.id)
      .single();

    if (profileError || !creatorProfile) {
      throw new Error("Creator profile not found for this user");
    }

    // Check if Stripe IDs already exist
    if (creatorProfile.stripe_price_id && creatorProfile.stripe_product_id) {
      logStep("Stripe IDs already exist", { 
        priceId: creatorProfile.stripe_price_id,
        productId: creatorProfile.stripe_product_id 
      });
      return new Response(
        JSON.stringify({ 
          message: "Stripe setup already complete",
          priceId: creatorProfile.stripe_price_id,
          productId: creatorProfile.stripe_product_id
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // Get user profile for display name
    const { data: profile } = await supabaseClient
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .single();

    const displayName = profile?.display_name || "Creator";
    const subscriptionPrice = creatorProfile.subscription_price;

    logStep("Creating Stripe product", { displayName, subscriptionPrice });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Create Stripe product
    const product = await stripe.products.create({
      name: `${displayName}'s Subscription`,
      description: `Monthly subscription to ${displayName}'s exclusive content`,
      metadata: {
        creator_id: user.id,
      },
    });
    logStep("Product created", { productId: product.id });

    // Create Stripe price
    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: Math.round(subscriptionPrice * 100),
      currency: "usd",
      recurring: {
        interval: "month",
      },
      metadata: {
        creator_id: user.id,
      },
    });
    logStep("Price created", { priceId: price.id });

    // Update creator profile with Stripe IDs
    const { error: updateError } = await supabaseClient
      .from("creator_profiles")
      .update({
        stripe_product_id: product.id,
        stripe_price_id: price.id,
      })
      .eq("user_id", user.id);

    if (updateError) {
      logStep("Error updating creator profile", { error: updateError });
      throw new Error("Failed to update creator profile with Stripe IDs");
    }

    logStep("Creator profile updated successfully");

    return new Response(
      JSON.stringify({
        message: "Stripe setup completed successfully",
        productId: product.id,
        priceId: price.id,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in fix-creator-stripe", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

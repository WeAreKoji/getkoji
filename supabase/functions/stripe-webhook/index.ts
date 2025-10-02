import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Webhook received");

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      throw new Error("No Stripe signature found");
    }

    const body = await req.text();
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    
    if (!webhookSecret) {
      logStep("WARNING: No webhook secret set, skipping signature verification");
    }

    let event: Stripe.Event;
    
    if (webhookSecret) {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      logStep("Webhook signature verified", { type: event.type });
    } else {
      event = JSON.parse(body);
      logStep("Processing webhook without signature verification", { type: event.type });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Handle different event types
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        logStep("Checkout session completed", { sessionId: session.id });

        if (session.mode === "subscription" && session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
          const customerEmail = session.customer_details?.email || session.customer_email;
          
          if (!customerEmail) {
            throw new Error("No customer email found");
          }

          logStep("Processing subscription", { email: customerEmail });

          // Get user ID from email
          const { data: userData, error: userError } = await supabase
            .from("profiles")
            .select("id")
            .eq("email", customerEmail)
            .single();

          if (userError || !userData) {
            throw new Error(`User not found for email: ${customerEmail}`);
          }

          const subscriberId = userData.id;
          const creatorId = session.metadata?.creator_id;

          if (!creatorId) {
            throw new Error("No creator ID in session metadata");
          }

          // Insert subscription record
          const { error: subError } = await supabase
            .from("subscriptions")
            .insert({
              subscriber_id: subscriberId,
              creator_id: creatorId,
              stripe_subscription_id: subscription.id,
              status: "active",
              expires_at: new Date(subscription.current_period_end * 1000).toISOString(),
            });

          if (subError) {
            logStep("Error inserting subscription", { error: subError });
            throw subError;
          }

          // Update creator subscriber count
          const { error: countError } = await supabase.rpc(
            "increment_subscriber_count",
            { creator_user_id: creatorId }
          );

          if (countError) {
            logStep("Error updating subscriber count", { error: countError });
          }

          logStep("Subscription created successfully");
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        logStep("Subscription updated", { subscriptionId: subscription.id, status: subscription.status });

        const { error } = await supabase
          .from("subscriptions")
          .update({
            status: subscription.status,
            expires_at: new Date(subscription.current_period_end * 1000).toISOString(),
          })
          .eq("stripe_subscription_id", subscription.id);

        if (error) {
          logStep("Error updating subscription", { error });
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        logStep("Subscription deleted", { subscriptionId: subscription.id });

        // Get subscription details before updating
        const { data: subData } = await supabase
          .from("subscriptions")
          .select("creator_id")
          .eq("stripe_subscription_id", subscription.id)
          .single();

        const { error } = await supabase
          .from("subscriptions")
          .update({ status: "cancelled" })
          .eq("stripe_subscription_id", subscription.id);

        if (error) {
          logStep("Error cancelling subscription", { error });
        }

        // Decrement subscriber count
        if (subData?.creator_id) {
          await supabase.rpc("decrement_subscriber_count", { 
            creator_user_id: subData.creator_id 
          });
        }
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        logStep("Payment succeeded", { invoiceId: invoice.id, amount: invoice.amount_paid });
        
        // Track earnings with 20% platform commission
        if (invoice.subscription && invoice.amount_paid && invoice.total) {
          const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
          const { data: subData } = await supabase
            .from("subscriptions")
            .select("id, creator_id")
            .eq("stripe_subscription_id", subscription.id)
            .single();

          if (subData?.creator_id) {
            // CORRECTED Revenue split calculation
            const grossAmount = invoice.total / 100; // Total invoice (before Stripe fee)
            const amountPaid = invoice.amount_paid / 100; // Amount after Stripe fee
            const stripeFee = grossAmount - amountPaid; // Actual Stripe fee deducted
            const platformCommission = amountPaid * 0.20; // 20% of net amount
            const creatorEarnings = amountPaid * 0.80; // 80% of net amount

            logStep("Revenue split calculated", { 
              grossAmount, 
              amountPaid,
              stripeFee, 
              platformCommission, 
              creatorEarnings 
            });

            // Record platform revenue
            const { error: revenueError } = await supabase
              .from("platform_revenue")
              .insert({
                subscription_id: subData.id,
                invoice_id: invoice.id,
                creator_id: subData.creator_id,
                gross_amount: grossAmount,
                stripe_fee: stripeFee,
                platform_commission: platformCommission,
                creator_earnings: creatorEarnings
              });

            if (revenueError) {
              logStep("Error recording platform revenue", { error: revenueError });
            }

            // Get creator's Stripe Connect account
            const { data: creatorProfile } = await supabase
              .from("creator_profiles")
              .select("stripe_account_id, payouts_enabled")
              .eq("user_id", subData.creator_id)
              .single();

            // Transfer funds to creator if Stripe Connect is enabled
            if (creatorProfile?.stripe_account_id && creatorProfile?.payouts_enabled) {
              try {
                const transfer = await stripe.transfers.create({
                  amount: Math.round(creatorEarnings * 100), // Convert to cents
                  currency: invoice.currency,
                  destination: creatorProfile.stripe_account_id,
                  transfer_group: subscription.id,
                  description: `Subscription payment for invoice ${invoice.id}`,
                  metadata: {
                    creator_id: subData.creator_id,
                    invoice_id: invoice.id,
                    subscription_id: subscription.id,
                  },
                });
                logStep("Transfer created successfully", { transferId: transfer.id, amount: creatorEarnings });
              } catch (transferError: any) {
                logStep("ERROR creating transfer", { error: transferError.message });
              }
            } else {
              logStep("Skipping transfer - Stripe Connect not enabled", {
                hasStripeAccount: !!creatorProfile?.stripe_account_id,
                payoutsEnabled: creatorProfile?.payouts_enabled
              });
            }

            // Add earnings to creator profile
            await supabase.rpc("add_creator_earnings", {
              creator_user_id: subData.creator_id,
              amount: creatorEarnings
            });
            
            logStep("Creator earnings updated", { creatorId: subData.creator_id, amount: creatorEarnings });
          }
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        logStep("Payment failed", { invoiceId: invoice.id });
        // Could send notification to user here
        break;
      }

      case "account.updated": {
        const account = event.data.object as Stripe.Account;
        logStep("Connect account updated", { accountId: account.id });
        
        // Update creator profile with account status
        const { data: creatorData } = await supabase
          .from("creator_profiles")
          .select("user_id")
          .eq("stripe_account_id", account.id)
          .single();

        if (creatorData) {
          await supabase
            .from("creator_profiles")
            .update({
              stripe_onboarding_complete: account.details_submitted || false,
              payouts_enabled: account.payouts_enabled || false,
            })
            .eq("user_id", creatorData.user_id);
          
          logStep("Creator profile updated with account status", { 
            userId: creatorData.user_id,
            onboardingComplete: account.details_submitted,
            payoutsEnabled: account.payouts_enabled
          });
        }
        break;
      }

      default:
        logStep("Unhandled event type", { type: event.type });
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
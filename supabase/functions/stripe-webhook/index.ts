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
    
    // ENFORCE webhook signature verification for security
    if (!webhookSecret) {
      logStep("ERROR: STRIPE_WEBHOOK_SECRET not configured");
      throw new Error("Webhook secret must be configured. Set STRIPE_WEBHOOK_SECRET in your Supabase secrets.");
    }

    // Verify the webhook signature
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    logStep("Webhook signature verified", { type: event.type });

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

          // Create notification for creator
          await supabase.rpc("create_notification", {
            _user_id: creatorId,
            _type: "new_subscriber",
            _title: "New Subscriber!",
            _message: "You have a new subscriber to your content",
            _data: { subscriber_id: subscriberId, subscription_id: subscription.id }
          });

          // Send email notification
          await supabase.functions.invoke("send-notification-email", {
            body: {
              userId: creatorId,
              type: "new_subscriber",
              title: "New Subscriber!",
              message: "You have a new subscriber to your content",
              data: { subscription_id: subscription.id }
            }
          });

          logStep("Subscription created successfully");
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        logStep("Subscription updated", { subscriptionId: subscription.id, status: subscription.status });

        // Get subscription data for notifications
        const { data: subData } = await supabase
          .from("subscriptions")
          .select("subscriber_id, creator_id")
          .eq("stripe_subscription_id", subscription.id)
          .single();

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

        // Notify about renewal or status change
        if (subData && subscription.status === "active") {
          await supabase.rpc("create_notification", {
            _user_id: subData.subscriber_id,
            _type: "subscription_renewal",
            _title: "Subscription Renewed",
            _message: "Your subscription has been renewed successfully",
            _data: { subscription_id: subscription.id, expires_at: new Date(subscription.current_period_end * 1000).toISOString() }
          });

          await supabase.functions.invoke("send-notification-email", {
            body: {
              userId: subData.subscriber_id,
              type: "subscription_renewal",
              title: "Subscription Renewed",
              message: "Your subscription has been renewed successfully",
              data: { expires_at: new Date(subscription.current_period_end * 1000).toISOString() }
            }
          });
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
            const { data: revenueData, error: revenueError } = await supabase
              .from("platform_revenue")
              .insert({
                subscription_id: subData.id,
                invoice_id: invoice.id,
                creator_id: subData.creator_id,
                gross_amount: grossAmount,
                stripe_fee: stripeFee,
                platform_commission: platformCommission,
                creator_earnings: creatorEarnings
              })
              .select()
              .single();

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
                
                // Log failed transfer to database for tracking and retry
                const { error: failedTransferError } = await supabase
                  .from("failed_transfers")
                  .insert({
                    creator_id: subData.creator_id,
                    invoice_id: invoice.id,
                    subscription_id: subData.id,
                    amount: creatorEarnings,
                    currency: invoice.currency,
                    error_message: transferError.message,
                    metadata: {
                      stripe_account_id: creatorProfile.stripe_account_id,
                      transfer_group: subscription.id,
                      error_type: transferError.type,
                      error_code: transferError.code,
                    }
                  });
                
                if (failedTransferError) {
                  logStep("ERROR logging failed transfer", { error: failedTransferError });
                }

                // Notify creator about failed transfer
                await supabase.rpc("create_notification", {
                  _user_id: subData.creator_id,
                  _type: "failed_transfer",
                  _title: "Transfer Failed",
                  _message: `A transfer of $${creatorEarnings.toFixed(2)} failed. Please check your payout settings.`,
                  _data: { amount: creatorEarnings, error: transferError.message }
                });

                await supabase.functions.invoke("send-notification-email", {
                  body: {
                    userId: subData.creator_id,
                    type: "failed_transfer",
                    title: "Transfer Failed",
                    message: `A transfer of $${creatorEarnings.toFixed(2)} failed. Please check your payout settings and Stripe Connect account.`,
                    data: { amount: creatorEarnings, invoice_id: invoice.id }
                  }
                });
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

            // Check for active creator referral and calculate commission
            const { data: activeReferral } = await supabase
              .from("creator_referrals")
              .select("*")
              .eq("referred_creator_id", subData.creator_id)
              .eq("status", "active")
              .gt("expires_at", new Date().toISOString())
              .maybeSingle();

            if (activeReferral) {
              const commissionAmount = creatorEarnings * (activeReferral.commission_percentage / 100);
              
              logStep("Creator referral found, calculating commission", {
                referralId: activeReferral.id,
                creatorEarnings,
                commissionPercentage: activeReferral.commission_percentage,
                commissionAmount
              });

              // Insert commission record
              const { error: commissionError } = await supabase
                .from("creator_referral_commissions")
                .insert({
                  creator_referral_id: activeReferral.id,
                  platform_revenue_id: revenueData.id,
                  creator_earnings_amount: creatorEarnings,
                  commission_amount: commissionAmount,
                  invoice_id: invoice.id,
                  subscription_id: subData.id,
                });

              if (commissionError) {
                logStep("ERROR inserting commission", { error: commissionError });
              } else {
                // Update referral totals
                await supabase
                  .from("creator_referrals")
                  .update({
                    total_earnings_tracked: activeReferral.total_earnings_tracked + creatorEarnings,
                    total_commission_earned: activeReferral.total_commission_earned + commissionAmount,
                    last_commission_date: new Date().toISOString(),
                  })
                  .eq("id", activeReferral.id);

                // Check if payout threshold is met
                const { data: referrerCommissions } = await supabase
                  .from("creator_referral_commissions")
                  .select("commission_amount")
                  .eq("creator_referral_id", activeReferral.id)
                  .is("included_in_payout_id", null);

                const totalUnpaid = referrerCommissions?.reduce((sum, c) => sum + Number(c.commission_amount), 0) || 0;

                logStep("Referral commission processed", { 
                  commissionAmount, 
                  totalUnpaid,
                  thresholdMet: totalUnpaid >= 25 
                });

                if (totalUnpaid >= 25) {
                  await supabase.rpc("process_referral_payout", { 
                    referrer_user_id: activeReferral.referrer_id 
                  });
                  logStep("Referral payout threshold met, payout created");
                }
              }
            }
          }
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        logStep("Payment failed", { invoiceId: invoice.id });
        
        // Get subscription and notify subscriber
        if (invoice.subscription) {
          const { data: subData } = await supabase
            .from("subscriptions")
            .select("subscriber_id, creator_id")
            .eq("stripe_subscription_id", invoice.subscription as string)
            .single();

          if (subData) {
            await supabase.rpc("create_notification", {
              _user_id: subData.subscriber_id,
              _type: "payment_failed",
              _title: "Payment Failed",
              _message: "Your subscription payment failed. Please update your payment method.",
              _data: { invoice_id: invoice.id }
            });

            await supabase.functions.invoke("send-notification-email", {
              body: {
                userId: subData.subscriber_id,
                type: "payment_failed",
                title: "Payment Failed",
                message: "Your subscription payment failed. Please update your payment method to continue your subscription.",
                data: { invoice_id: invoice.id }
              }
            });
          }
        }
        break;
      }

      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        logStep("Charge refunded", { chargeId: charge.id, amount: charge.amount_refunded });

        // Find the original platform_revenue record
        const { data: revenueData } = await supabase
          .from("platform_revenue")
          .select("*")
          .eq("invoice_id", charge.invoice as string)
          .single();

        if (revenueData) {
          const refundAmount = charge.amount_refunded / 100;
          const refundProportion = refundAmount / revenueData.gross_amount;
          
          // Calculate refund amounts
          const refundedStripeFee = revenueData.stripe_fee * refundProportion;
          const refundedCommission = revenueData.platform_commission * refundProportion;
          const refundedCreatorEarnings = revenueData.creator_earnings * refundProportion;

          logStep("Refund breakdown calculated", {
            refundAmount,
            refundedCommission,
            refundedCreatorEarnings
          });

          // Record the refund as negative revenue
          const { error: refundError } = await supabase
            .from("platform_revenue")
            .insert({
              subscription_id: revenueData.subscription_id,
              invoice_id: charge.invoice as string,
              creator_id: revenueData.creator_id,
              gross_amount: -refundAmount,
              stripe_fee: -refundedStripeFee,
              platform_commission: -refundedCommission,
              creator_earnings: -refundedCreatorEarnings
            });

          if (refundError) {
            logStep("Error recording refund", { error: refundError });
          }

          // Subtract from creator's total earnings
          await supabase.rpc("add_creator_earnings", {
            creator_user_id: revenueData.creator_id,
            amount: -refundedCreatorEarnings
          });

          logStep("Refund processed successfully");
        }
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
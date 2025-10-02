import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[RETRY-FAILED-TRANSFERS] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started - checking for failed transfers to retry");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Get unresolved failed transfers with retry count < 3
    const { data: failedTransfers } = await supabaseClient
      .from("failed_transfers")
      .select("*, creator_profiles!inner(stripe_account_id, payouts_enabled)")
      .is("resolved_at", null)
      .lt("retry_count", 3)
      .order("created_at", { ascending: true })
      .limit(10);

    if (!failedTransfers || failedTransfers.length === 0) {
      logStep("No failed transfers to retry");
      return new Response(JSON.stringify({ 
        message: "No failed transfers to retry",
        processed: 0 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    logStep("Found failed transfers to retry", { count: failedTransfers.length });

    let successCount = 0;
    let failCount = 0;

    for (const transfer of failedTransfers) {
      const creatorProfile = transfer.creator_profiles;
      
      // Check if creator now has payouts enabled
      if (!creatorProfile?.stripe_account_id || !creatorProfile?.payouts_enabled) {
        logStep("Skipping transfer - payouts not enabled", { transferId: transfer.id });
        continue;
      }

      try {
        // Attempt the transfer again
        const stripeTransfer = await stripe.transfers.create({
          amount: Math.round(Number(transfer.amount) * 100),
          currency: transfer.currency,
          destination: creatorProfile.stripe_account_id,
          description: `Retry of failed transfer for invoice ${transfer.invoice_id}`,
          metadata: transfer.metadata || {},
        });

        logStep("Transfer retry successful", { 
          transferId: transfer.id, 
          stripeTransferId: stripeTransfer.id 
        });

        // Mark as resolved
        await supabaseClient
          .from("failed_transfers")
          .update({ 
            resolved_at: new Date().toISOString(),
            metadata: {
              ...(transfer.metadata || {}),
              resolved_stripe_transfer_id: stripeTransfer.id,
            }
          })
          .eq("id", transfer.id);

        successCount++;
      } catch (retryError: any) {
        logStep("Transfer retry failed", { 
          transferId: transfer.id, 
          error: retryError.message 
        });

        // Update retry count and last retry time
        await supabaseClient
          .from("failed_transfers")
          .update({ 
            retry_count: transfer.retry_count + 1,
            last_retry_at: new Date().toISOString(),
            error_message: retryError.message,
          })
          .eq("id", transfer.id);

        failCount++;
      }
    }

    logStep("Retry process completed", { successCount, failCount });

    return new Response(JSON.stringify({
      message: "Failed transfers retry completed",
      processed: failedTransfers.length,
      successful: successCount,
      failed: failCount,
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

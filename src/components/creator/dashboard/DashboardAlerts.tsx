import { useState, useEffect } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CreditCard, Loader2, CheckCircle } from "lucide-react";
import { VerificationStatusBanner } from "@/components/creator/VerificationStatusBanner";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { logError } from "@/lib/error-logger";

interface FailedTransfer {
  id: string;
  amount: number;
  currency: string;
  error_message: string;
  retry_count: number;
  created_at: string;
}

interface PayoutInfo {
  connected: boolean;
  isTestMode?: boolean;
  balance?: {
    available: number;
    pending: number;
    currency: string;
  };
  nextPayout?: {
    amount: number;
    arrivalDate: string;
    status: string;
  };
  payoutSchedule?: {
    interval: string;
    delayDays: number;
  };
  dashboardUrl?: string;
}

interface DashboardAlertsProps {
  userId: string;
  payoutInfo: PayoutInfo | null;
  failedTransfers: FailedTransfer[];
  onRefetch?: () => void;
}

export const DashboardAlerts = ({ userId, payoutInfo, failedTransfers, onRefetch }: DashboardAlertsProps) => {
  const { toast } = useToast();
  const [stripeSetupComplete, setStripeSetupComplete] = useState(true);
  const [fixingStripe, setFixingStripe] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);

  useEffect(() => {
    checkStripeSetup();
  }, [userId]);

  const checkStripeSetup = async () => {
    try {
      const { data: creatorProfile } = await supabase
        .from("creator_profiles")
        .select("stripe_price_id, stripe_product_id")
        .eq("user_id", userId)
        .single();

      setStripeSetupComplete(
        !!creatorProfile?.stripe_price_id && !!creatorProfile?.stripe_product_id
      );
    } catch (error) {
      logError(error, 'DashboardAlerts.checkStripeSetup');
    } finally {
      setCheckingStatus(false);
    }
  };

  const handleFixStripeSetup = async () => {
    setFixingStripe(true);
    try {
      const { data, error } = await supabase.functions.invoke("fix-creator-stripe");

      if (error) {
        throw new Error(error.message || "Failed to fix Stripe setup");
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      toast({
        title: "Payment Setup Complete!",
        description: "Your Stripe product and pricing have been configured. Subscribers can now pay you!",
      });

      setStripeSetupComplete(true);
      onRefetch?.();
    } catch (error: any) {
      logError(error, 'DashboardAlerts.handleFixStripeSetup');
      toast({
        title: "Setup Failed",
        description: error.message || "Unable to complete payment setup. Please try again.",
        variant: "destructive",
      });
    } finally {
      setFixingStripe(false);
    }
  };

  return (
    <div className="space-y-4">
      <VerificationStatusBanner userId={userId} />

      {/* Stripe Setup Required Alert */}
      {!checkingStatus && !stripeSetupComplete && (
        <Alert className="border-amber-500 bg-amber-50 dark:bg-amber-950">
          <CreditCard className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <AlertTitle className="text-amber-600 dark:text-amber-400">
            Payment Setup Incomplete
          </AlertTitle>
          <AlertDescription className="text-amber-600 dark:text-amber-400">
            <p className="mb-3">
              Your Stripe payment setup isn't complete. Subscribers won't be able to pay you until this is fixed.
            </p>
            <Button
              onClick={handleFixStripeSetup}
              disabled={fixingStripe}
              size="sm"
              variant="outline"
              className="border-amber-500 text-amber-700 hover:bg-amber-100 dark:border-amber-400 dark:text-amber-400 dark:hover:bg-amber-900"
            >
              {fixingStripe ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Setting up...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Complete Payment Setup
                </>
              )}
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Test Mode Banner */}
      {payoutInfo?.isTestMode && (
        <Alert className="border-orange-500 bg-orange-50 dark:bg-orange-950">
          <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
          <AlertTitle className="text-orange-600 dark:text-orange-400">Test Mode Active</AlertTitle>
          <AlertDescription className="text-orange-600 dark:text-orange-400">
            You're using Stripe in test mode. Transactions won't process real payments.
          </AlertDescription>
        </Alert>
      )}

      {/* Failed Transfers Alert */}
      {failedTransfers.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Transfer Issues Detected</AlertTitle>
          <AlertDescription>
            {failedTransfers.length} transfer{failedTransfers.length > 1 ? 's' : ''} failed. 
            Total amount pending: ${failedTransfers.reduce((sum, t) => sum + Number(t.amount), 0).toFixed(2)}.
            {' '}Please ensure your Stripe Connect account is properly set up in Payout Settings below.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

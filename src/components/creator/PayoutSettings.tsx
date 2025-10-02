import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ExternalLink, CheckCircle, AlertCircle, DollarSign } from "lucide-react";

interface PayoutStatus {
  connected: boolean;
  onboarding_complete: boolean;
  payouts_enabled: boolean;
  charges_enabled?: boolean;
  account_id?: string;
}

interface CreatorProfile {
  id_verified: boolean;
}

const PayoutSettings = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [status, setStatus] = useState<PayoutStatus>({
    connected: false,
    onboarding_complete: false,
    payouts_enabled: false,
  });
  const [creatorProfile, setCreatorProfile] = useState<CreatorProfile | null>(null);

  useEffect(() => {
    checkConnectStatus();
    checkVerificationStatus();
  }, []);

  const checkVerificationStatus = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("creator_profiles")
        .select("id_verified")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      setCreatorProfile(data);
    } catch (error) {
      console.error("Error checking verification status:", error);
    }
  };

  const checkConnectStatus = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke("check-connect-status");

      if (error) throw error;
      setStatus(data);
    } catch (error: any) {
      console.error("Error checking Connect status:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    if (!creatorProfile?.id_verified) {
      toast({
        title: "ID Verification Required",
        description: "You must complete ID verification before setting up payouts",
        variant: "destructive",
      });
      return;
    }

    setConnecting(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-connect-account");

      if (error) throw error;

      if (data.url) {
        window.open(data.url, "_blank");
        toast({
          title: "Opening Stripe Connect",
          description: "Complete the onboarding in the new window",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to connect to Stripe",
        variant: "destructive",
      });
    } finally {
      setConnecting(false);
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Payout Settings
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Connect your Stripe account to receive payouts
          </p>
        </div>
        {status.payouts_enabled && (
          <Badge variant="default" className="flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            Active
          </Badge>
        )}
      </div>

      <div className="space-y-4">
        {/* ID Verification Warning */}
        {!creatorProfile?.id_verified && (
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-sm font-medium text-destructive mb-2">⚠️ ID Verification Required</p>
            <p className="text-sm text-muted-foreground">
              You must complete identity verification before you can set up payouts. 
              This is required for compliance and security purposes.
            </p>
          </div>
        )}

        {/* Status Indicators */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            {status.connected ? (
              <CheckCircle className="w-4 h-4 text-green-500" />
            ) : (
              <AlertCircle className="w-4 h-4 text-muted-foreground" />
            )}
            <span>Stripe Account Connected</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            {status.onboarding_complete ? (
              <CheckCircle className="w-4 h-4 text-green-500" />
            ) : (
              <AlertCircle className="w-4 h-4 text-muted-foreground" />
            )}
            <span>Onboarding Complete</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            {status.payouts_enabled ? (
              <CheckCircle className="w-4 h-4 text-green-500" />
            ) : (
              <AlertCircle className="w-4 h-4 text-muted-foreground" />
            )}
            <span>Payouts Enabled</span>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-4 border-t border-border">
          {!status.connected || !status.onboarding_complete ? (
            <Button
              onClick={handleConnect}
              disabled={connecting || !creatorProfile?.id_verified}
              className="w-full"
            >
              {connecting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <ExternalLink className="w-4 h-4 mr-2" />
                  {status.connected ? "Complete Onboarding" : "Connect Stripe Account"}
                </>
              )}
            </Button>
          ) : (
            <div className="space-y-2">
              <Button
                onClick={handleConnect}
                variant="outline"
                className="w-full"
                disabled={connecting}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Manage Stripe Account
              </Button>
              <Button
                onClick={checkConnectStatus}
                variant="secondary"
                className="w-full"
                size="sm"
              >
                Refresh Status
              </Button>
            </div>
          )}
        </div>

        {/* Info Text */}
        {!status.payouts_enabled && (
          <div className="bg-muted rounded-lg p-3">
            <p className="text-xs text-muted-foreground">
              {!status.connected
                ? "Connect your Stripe account to start receiving payouts from your subscribers."
                : "Complete the onboarding process to enable payouts."}
            </p>
          </div>
        )}

        {status.payouts_enabled && (
          <div className="bg-green-50 dark:bg-green-950/20 rounded-lg p-3">
            <p className="text-xs text-green-700 dark:text-green-400">
              Your account is fully set up! Earnings will be automatically transferred to your bank account according to Stripe's payout schedule.
            </p>
          </div>
        )}
      </div>
    </Card>
  );
};

export default PayoutSettings;

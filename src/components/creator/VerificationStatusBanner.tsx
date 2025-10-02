import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ShieldCheck, AlertCircle, Clock, XCircle } from "lucide-react";
import { Link } from "react-router-dom";

interface VerificationStatus {
  status: string;
  id_verified: boolean;
  rejection_reason?: string;
}

export const VerificationStatusBanner = ({ userId }: { userId: string }) => {
  const [status, setStatus] = useState<VerificationStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVerificationStatus();
  }, [userId]);

  const fetchVerificationStatus = async () => {
    // Check creator profile for verification status
    const { data: profile } = await supabase
      .from("creator_profiles")
      .select("id_verified")
      .eq("user_id", userId)
      .maybeSingle();

    // Check for pending verification
    const { data: verification } = await supabase
      .from("creator_id_verification")
      .select("status, rejection_reason")
      .eq("creator_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    setStatus({
      status: verification?.status || "not_submitted",
      id_verified: profile?.id_verified || false,
      rejection_reason: verification?.rejection_reason,
    });
    setLoading(false);
  };

  if (loading || !status) return null;

  // Already verified
  if (status.id_verified) {
    return (
      <Alert className="mb-6 border-green-500 bg-green-50 dark:bg-green-950">
        <ShieldCheck className="h-4 w-4 text-green-600" />
        <AlertTitle className="text-green-600">Identity Verified</AlertTitle>
        <AlertDescription className="text-green-700 dark:text-green-400">
          Your identity has been verified. You have full access to all creator features.
        </AlertDescription>
      </Alert>
    );
  }

  // Pending verification
  if (status.status === "pending") {
    return (
      <Alert className="mb-6 border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
        <Clock className="h-4 w-4 text-yellow-600" />
        <AlertTitle className="text-yellow-600">Verification Pending</AlertTitle>
        <AlertDescription className="text-yellow-700 dark:text-yellow-400">
          Your identity verification is being reviewed. This usually takes 1-2 business days.
        </AlertDescription>
      </Alert>
    );
  }

  // Rejected verification
  if (status.status === "rejected") {
    return (
      <Alert className="mb-6 border-red-500 bg-red-50 dark:bg-red-950">
        <XCircle className="h-4 w-4 text-red-600" />
        <AlertTitle className="text-red-600">Verification Rejected</AlertTitle>
        <AlertDescription className="text-red-700 dark:text-red-400">
          {status.rejection_reason || "Your verification was rejected. Please try again with correct information."}
          <Button asChild variant="link" className="p-0 h-auto text-red-600 ml-2">
            <Link to="/creator/verify-identity">Submit Again</Link>
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  // Not submitted
  return (
    <Alert className="mb-6 border-blue-500 bg-blue-50 dark:bg-blue-950">
      <AlertCircle className="h-4 w-4 text-blue-600" />
      <AlertTitle className="text-blue-600">Identity Verification Required</AlertTitle>
      <AlertDescription className="text-blue-700 dark:text-blue-400">
        Complete identity verification to unlock all creator features including payouts and premium content.
        <Button asChild variant="link" className="p-0 h-auto text-blue-600 ml-2">
          <Link to="/creator/verify-identity">Verify Now</Link>
        </Button>
      </AlertDescription>
    </Alert>
  );
};

import { ReactNode, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Lock } from "lucide-react";
import { Link } from "react-router-dom";

interface VerificationGateProps {
  userId: string;
  children: ReactNode;
  feature: string;
}

export const VerificationGate = ({ userId, children, feature }: VerificationGateProps) => {
  const [isVerified, setIsVerified] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkVerification();
  }, [userId]);

  const checkVerification = async () => {
    const { data, error } = await supabase
      .from("creator_profiles")
      .select("id_verified")
      .eq("user_id", userId)
      .maybeSingle();

    if (!error && data) {
      setIsVerified(data.id_verified);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="animate-pulse bg-muted rounded-lg p-6 h-48" />
    );
  }

  if (!isVerified) {
    return (
      <Alert className="border-primary bg-primary/5">
        <Lock className="h-4 w-4" />
        <AlertTitle>Verification Required</AlertTitle>
        <AlertDescription className="mt-2 space-y-2">
          <p>
            Identity verification is required to access {feature}.
          </p>
          <Button asChild size="sm">
            <Link to="/creator/verify-identity">
              <ShieldCheck className="w-4 h-4 mr-2" />
              Verify Identity
            </Link>
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return <>{children}</>;
};

import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Loader2 } from "lucide-react";

const SubscriptionSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const creatorId = searchParams.get("creatorId");
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          if (creatorId) {
            navigate(`/creator/${creatorId}?success=true`);
          } else {
            navigate("/creators");
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate, creatorId]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full p-8 text-center">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">Subscription Successful!</h1>
        <p className="text-muted-foreground mb-6">
          Thank you for subscribing. You now have access to exclusive content.
        </p>
        
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-4">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Redirecting in {countdown} seconds...</span>
        </div>

        <Button
          onClick={() => {
            if (creatorId) {
              navigate(`/creator/${creatorId}?success=true`);
            } else {
              navigate("/creators");
            }
          }}
          className="w-full"
        >
          Continue to Creator
        </Button>
      </Card>
    </div>
  );
};

export default SubscriptionSuccess;

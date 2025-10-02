import { useNavigate, useSearchParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { XCircle } from "lucide-react";

const SubscriptionCancelled = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const creatorId = searchParams.get("creatorId");

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full p-8 text-center">
        <XCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">Subscription Cancelled</h1>
        <p className="text-muted-foreground mb-6">
          You cancelled the subscription process. No charges were made.
        </p>
        
        <div className="flex flex-col gap-2">
          <Button
            onClick={() => {
              if (creatorId) {
                navigate(`/creator/${creatorId}`);
              } else {
                navigate("/creators");
              }
            }}
            className="w-full"
          >
            {creatorId ? "Back to Creator" : "Browse Creators"}
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate("/discover")}
            className="w-full"
          >
            Continue Browsing
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default SubscriptionCancelled;

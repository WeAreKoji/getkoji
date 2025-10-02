import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Loader2 } from "lucide-react";

const SUBSCRIPTION_TIERS = [
  {
    priceId: "price_1SDisJEQjcZdgqoDhPvzRh33",
    amount: 5,
    name: "Basic",
    description: "Great for getting started",
  },
  {
    priceId: "price_1SDishEQjcZdgqoD97tJt5so",
    amount: 10,
    name: "Premium",
    description: "Most popular choice",
  },
  {
    priceId: "price_1SDitLEQjcZdgqoDVwE2qkUl",
    amount: 20,
    name: "Elite",
    description: "For exclusive content",
  },
];

const CreatorSetup = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [selectedTier, setSelectedTier] = useState(SUBSCRIPTION_TIERS[1].priceId);

  useEffect(() => {
    checkCreatorStatus();
  }, []);

  const checkCreatorStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "creator")
        .maybeSingle();

      if (!roles) {
        navigate("/creator/apply");
        return;
      }

      // Check if already set up
      const { data: profile } = await supabase
        .from("creator_profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (profile) {
        navigate(`/creator/${user.id}`);
      }
    } catch (error) {
      console.error("Error checking status:", error);
    } finally {
      setChecking(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const tier = SUBSCRIPTION_TIERS.find((t) => t.priceId === selectedTier);
      if (!tier) throw new Error("Invalid tier selected");

      const { error } = await supabase
        .from("creator_profiles")
        .insert({
          user_id: user.id,
          subscription_price: tier.amount,
        });

      if (error) throw error;

      toast({
        title: "Creator profile created! 🎉",
        description: "You can now start posting content",
      });

      navigate(`/creator/${user.id}`);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-2xl mx-auto px-4 py-6">
        <Link to="/discover">
          <Button variant="ghost" size="sm" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </Link>

        <Card className="p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Set Your Subscription Price</h1>
            <p className="text-muted-foreground">
              Choose how much your subscribers will pay per month
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <RadioGroup value={selectedTier} onValueChange={setSelectedTier}>
              <div className="space-y-3">
                {SUBSCRIPTION_TIERS.map((tier) => (
                  <div
                    key={tier.priceId}
                    className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                      selectedTier === tier.priceId
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                    onClick={() => setSelectedTier(tier.priceId)}
                  >
                    <div className="flex items-start">
                      <RadioGroupItem
                        value={tier.priceId}
                        id={tier.priceId}
                        className="mt-1"
                      />
                      <Label
                        htmlFor={tier.priceId}
                        className="flex-1 ml-3 cursor-pointer"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-lg">{tier.name}</span>
                          <span className="text-2xl font-bold">
                            ${tier.amount}
                            <span className="text-sm font-normal text-muted-foreground">
                              /month
                            </span>
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {tier.description}
                        </p>
                      </Label>
                    </div>
                  </div>
                ))}
              </div>
            </RadioGroup>

            <div className="bg-muted rounded-lg p-4">
              <h3 className="font-semibold mb-2">What you'll earn:</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Stripe processing fee: ~3% + $0.30 per transaction
              </p>
              <p className="text-sm">
                You'll receive approximately{" "}
                <span className="font-semibold">
                  ${(
                    SUBSCRIPTION_TIERS.find((t) => t.priceId === selectedTier)!
                      .amount * 0.97 -
                    0.3
                  ).toFixed(2)}
                </span>{" "}
                per subscriber per month
              </p>
            </div>

            <Button type="submit" disabled={loading} className="w-full" size="lg">
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating Profile...
                </>
              ) : (
                "Complete Setup"
              )}
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              You can change your subscription price later in your settings
            </p>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default CreatorSetup;

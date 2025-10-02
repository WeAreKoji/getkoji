import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Loader2, DollarSign } from "lucide-react";
import { logError, logWarning } from "@/lib/error-logger";

const CreatorSetup = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [price, setPrice] = useState("10");

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

      // Check ID verification status
      const { data: verification } = await supabase
        .from("creator_id_verification")
        .select("status")
        .eq("creator_id", user.id)
        .maybeSingle();

      if (!verification || verification.status !== "approved") {
        navigate("/creator/verify-identity");
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
      logError(error, 'CreatorSetup.checkCreatorStatus');
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

      const priceAmount = parseFloat(price);
      
      // Validate price
      if (isNaN(priceAmount) || priceAmount < 1 || priceAmount > 999) {
        throw new Error("Price must be between $1 and $999");
      }

      // First create the creator profile
      const { error: profileError } = await supabase
        .from("creator_profiles")
        .insert({
          user_id: user.id,
          subscription_price: priceAmount,
        });

      if (profileError) throw profileError;

      // Then create Stripe product and price
      const { error: productError } = await supabase.functions.invoke(
        "create-creator-product",
        {
          body: { subscriptionPrice: priceAmount },
        }
      );

      if (productError) {
        logWarning('Stripe product creation failed during creator setup', 'CreatorSetup');
        toast({
          title: "Warning",
          description: "Profile created but Stripe setup incomplete. You can set it up later.",
          variant: "default",
        });
      }

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
              Choose your monthly subscription price (between $1 and $999)
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="price">Monthly Subscription Price</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="price"
                  type="number"
                  min="1"
                  max="999"
                  step="1"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="pl-9 text-lg"
                  placeholder="10"
                  required
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Set a competitive price that reflects the value of your content
              </p>
            </div>

            <div className="bg-muted rounded-lg p-4 space-y-2">
              <h3 className="font-semibold">Revenue Breakdown</h3>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subscription price:</span>
                  <span className="font-medium">${parseFloat(price || "0").toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Stripe fee (~3% + $0.30):</span>
                  <span className="text-destructive">-${(parseFloat(price || "0") * 0.03 + 0.3).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Platform fee (20%):</span>
                  <span className="text-destructive">-${((parseFloat(price || "0") - (parseFloat(price || "0") * 0.03 + 0.3)) * 0.20).toFixed(2)}</span>
                </div>
                <div className="border-t border-border pt-2 mt-2 flex justify-between">
                  <span className="font-semibold">Your earnings per subscriber:</span>
                  <span className="font-bold text-primary">
                    ${((parseFloat(price || "0") - (parseFloat(price || "0") * 0.03 + 0.3)) * 0.80).toFixed(2)}
                  </span>
                </div>
              </div>
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

import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SubscriptionPriceEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentPrice: number;
  onPriceUpdated: () => void;
}

const PRICE_TIERS = [
  { value: 5, label: "$5/month", description: "Basic" },
  { value: 10, label: "$10/month", description: "Premium" },
  { value: 20, label: "$20/month", description: "Elite" },
];

const SubscriptionPriceEditor = ({
  open,
  onOpenChange,
  currentPrice,
  onPriceUpdated,
}: SubscriptionPriceEditorProps) => {
  const { toast } = useToast();
  const [selectedPrice, setSelectedPrice] = useState(String(currentPrice));
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const newPrice = Number(selectedPrice);

      // Update creator profile
      const { error: updateError } = await supabase
        .from("creator_profiles")
        .update({ subscription_price: newPrice })
        .eq("user_id", user.id);

      if (updateError) throw updateError;

      // Create new Stripe product and price
      const { error: productError } = await supabase.functions.invoke(
        "create-creator-product",
        {
          body: { subscriptionPrice: newPrice },
        }
      );

      if (productError) {
        console.error("Error creating Stripe product:", productError);
        toast({
          title: "Warning",
          description: "Price updated but Stripe setup incomplete. New subscribers may not work until resolved.",
        });
      } else {
        toast({
          title: "Price Updated",
          description: "Your subscription price has been updated. New subscribers will pay the new price. Existing subscribers keep their current price.",
        });
      }

      onPriceUpdated();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Subscription Price</DialogTitle>
          <DialogDescription>
            Update your monthly subscription price
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="text-sm">
            <span className="text-muted-foreground">Current price: </span>
            <span className="font-semibold">${currentPrice}/month</span>
          </div>

          <RadioGroup value={selectedPrice} onValueChange={setSelectedPrice}>
            {PRICE_TIERS.map((tier) => (
              <div key={tier.value} className="flex items-center space-x-3 p-3 border border-border rounded-lg hover:bg-accent/50 transition-colors">
                <RadioGroupItem value={String(tier.value)} id={`tier-${tier.value}`} />
                <Label htmlFor={`tier-${tier.value}`} className="flex-1 cursor-pointer">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{tier.label}</span>
                    <span className="text-sm text-muted-foreground">{tier.description}</span>
                  </div>
                </Label>
              </div>
            ))}
          </RadioGroup>

          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              New price will apply to new subscribers only. Existing subscribers will keep their current price.
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || selectedPrice === String(currentPrice)}>
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SubscriptionPriceEditor;

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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info, Loader2, Pause, Play, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface SubscriptionManagementProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  creatorId: string;
  creatorName: string;
  currentPrice: number;
  onActionComplete: () => void;
}

const SubscriptionManagement = ({
  open,
  onOpenChange,
  creatorId,
  creatorName,
  currentPrice,
  onActionComplete,
}: SubscriptionManagementProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [action, setAction] = useState<"pause" | "resume" | "cancel" | null>(null);
  const [pauseDate, setPauseDate] = useState("");

  const handleAction = async (selectedAction: "pause" | "resume" | "cancel") => {
    if (selectedAction === "pause" && !pauseDate) {
      toast({
        title: "Date Required",
        description: "Please select when to resume the subscription",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke("manage-subscription", {
        body: {
          action: selectedAction,
          creatorId,
          pauseUntil: selectedAction === "pause" ? pauseDate : undefined,
        },
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: `Subscription ${selectedAction}d successfully`,
      });

      onActionComplete();
      onOpenChange(false);
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

  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 1);
  const minDateStr = minDate.toISOString().split("T")[0];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Manage Subscription</DialogTitle>
          <DialogDescription>
            Manage your subscription to {creatorName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="text-sm">
            <span className="text-muted-foreground">Current price: </span>
            <span className="font-semibold">${currentPrice}/month</span>
          </div>

          {!action && (
            <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => setAction("pause")}
              >
                <Pause className="w-4 h-4 mr-2" />
                Pause Subscription
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => setAction("resume")}
              >
                <Play className="w-4 h-4 mr-2" />
                Resume Subscription
              </Button>

              <Button
                variant="destructive"
                className="w-full justify-start"
                onClick={() => setAction("cancel")}
              >
                <X className="w-4 h-4 mr-2" />
                Cancel Subscription
              </Button>
            </div>
          )}

          {action === "pause" && (
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="pauseDate">Resume subscription on:</Label>
                <Input
                  id="pauseDate"
                  type="date"
                  min={minDateStr}
                  value={pauseDate}
                  onChange={(e) => setPauseDate(e.target.value)}
                />
              </div>

              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Your subscription will be paused and automatically resume on the selected date.
                  You won't be charged during the pause period.
                </AlertDescription>
              </Alert>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setAction(null)} className="flex-1">
                  Back
                </Button>
                <Button onClick={() => handleAction("pause")} disabled={loading} className="flex-1">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm Pause"}
                </Button>
              </div>
            </div>
          )}

          {action === "resume" && (
            <div className="space-y-3">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Your subscription will resume immediately and billing will continue as normal.
                </AlertDescription>
              </Alert>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setAction(null)} className="flex-1">
                  Back
                </Button>
                <Button onClick={() => handleAction("resume")} disabled={loading} className="flex-1">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm Resume"}
                </Button>
              </div>
            </div>
          )}

          {action === "cancel" && (
            <div className="space-y-3">
              <Alert variant="destructive">
                <AlertDescription>
                  Your subscription will be cancelled at the end of the current billing period.
                  You'll retain access until then.
                </AlertDescription>
              </Alert>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setAction(null)} className="flex-1">
                  Back
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleAction("cancel")}
                  disabled={loading}
                  className="flex-1"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm Cancel"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SubscriptionManagement;

import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { logError, getUserFriendlyError } from "@/lib/error-logger";

interface RefundRequestProps {
  subscriptionId: string;
  amount: number;
  onSuccess?: () => void;
}

export const RefundRequest = ({ subscriptionId, amount, onSuccess }: RefundRequestProps) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [reason, setReason] = useState("");

  const handleSubmit = async () => {
    if (!reason.trim()) {
      toast({
        title: "Error",
        description: "Please provide a reason for the refund request",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("refund_requests")
        .insert({
          user_id: user.id,
          subscription_id: subscriptionId,
          amount_requested: amount,
          reason: reason.trim(),
        });

      if (error) throw error;

      toast({
        title: "Request Submitted",
        description: "Your refund request has been submitted and will be reviewed by our team.",
      });

      setOpen(false);
      setReason("");
      onSuccess?.();
    } catch (error) {
      logError(error, 'RefundRequest.handleSubmit');
      toast({
        title: "Error",
        description: getUserFriendlyError(error),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Request Refund
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Request Refund</DialogTitle>
          <DialogDescription>
            Please provide a reason for your refund request. Our team will review it within 2-3 business days.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium mb-2">Refund Amount</p>
            <p className="text-2xl font-bold">${amount.toFixed(2)}</p>
          </div>

          <div>
            <label htmlFor="reason" className="text-sm font-medium">
              Reason for Refund
            </label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Please explain why you're requesting a refund..."
              className="mt-2"
              rows={4}
            />
          </div>

          <div className="flex gap-2">
            <Button onClick={handleSubmit} disabled={loading} className="flex-1">
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Submit Request
            </Button>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

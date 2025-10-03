import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface BlockUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  displayName: string;
  onBlockSuccess?: () => void;
}

export const BlockUserDialog = ({
  open,
  onOpenChange,
  userId,
  displayName,
  onBlockSuccess,
}: BlockUserDialogProps) => {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleBlock = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to block users",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from("blocked_users")
        .insert({
          blocker_id: user.id,
          blocked_id: userId,
          reason: reason.trim() || null,
        });

      if (error) throw error;

      toast({
        title: "User blocked",
        description: `${displayName} has been blocked successfully`,
      });

      onBlockSuccess?.();
      onOpenChange(false);
      setReason("");
    } catch (error: any) {
      console.error("Error blocking user:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to block user",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <ConfirmDialog
        open={open}
        onOpenChange={onOpenChange}
        title={`Block ${displayName}?`}
        description="This will prevent you from seeing each other's profiles and messages."
        confirmLabel="Block User"
        cancelLabel="Cancel"
        onConfirm={handleBlock}
        variant="destructive"
        loading={loading}
      />
      {open && (
        <div className="mt-4 space-y-2">
          <Label htmlFor="reason">Reason (optional)</Label>
          <Textarea
            id="reason"
            placeholder="Why are you blocking this user?"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
          />
        </div>
      )}
    </>
  );
};

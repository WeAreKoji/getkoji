import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MessageSquare, AlertTriangle, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface BulkMessageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subscriberCount: number;
  onSend: (message: string) => Promise<void>;
}

export const BulkMessageDialog = ({
  open,
  onOpenChange,
  subscriberCount,
  onSend,
}: BulkMessageDialogProps) => {
  const { toast } = useToast();
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (!message.trim()) {
      toast({
        title: "Message Required",
        description: "Please enter a message to send",
        variant: "destructive",
      });
      return;
    }

    if (message.length > 500) {
      toast({
        title: "Message Too Long",
        description: "Message must be 500 characters or less",
        variant: "destructive",
      });
      return;
    }

    setSending(true);
    try {
      await onSend(message);
      toast({
        title: "Messages Sent!",
        description: `Your message was sent to ${subscriberCount} subscribers`,
      });
      setMessage("");
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Send Failed",
        description: error instanceof Error ? error.message : "Failed to send messages",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Message All Subscribers
          </DialogTitle>
          <DialogDescription>
            Send a message to all {subscriberCount} active subscribers
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              This will send a notification to all active subscribers. Use responsibly to avoid spam.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              placeholder="Write your message here..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              maxLength={500}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground text-right">
              {message.length}/500 characters
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={sending}>
            Cancel
          </Button>
          <Button onClick={handleSend} disabled={sending || !message.trim()}>
            {sending ? (
              <>Sending...</>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Send to {subscriberCount} Subscribers
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

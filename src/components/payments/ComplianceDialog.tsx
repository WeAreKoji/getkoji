import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { logError, getUserFriendlyError } from "@/lib/error-logger";

interface ComplianceDialogProps {
  documentType: "terms_of_service" | "privacy_policy" | "creator_agreement";
  documentVersion: string;
  title: string;
  content: string;
  onAccept?: () => void;
}

export const ComplianceDialog = ({
  documentType,
  documentVersion,
  title,
  content,
  onAccept,
}: ComplianceDialogProps) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasAccepted, setHasAccepted] = useState(false);

  useEffect(() => {
    checkAcceptance();
  }, [documentType, documentVersion]);

  const checkAcceptance = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase.rpc("has_accepted_compliance", {
        _user_id: user.id,
        _document_type: documentType,
        _document_version: documentVersion,
      });

      setHasAccepted(data || false);
    } catch (error) {
      logError(error, 'ComplianceDialog.checkAcceptance');
    }
  };

  const handleAccept = async () => {
    if (!accepted) {
      toast({
        title: "Error",
        description: "Please check the box to accept the terms",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke("accept-compliance", {
        body: {
          documentType,
          documentVersion,
        },
      });

      if (error) throw error;

      toast({
        title: "Accepted",
        description: `You have accepted the ${title}`,
      });

      setHasAccepted(true);
      setOpen(false);
      onAccept?.();
    } catch (error) {
      logError(error, 'ComplianceDialog.handleAccept');
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
      <Button
        variant="outline"
        onClick={() => setOpen(true)}
        disabled={hasAccepted}
      >
        {hasAccepted ? "✓ Accepted" : `Review ${title}`}
      </Button>

      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>Version {documentVersion}</DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[400px] rounded-md border p-4">
          <div
            className="prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        </ScrollArea>

        <div className="flex items-start gap-2">
          <Checkbox
            id="accept"
            checked={accepted}
            onCheckedChange={(checked) => setAccepted(checked as boolean)}
          />
          <label
            htmlFor="accept"
            className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            I have read and agree to the {title}
          </label>
        </div>

        <div className="flex gap-2">
          <Button onClick={handleAccept} disabled={loading || !accepted} className="flex-1">
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Accept
          </Button>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

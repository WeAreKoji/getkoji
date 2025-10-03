import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { logError } from "@/lib/error-logger";

interface ReportProfileDialogProps {
  userId: string;
  displayName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const REPORT_CATEGORIES = [
  { value: "spam", label: "Spam or Scam" },
  { value: "harassment", label: "Harassment or Bullying" },
  { value: "inappropriate_content", label: "Inappropriate Content" },
  { value: "fake_profile", label: "Fake Profile" },
  { value: "underage", label: "Underage User" },
  { value: "other", label: "Other" },
];

export const ReportProfileDialog = ({
  userId,
  displayName,
  open,
  onOpenChange,
}: ReportProfileDialogProps) => {
  const [category, setCategory] = useState<string>("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!category) {
      toast({
        title: "Category required",
        description: "Please select a report category",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase.rpc("create_content_report", {
        _content_type: "profile",
        _content_id: userId,
        _report_category: category,
        _description: description || null,
      });

      if (error) throw error;

      toast({
        title: "Report submitted",
        description: "Thank you for helping keep our community safe",
      });
      
      onOpenChange(false);
      setCategory("");
      setDescription("");
    } catch (error) {
      logError(error, "ReportProfileDialog.handleSubmit");
      toast({
        title: "Error",
        description: "Failed to submit report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Report {displayName}'s Profile</DialogTitle>
          <DialogDescription>
            Help us understand what's wrong with this profile
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="category">Category *</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="category">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {REPORT_CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Additional Details (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Please provide any additional information..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Submit Report
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

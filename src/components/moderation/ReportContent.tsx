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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Flag, Loader2 } from "lucide-react";
import { logError, getUserFriendlyError } from "@/lib/error-logger";

interface ReportContentProps {
  contentType: "post" | "message" | "profile" | "comment";
  contentId: string;
  onSuccess?: () => void;
}

const REPORT_CATEGORIES = [
  { value: "harassment", label: "Harassment or Bullying" },
  { value: "spam", label: "Spam or Scam" },
  { value: "inappropriate_content", label: "Inappropriate Content" },
  { value: "false_information", label: "False Information" },
  { value: "violence", label: "Violence or Threats" },
  { value: "hate_speech", label: "Hate Speech" },
  { value: "other", label: "Other" },
];

export const ReportContent = ({ contentType, contentId, onSuccess }: ReportContentProps) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = async () => {
    if (!category) {
      toast({
        title: "Error",
        description: "Please select a report category",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.rpc("create_content_report", {
        _content_type: contentType,
        _content_id: contentId,
        _report_category: category,
        _description: description.trim() || null,
      });

      if (error) throw error;

      toast({
        title: "Report Submitted",
        description: "Thank you for helping keep our community safe. We'll review this report shortly.",
      });

      setOpen(false);
      setCategory("");
      setDescription("");
      onSuccess?.();
    } catch (error) {
      logError(error, 'ReportContent.handleSubmit');
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
        <Button variant="ghost" size="sm">
          <Flag className="w-4 h-4 mr-2" />
          Report
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Report Content</DialogTitle>
          <DialogDescription>
            Help us maintain a safe community by reporting violations
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Report Category</label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="mt-2">
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

          <div>
            <label htmlFor="description" className="text-sm font-medium">
              Additional Details (Optional)
            </label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide more context about this report..."
              className="mt-2"
              rows={4}
            />
          </div>

          <div className="flex gap-2">
            <Button onClick={handleSubmit} disabled={loading} className="flex-1">
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Submit Report
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

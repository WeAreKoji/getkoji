import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Calendar as CalendarIcon, Clock } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface ScheduledPost {
  id: string;
  content: string | null;
  scheduled_publish_at: string;
  media_type: string | null;
  media_url: string | null;
}

interface PostSchedulingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  creatorId: string;
  onSuccess?: () => void;
  editPost?: ScheduledPost | null;
}

export const PostSchedulingDialog = ({ open, onOpenChange, creatorId, onSuccess, editPost }: PostSchedulingDialogProps) => {
  const [content, setContent] = useState("");
  const [date, setDate] = useState<Date>();
  const [time, setTime] = useState("12:00");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Populate form when editing
  useEffect(() => {
    if (editPost) {
      setContent(editPost.content || "");
      const scheduledDate = new Date(editPost.scheduled_publish_at);
      setDate(scheduledDate);
      setTime(format(scheduledDate, "HH:mm"));
    } else {
      setContent("");
      setDate(undefined);
      setTime("12:00");
    }
  }, [editPost, open]);

  const handleSchedule = async () => {
    if (!content.trim()) {
      toast.error("Please enter post content");
      return;
    }

    if (!date) {
      toast.error("Please select a date");
      return;
    }

    // Combine date and time
    const [hours, minutes] = time.split(':').map(Number);
    const scheduledDateTime = new Date(date);
    scheduledDateTime.setHours(hours, minutes, 0, 0);

    // Check if scheduled time is in the future
    if (scheduledDateTime <= new Date()) {
      toast.error("Scheduled time must be in the future");
      return;
    }

    setIsSubmitting(true);

    try {
      if (editPost) {
        // Update existing post
        const { error } = await supabase
          .from('creator_posts')
          .update({
            content,
            scheduled_publish_at: scheduledDateTime.toISOString(),
          })
          .eq('id', editPost.id);

        if (error) throw error;
        toast.success("Scheduled post updated successfully!");
      } else {
        // Create new post
        const { error } = await supabase.from('creator_posts').insert({
          creator_id: creatorId,
          content,
          scheduled_publish_at: scheduledDateTime.toISOString(),
          status: 'scheduled',
          media_type: 'text'
        });

        if (error) throw error;
        toast.success("Post scheduled successfully!");
      }

      setContent("");
      setDate(undefined);
      setTime("12:00");
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error("Error scheduling post:", error);
      toast.error(editPost ? "Failed to update post" : "Failed to schedule post");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{editPost ? "Edit Scheduled Post" : "Schedule Post"}</DialogTitle>
          <DialogDescription>
            {editPost 
              ? "Update the post content and schedule time" 
              : "Create a post to be published automatically at a future date and time"
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="content">Post Content</Label>
            <Textarea
              id="content"
              placeholder="What would you like to share with your subscribers?"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={6}
              className="resize-none"
            />
            <p className="text-sm text-muted-foreground">
              {content.length} characters
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Schedule Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    disabled={(date) => date < new Date()}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="time">Schedule Time</Label>
              <Select value={time} onValueChange={setTime}>
                <SelectTrigger id="time">
                  <Clock className="mr-2 h-4 w-4" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 24 }, (_, i) => {
                    const hour = i.toString().padStart(2, '0');
                    return (
                      <SelectItem key={`${hour}:00`} value={`${hour}:00`}>
                        {hour}:00
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>

          {date && (
            <div className="rounded-lg bg-muted p-3 text-sm">
              <p className="font-medium">Post will be published on:</p>
              <p className="text-muted-foreground">
                {format(date, "PPPP")} at {time}
              </p>
            </div>
          )}

          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSchedule}
              disabled={isSubmitting || !content.trim() || !date}
            >
              {isSubmitting 
                ? (editPost ? "Updating..." : "Scheduling...") 
                : (editPost ? "Update Post" : "Schedule Post")
              }
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

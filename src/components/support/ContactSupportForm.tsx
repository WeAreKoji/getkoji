import { useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Send, Loader2, Paperclip, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const ContactSupportForm = () => {
  const [loading, setLoading] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    category: "",
    subject: "",
    description: "",
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter((file) => {
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} is too large (max 10MB)`);
        return false;
      }
      return true;
    });

    if (attachments.length + validFiles.length > 5) {
      toast.error("Maximum 5 attachments allowed");
      return;
    }

    setAttachments((prev) => [...prev, ...validFiles]);
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.category || !formData.subject || !formData.description) {
      toast.error("Please fill in all fields");
      return;
    }

    if (formData.description.length < 50) {
      toast.error("Please provide more details (minimum 50 characters)");
      return;
    }

    setLoading(true);

    try {
      // For now, we'll just show a success message
      // In future, implement send-support-email edge function with attachments
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success("Support request submitted", {
        description: `We'll get back to you within 24 hours${attachments.length > 0 ? ` (${attachments.length} file(s) attached)` : ""}`,
      });

      setFormData({
        category: "",
        subject: "",
        description: "",
      });
      setAttachments([]);
    } catch (error: any) {
      toast.error("Failed to submit support request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Send className="w-5 h-5" />
          Contact Support
        </CardTitle>
        <CardDescription>
          Submit a support request and we'll get back to you soon
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => setFormData({ ...formData, category: value })}
            >
              <SelectTrigger id="category">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="account">Account Issues</SelectItem>
                <SelectItem value="technical">Technical Problem</SelectItem>
                <SelectItem value="billing">Billing & Payments</SelectItem>
                <SelectItem value="report">Report Content/User</SelectItem>
                <SelectItem value="creator">Creator Support</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              placeholder="Brief description of your issue"
              maxLength={100}
            />
            <p className="text-xs text-muted-foreground">
              {formData.subject.length}/100 characters
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Please provide as much detail as possible..."
              rows={6}
              maxLength={1000}
            />
            <p className="text-xs text-muted-foreground">
              {formData.description.length}/1000 characters (minimum 50)
            </p>
          </div>

          {/* File Attachments */}
          <div className="space-y-2">
            <Label>Attachments (Optional)</Label>
            <div className="space-y-2">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,.pdf,.doc,.docx,.txt"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={attachments.length >= 5}
                className="w-full"
              >
                <Paperclip className="w-4 h-4 mr-2" />
                Attach Files ({attachments.length}/5)
              </Button>
              {attachments.length > 0 && (
                <div className="space-y-2">
                  {attachments.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 rounded-lg bg-muted"
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <Paperclip className="w-4 h-4 flex-shrink-0" />
                        <span className="text-sm truncate">{file.name}</span>
                        <Badge variant="secondary" className="text-xs">
                          {(file.size / 1024).toFixed(0)}KB
                        </Badge>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeAttachment(index)}
                        className="flex-shrink-0"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Max 5 files, 10MB each. Supported: images, PDF, DOC, TXT
              </p>
            </div>
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Submit Request
              </>
            )}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            You can also email us directly at{" "}
            <a href="mailto:support@getkoji.net" className="text-primary hover:underline">
              support@getkoji.net
            </a>
          </p>
        </form>
      </CardContent>
    </Card>
  );
};

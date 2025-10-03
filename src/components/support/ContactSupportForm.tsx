import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Send, Loader2 } from "lucide-react";

export const ContactSupportForm = () => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    category: "",
    subject: "",
    description: "",
  });

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
      // In Phase 2, we'll implement the send-support-email edge function
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success("Support request submitted", {
        description: "We'll get back to you within 24 hours at support@getkoji.net",
      });

      setFormData({
        category: "",
        subject: "",
        description: "",
      });
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

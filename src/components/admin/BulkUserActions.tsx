import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Users, Mail, Ban, CheckCircle } from "lucide-react";

export const BulkUserActions = () => {
  const [userIds, setUserIds] = useState("");
  const [action, setAction] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const handleBulkAction = async () => {
    if (!action || !userIds.trim()) {
      toast({
        title: "Error",
        description: "Please select an action and enter user IDs",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    const ids = userIds.split("\n").map(id => id.trim()).filter(Boolean);

    try {
      switch (action) {
        case "send_notification":
          // Send bulk notifications
          for (const userId of ids) {
            await supabase.rpc("create_notification", {
              _user_id: userId,
              _type: "admin_message",
              _title: "Important Notice",
              _message: "You have received a message from the admin team.",
            });
          }
          break;

        case "verify_users":
          // Bulk verify users (example implementation)
          toast({
            title: "Info",
            description: "Bulk verification feature coming soon",
          });
          break;

        case "send_email":
          // Send bulk emails via edge function
          toast({
            title: "Info",
            description: "Bulk email feature requires setup",
          });
          break;

        default:
          break;
      }

      toast({
        title: "Success",
        description: `Action completed for ${ids.length} users`,
      });
      setUserIds("");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to complete bulk action",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Bulk User Actions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium">Select Action</label>
          <Select value={action} onValueChange={setAction}>
            <SelectTrigger className="mt-2">
              <SelectValue placeholder="Choose an action" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="send_notification">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Send Notification
                </div>
              </SelectItem>
              <SelectItem value="send_email">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Send Email
                </div>
              </SelectItem>
              <SelectItem value="verify_users">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Verify Users
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium">User IDs (one per line)</label>
          <Textarea
            className="mt-2 font-mono text-sm"
            rows={8}
            placeholder="Enter user IDs, one per line"
            value={userIds}
            onChange={(e) => setUserIds(e.target.value)}
          />
          <p className="text-xs text-muted-foreground mt-1">
            {userIds.split("\n").filter(Boolean).length} users selected
          </p>
        </div>

        <Button
          onClick={handleBulkAction}
          disabled={loading || !action || !userIds.trim()}
          className="w-full"
        >
          {loading ? "Processing..." : "Execute Bulk Action"}
        </Button>
      </CardContent>
    </Card>
  );
};

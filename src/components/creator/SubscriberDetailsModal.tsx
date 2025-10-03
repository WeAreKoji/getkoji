import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { MessageSquare, Calendar, DollarSign, Activity } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { useNavigate } from "react-router-dom";

interface SubscriberDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subscriberId: string;
  subscriptionId: string;
}

interface SubscriberDetails {
  profile: {
    display_name: string;
    avatar_url: string | null;
    email: string;
    bio: string | null;
    created_at: string;
  };
  subscription: {
    status: string;
    started_at: string;
    expires_at: string | null;
    stripe_subscription_id: string;
  };
  transactions: Array<{
    id: string;
    amount: number;
    status: string;
    created_at: string;
    transaction_type: string;
  }>;
  matchExists: boolean;
}

export const SubscriberDetailsModal = ({
  open,
  onOpenChange,
  subscriberId,
  subscriptionId,
}: SubscriberDetailsModalProps) => {
  const [details, setDetails] = useState<SubscriberDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (open && subscriberId) {
      fetchDetails();
    }
  }, [open, subscriberId, subscriptionId]);

  const fetchDetails = async () => {
    try {
      setLoading(true);

      // Fetch profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name, avatar_url, email, bio, created_at")
        .eq("id", subscriberId)
        .single();

      // Fetch subscription details
      const { data: subscription } = await supabase
        .from("subscriptions")
        .select("status, started_at, expires_at, stripe_subscription_id")
        .eq("id", subscriptionId)
        .maybeSingle();

      // Fetch transaction history
      const { data: transactions } = await supabase
        .from("payment_transactions")
        .select("id, amount, status, created_at, transaction_type")
        .eq("user_id", subscriberId)
        .eq("subscription_id", subscriptionId)
        .order("created_at", { ascending: false })
        .limit(10);

      // Check if match exists for messaging
      const { data: user } = await supabase.auth.getUser();
      const { data: match } = await supabase
        .from("matches")
        .select("id")
        .or(
          `and(user1_id.eq.${user.user?.id},user2_id.eq.${subscriberId}),and(user1_id.eq.${subscriberId},user2_id.eq.${user.user?.id})`
        )
        .maybeSingle();

      setDetails({
        profile: profile || {
          display_name: "Unknown",
          avatar_url: null,
          email: "",
          bio: null,
          created_at: new Date().toISOString(),
        },
        subscription: subscription ? {
          status: subscription.status,
          started_at: subscription.started_at,
          expires_at: subscription.expires_at,
          stripe_subscription_id: subscription.stripe_subscription_id,
        } : {
          status: "unknown",
          started_at: new Date().toISOString(),
          expires_at: null,
          stripe_subscription_id: "",
        },
        transactions: transactions || [],
        matchExists: !!match,
      });
    } catch (error) {
      console.error("Error fetching subscriber details:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleMessage = () => {
    if (details?.matchExists) {
      navigate("/chat");
    } else {
      // Could show a dialog explaining they need to match first
      alert("You need to match with this user to send messages");
    }
  };

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <LoadingSpinner />
        </DialogContent>
      </Dialog>
    );
  }

  if (!details) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Subscriber Details</DialogTitle>
        </DialogHeader>

        {/* Profile Header */}
        <div className="flex items-center gap-4 pb-4 border-b">
          <Avatar className="w-16 h-16">
            <AvatarImage src={details.profile.avatar_url || undefined} />
            <AvatarFallback>
              {details.profile.display_name?.charAt(0) || "?"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h3 className="text-lg font-semibold">{details.profile.display_name}</h3>
            <p className="text-sm text-muted-foreground">{details.profile.email}</p>
            <Badge className="mt-1" variant={details.subscription.status === "active" ? "default" : "secondary"}>
              {details.subscription.status}
            </Badge>
          </div>
          <Button onClick={handleMessage} disabled={!details.matchExists}>
            <MessageSquare className="w-4 h-4 mr-2" />
            Message
          </Button>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <h4 className="font-semibold">Subscription Info</h4>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Started:</span>
                  <span className="font-medium">
                    {format(new Date(details.subscription.started_at), "MMM dd, yyyy")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Duration:</span>
                  <span className="font-medium">
                    {formatDistanceToNow(new Date(details.subscription.started_at))}
                  </span>
                </div>
                {details.subscription.expires_at && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Expires:</span>
                    <span className="font-medium">
                      {format(new Date(details.subscription.expires_at), "MMM dd, yyyy")}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Stripe ID:</span>
                  <span className="font-mono text-xs">
                    {details.subscription.stripe_subscription_id.slice(0, 20)}...
                  </span>
                </div>
              </div>
            </Card>

            {details.profile.bio && (
              <Card className="p-4">
                <h4 className="font-semibold mb-2">About</h4>
                <p className="text-sm text-muted-foreground">{details.profile.bio}</p>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="payments" className="space-y-3">
            <div className="flex items-center gap-2 mb-3">
              <DollarSign className="w-4 h-4 text-muted-foreground" />
              <h4 className="font-semibold">Payment History</h4>
            </div>
            {details.transactions.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No transactions yet</p>
            ) : (
              details.transactions.map((transaction) => (
                <Card key={transaction.id} className="p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium capitalize">
                        {transaction.transaction_type.replace("_", " ")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(transaction.created_at), "MMM dd, yyyy HH:mm")}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">${transaction.amount.toFixed(2)}</p>
                      <Badge
                        variant={
                          transaction.status === "succeeded"
                            ? "default"
                            : transaction.status === "failed"
                            ? "destructive"
                            : "secondary"
                        }
                      >
                        {transaction.status}
                      </Badge>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="activity" className="space-y-3">
            <div className="flex items-center gap-2 mb-3">
              <Activity className="w-4 h-4 text-muted-foreground" />
              <h4 className="font-semibold">Activity Timeline</h4>
            </div>
            <Card className="p-3">
              <div className="space-y-3">
                <div className="flex gap-3">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                  <div>
                    <p className="text-sm font-medium">Subscribed</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(details.subscription.started_at), "MMM dd, yyyy")}
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-2 h-2 rounded-full bg-muted mt-2" />
                  <div>
                    <p className="text-sm font-medium">Profile Created</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(details.profile.created_at), "MMM dd, yyyy")}
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Users } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface Subscriber {
  id: string;
  subscriber_id: string;
  status: string;
  stripe_subscription_id: string;
  subscription_end: string | null;
  profile: {
    display_name: string;
    avatar_url: string | null;
    email: string;
    created_at: string;
  };
}

interface SubscriberListProps {
  creatorId: string;
  limit?: number;
}

export const SubscriberList = ({ creatorId, limit = 10 }: SubscriberListProps) => {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchSubscribers();
  }, [creatorId]);

  const fetchSubscribers = async () => {
    try {
      const { data, error } = await supabase
        .from("subscriptions")
        .select(`
          id,
          subscriber_id,
          status,
          stripe_subscription_id,
          subscription_end,
          profiles!subscriptions_subscriber_id_fkey (
            display_name,
            avatar_url,
            email,
            created_at
          )
        `)
        .eq("creator_id", creatorId)
        .order("subscription_end", { ascending: false })
        .limit(limit);

      if (error) throw error;
      
      setSubscribers(data?.map((sub: any) => ({
        id: sub.id,
        subscriber_id: sub.subscriber_id,
        status: sub.status,
        stripe_subscription_id: sub.stripe_subscription_id,
        subscription_end: sub.subscription_end,
        profile: Array.isArray(sub.profiles) ? sub.profiles[0] : sub.profiles
      })) || []);
    } catch (error) {
      console.error("Error fetching subscribers:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredSubscribers = subscribers.filter(sub =>
    sub.profile?.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sub.profile?.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <LoadingSpinner />;

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">Recent Subscribers</h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/subscriber-management")}
        >
          View All
        </Button>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search subscribers..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="space-y-3">
        {filteredSubscribers.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No subscribers found
          </p>
        ) : (
          filteredSubscribers.map((subscriber) => (
            <div
              key={subscriber.id}
              className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={subscriber.profile?.avatar_url || undefined} />
                  <AvatarFallback>
                    {subscriber.profile?.display_name?.charAt(0) || "?"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{subscriber.profile?.display_name}</p>
                  <p className="text-sm text-muted-foreground">
                    Joined {formatDistanceToNow(new Date(subscriber.profile?.created_at || new Date()), { addSuffix: true })}
                  </p>
                </div>
              </div>
              <Badge variant={subscriber.status === "active" ? "default" : "secondary"}>
                {subscriber.status}
              </Badge>
            </div>
          ))
        )}
      </div>
    </Card>
  );
};

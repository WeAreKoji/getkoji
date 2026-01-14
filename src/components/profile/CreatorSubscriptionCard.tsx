import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, FileText, DollarSign, Sparkles, Lock, Loader2, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { logError } from "@/lib/error-logger";
import { useToast } from "@/hooks/use-toast";

interface CreatorSubscriptionCardProps {
  creatorId: string;
  isOwnProfile: boolean;
}

export const CreatorSubscriptionCard = ({ creatorId, isOwnProfile }: CreatorSubscriptionCardProps) => {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(false);
  const [subscriptionPrice, setSubscriptionPrice] = useState<number>(0);
  const [subscriberCount, setSubscriberCount] = useState<number>(0);
  const [postCount, setPostCount] = useState<number>(0);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [hasStripeSetup, setHasStripeSetup] = useState(true);

  useEffect(() => {
    fetchCreatorData();
  }, [creatorId]);

  const fetchCreatorData = async () => {
    try {
      // Fetch creator profile including stripe_price_id
      const { data: creatorProfile } = await supabase
        .from("creator_profiles")
        .select("subscription_price, subscriber_count, stripe_price_id")
        .eq("user_id", creatorId)
        .single();

      if (creatorProfile) {
        setSubscriptionPrice(parseFloat(String(creatorProfile.subscription_price)));
        setSubscriberCount(creatorProfile.subscriber_count || 0);
        setHasStripeSetup(!!creatorProfile.stripe_price_id);
      }

      // Fetch post count
      const { count } = await supabase
        .from("creator_posts")
        .select("id", { count: "exact", head: true })
        .eq("creator_id", creatorId);

      setPostCount(count || 0);

      // Check if user is subscribed (if not own profile)
      if (!isOwnProfile) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: subscription } = await supabase
            .from("subscriptions")
            .select("id")
            .eq("subscriber_id", user.id)
            .eq("creator_id", creatorId)
            .eq("status", "active")
            .maybeSingle();

          setIsSubscribed(!!subscription);
        }
      }
    } catch (error) {
      logError(error, 'CreatorSubscriptionCard.fetchCreatorData');
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async () => {
    setSubscribing(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { creatorId }
      });
      
      if (error) {
        throw new Error(error.message || "Failed to create checkout session");
      }
      
      if (data?.url) {
        window.open(data.url, "_blank");
      } else if (data?.error) {
        // Handle specific error messages from the function
        if (data.error.includes("Creator price not found")) {
          toast({
            title: "Subscription Not Available",
            description: "This creator hasn't completed their payment setup yet. Please try again later.",
            variant: "destructive",
          });
        } else {
          throw new Error(data.error);
        }
      } else {
        throw new Error("No checkout URL received");
      }
    } catch (error: any) {
      logError(error, 'CreatorSubscriptionCard.handleSubscribe');
      toast({
        title: "Subscription Error",
        description: error.message || "Unable to start subscription. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubscribing(false);
    }
  };

  if (loading) {
    return (
      <Card className="p-4 md:p-6">
        <Skeleton className="h-32 w-full" />
      </Card>
    );
  }

  return (
    <Card className={cn(
      "p-4 md:p-6 bg-gradient-to-br from-primary/5 to-secondary/5",
      "border-primary/20"
    )}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-base md:text-lg">Creator Content</h3>
          </div>
          <Badge variant="default" className="text-xs md:text-sm">
            ${subscriptionPrice}/month
          </Badge>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 md:gap-4">
          <div className="flex items-center gap-2 text-sm md:text-base">
            <Users className="w-4 h-4 text-primary" />
            <div>
              <p className="font-semibold">{subscriberCount}</p>
              <p className="text-xs text-muted-foreground">Subscribers</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm md:text-base">
            <FileText className="w-4 h-4 text-secondary" />
            <div>
              <p className="font-semibold">{postCount}</p>
              <p className="text-xs text-muted-foreground">Posts</p>
            </div>
          </div>
        </div>

        {/* Benefits */}
        {!isOwnProfile && hasStripeSetup && (
          <div className="space-y-2 pt-2 border-t border-border">
            <p className="text-sm font-medium">What you'll get:</p>
            <ul className="space-y-1.5">
              <li className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground">
                <Lock className="w-3.5 h-3.5" />
                Access to {postCount}+ exclusive posts
              </li>
              <li className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground">
                <Sparkles className="w-3.5 h-3.5" />
                Premium content and updates
              </li>
              <li className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground">
                <Users className="w-3.5 h-3.5" />
                Support this creator directly
              </li>
            </ul>
          </div>
        )}

        {/* Subscription not available message */}
        {!isOwnProfile && !hasStripeSetup && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border border-border">
            <AlertCircle className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <p className="text-xs text-muted-foreground">
              Subscriptions coming soon for this creator
            </p>
          </div>
        )}

        {/* CTA */}
        {!isOwnProfile && (
          <Button 
            onClick={handleSubscribe}
            className="w-full h-11 text-sm font-semibold"
            variant={isSubscribed ? "outline" : "default"}
            disabled={isSubscribed || subscribing || !hasStripeSetup}
          >
            {isSubscribed ? (
              <>
                <DollarSign className="w-4 h-4 mr-2" />
                Subscribed
              </>
            ) : subscribing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Starting checkout...
              </>
            ) : !hasStripeSetup ? (
              <>
                <AlertCircle className="w-4 h-4 mr-2" />
                Coming Soon
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Subscribe for ${subscriptionPrice}/month
              </>
            )}
          </Button>
        )}

        {isOwnProfile && (
          <div className="pt-2 border-t border-border">
            <p className="text-xs text-muted-foreground text-center">
              Manage your creator settings in the Dashboard
            </p>
          </div>
        )}
      </div>
    </Card>
  );
};

import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Loader2, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import BottomNav from "@/components/navigation/BottomNav";

interface Subscription {
  id: string;
  creator_id: string;
  status: string;
  expires_at: string | null;
  creator_profile: {
    subscription_price: number;
  };
  profile: {
    display_name: string;
    avatar_url: string | null;
  };
}

const Subscriptions = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [managingPortal, setManagingPortal] = useState(false);

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data, error } = await supabase
        .from("subscriptions")
        .select(`
          id,
          creator_id,
          status,
          expires_at
        `)
        .eq("subscriber_id", user.id)
        .eq("status", "active")
        .order("started_at", { ascending: false });

      if (error) throw error;

      // Fetch creator profiles and profiles separately
      const enrichedData = await Promise.all(
        (data || []).map(async (sub) => {
          const [creatorProfileResult, profileResult] = await Promise.all([
            supabase
              .from("creator_profiles")
              .select("subscription_price")
              .eq("user_id", sub.creator_id)
              .single(),
            supabase
              .from("profiles")
              .select("display_name, avatar_url")
              .eq("id", sub.creator_id)
              .single(),
          ]);

          return {
            ...sub,
            creator_profile: creatorProfileResult.data || { subscription_price: 0 },
            profile: profileResult.data || { display_name: "Unknown", avatar_url: null },
          };
        })
      );

      setSubscriptions(enrichedData);
    } catch (error) {
      console.error("Error fetching subscriptions:", error);
      toast({
        title: "Error",
        description: "Failed to load subscriptions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    setManagingPortal(true);
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal");

      if (error) throw error;

      if (data.url) {
        window.open(data.url, "_blank");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to open customer portal",
        variant: "destructive",
      });
    } finally {
      setManagingPortal(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="container max-w-2xl mx-auto">
        {/* Header */}
        <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border z-10 px-4 py-4">
          <div className="flex items-center gap-4">
            <Link to="/profile">
              <ArrowLeft className="w-6 h-6 text-foreground hover:text-primary transition-colors" />
            </Link>
            <h1 className="text-xl font-semibold">My Subscriptions</h1>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {subscriptions.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground mb-4">You don't have any active subscriptions</p>
              <Button onClick={() => navigate("/creators")}>
                Browse Creators
              </Button>
            </Card>
          ) : (
            <>
              {subscriptions.map((sub) => (
                <Card key={sub.id} className="p-4">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {sub.profile.avatar_url && (
                        <img
                          src={sub.profile.avatar_url}
                          alt={sub.profile.display_name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      )}
                      <div>
                        <h3 className="font-semibold">{sub.profile.display_name}</h3>
                        <p className="text-sm text-muted-foreground">
                          ${sub.creator_profile.subscription_price}/month
                        </p>
                      </div>
                    </div>
                    <Badge variant="default">{sub.status}</Badge>
                  </div>

                  {sub.expires_at && (
                    <p className="text-xs text-muted-foreground mb-3">
                      Next billing: {new Date(sub.expires_at).toLocaleDateString()}
                    </p>
                  )}

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/creator/${sub.creator_id}`)}
                      className="flex-1"
                    >
                      View Creator
                    </Button>
                  </div>
                </Card>
              ))}

              <Card className="p-4 bg-muted/50">
                <h3 className="font-semibold mb-2">Manage Subscriptions</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Update payment methods, view invoices, or cancel subscriptions
                </p>
                <Button
                  onClick={handleManageSubscription}
                  disabled={managingPortal}
                  className="w-full"
                >
                  {managingPortal ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Opening...
                    </>
                  ) : (
                    <>
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Manage in Stripe
                    </>
                  )}
                </Button>
              </Card>
            </>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default Subscriptions;

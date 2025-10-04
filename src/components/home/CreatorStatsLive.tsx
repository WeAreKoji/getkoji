import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { Users, TrendingUp, Sparkles, ArrowRight, CheckCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface FeaturedCreator {
  user_id: string;
  display_name: string;
  username: string | null;
  avatar_url: string | null;
  tagline: string | null;
  subscriber_count: number;
  subscription_price: number;
  id_verified: boolean;
}

export const CreatorStatsLive = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalCreators: 0,
    newThisWeek: 0,
    loading: true,
  });
  const [featuredCreators, setFeaturedCreators] = useState<FeaturedCreator[]>([]);
  const [currentFeaturedIndex, setCurrentFeaturedIndex] = useState(0);

  useEffect(() => {
    fetchCreatorStats();
    fetchFeaturedCreators();
  }, []);

  // Rotate featured creators every 5 seconds
  useEffect(() => {
    if (featuredCreators.length > 1) {
      const interval = setInterval(() => {
        setCurrentFeaturedIndex((prev) => (prev + 1) % featuredCreators.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [featuredCreators.length]);

  const fetchCreatorStats = async () => {
    try {
      // Get total creator count
      const { count: totalCount } = await supabase
        .from("creator_profiles")
        .select("*", { count: "exact", head: true });

      // Get creators from last 7 days
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      
      const { count: newCount } = await supabase
        .from("creator_profiles")
        .select("*", { count: "exact", head: true })
        .gte("created_at", weekAgo.toISOString());

      setStats({
        totalCreators: totalCount || 0,
        newThisWeek: newCount || 0,
        loading: false,
      });
    } catch (error) {
      console.error("Error fetching creator stats:", error);
      setStats((prev) => ({ ...prev, loading: false }));
    }
  };

  const fetchFeaturedCreators = async () => {
    try {
      // Get top creators by subscriber count (verified only)
      const { data } = await supabase
        .from("creator_profiles")
        .select(`
          user_id,
          tagline,
          subscriber_count,
          subscription_price,
          id_verified
        `)
        .eq("id_verified", true)
        .order("subscriber_count", { ascending: false })
        .limit(5);

      if (data && data.length > 0) {
        // Fetch profile data for these creators
        const userIds = data.map((c) => c.user_id);
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, display_name, username, avatar_url")
          .in("id", userIds);

        const featuredWithProfiles = data.map((creator) => {
          const profile = profiles?.find((p) => p.id === creator.user_id);
          return {
            ...creator,
            display_name: profile?.display_name || "Creator",
            username: profile?.username || null,
            avatar_url: profile?.avatar_url || null,
          };
        });

        setFeaturedCreators(featuredWithProfiles);
      }
    } catch (error) {
      console.error("Error fetching featured creators:", error);
    }
  };

  const currentFeatured = featuredCreators[currentFeaturedIndex];

  return (
    <section className="py-12 sm:py-16 md:py-24 px-4 sm:px-6 bg-gradient-to-b from-background to-secondary/5">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-10 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4 text-foreground">
            Join Our Growing Creator Community
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
            Real creators earning real income on Koji every day
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-8">
          {/* Total Creators Card */}
          <Card className="p-6 text-center hover:shadow-xl transition-all duration-300 border-2 hover:border-primary/50">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 mb-4">
              <Users className="w-7 h-7 text-primary" />
            </div>
            <div className="mb-2">
              {stats.loading ? (
                <Skeleton className="h-12 w-24 mx-auto" />
              ) : (
                <p className="text-4xl sm:text-5xl font-bold text-foreground animate-in fade-in zoom-in duration-700">
                  {stats.totalCreators}+
                </p>
              )}
            </div>
            <p className="text-sm sm:text-base text-muted-foreground font-medium">
              Active Creators
            </p>
          </Card>

          {/* New This Week Card */}
          <Card className="p-6 text-center hover:shadow-xl transition-all duration-300 border-2 hover:border-green-500/50 bg-gradient-to-br from-card to-green-500/5">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-green-500/10 mb-4">
              <TrendingUp className="w-7 h-7 text-green-500" />
            </div>
            <div className="mb-2">
              {stats.loading ? (
                <Skeleton className="h-12 w-24 mx-auto" />
              ) : (
                <p className="text-4xl sm:text-5xl font-bold text-foreground animate-in fade-in zoom-in duration-700 delay-100">
                  +{stats.newThisWeek}
                </p>
              )}
            </div>
            <p className="text-sm sm:text-base text-muted-foreground font-medium">
              Joined This Week
            </p>
            <Badge variant="outline" className="mt-2 bg-green-500/10 text-green-600 border-green-500/30">
              Growing Fast! 🚀
            </Badge>
          </Card>

          {/* Featured Creator Card */}
          {currentFeatured ? (
            <Card className="p-6 hover:shadow-xl transition-all duration-300 border-2 hover:border-purple-500/50 bg-gradient-to-br from-card to-purple-500/5 relative overflow-hidden">
              <div className="absolute top-2 right-2">
                <Badge className="bg-purple-500/90 text-white border-0">
                  <Sparkles className="w-3 h-3 mr-1" />
                  Featured
                </Badge>
              </div>
              
              <div className="flex flex-col items-center text-center animate-in fade-in zoom-in duration-500">
                <div className="relative mb-3">
                  {currentFeatured.avatar_url ? (
                    <img
                      src={currentFeatured.avatar_url}
                      alt={currentFeatured.display_name}
                      className="w-16 h-16 rounded-full object-cover border-2 border-purple-500/30"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-purple-500/20 flex items-center justify-center">
                      <Users className="w-8 h-8 text-purple-500" />
                    </div>
                  )}
                  {currentFeatured.id_verified && (
                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-primary rounded-full flex items-center justify-center border-2 border-card">
                      <CheckCircle className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
                
                <h3 className="font-bold text-lg mb-1">{currentFeatured.display_name}</h3>
                {currentFeatured.username && (
                  <p className="text-sm text-muted-foreground mb-2">@{currentFeatured.username}</p>
                )}
                {currentFeatured.tagline && (
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                    {currentFeatured.tagline}
                  </p>
                )}
                
                <div className="flex items-center gap-3 text-sm mb-3">
                  <span className="text-muted-foreground">
                    <strong className="text-foreground">{currentFeatured.subscriber_count}</strong> subscribers
                  </span>
                  <span className="text-muted-foreground">•</span>
                  <span className="font-semibold text-green-600">
                    ${currentFeatured.subscription_price}/mo
                  </span>
                </div>

                {featuredCreators.length > 1 && (
                  <div className="flex gap-1 mt-2">
                    {featuredCreators.map((_, idx) => (
                      <div
                        key={idx}
                        className={`h-1 w-6 rounded-full transition-all duration-300 ${
                          idx === currentFeaturedIndex ? "bg-purple-500" : "bg-muted"
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>
            </Card>
          ) : (
            <Card className="p-6 flex flex-col items-center justify-center text-center border-2 border-dashed">
              <Sparkles className="w-10 h-10 text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">Featured creators coming soon</p>
            </Card>
          )}
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <Button
            size="lg"
            onClick={() => navigate("/creators")}
            className="group"
          >
            Explore All Creators
            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
          <p className="text-sm text-muted-foreground mt-4">
            Or{" "}
            <button
              onClick={() => navigate("/creator-recruitment")}
              className="text-primary hover:underline font-semibold"
            >
              become a creator yourself
            </button>
          </p>
        </div>
      </div>
    </section>
  );
};
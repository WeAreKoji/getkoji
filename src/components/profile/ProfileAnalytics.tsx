import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Eye, Heart, MessageCircle, TrendingUp } from "lucide-react";

interface ProfileAnalyticsProps {
  userId: string;
}

interface Analytics {
  totalViews: number;
  viewsThisMonth: number;
  matchRate: number;
  responseRate: number;
}

export const ProfileAnalytics = ({ userId }: ProfileAnalyticsProps) => {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<Analytics>({
    totalViews: 0,
    viewsThisMonth: 0,
    matchRate: 0,
    responseRate: 0,
  });

  useEffect(() => {
    fetchAnalytics();
  }, [userId]);

  const fetchAnalytics = async () => {
    try {
      // Get profile views
      const { data: views } = await supabase
        .from("profile_views")
        .select("viewed_at")
        .eq("profile_id", userId);

      const now = new Date();
      const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
      const viewsThisMonth = views?.filter(
        (v) => new Date(v.viewed_at) > monthAgo
      ).length || 0;

      // Get match stats
      const { data: matches } = await supabase
        .from("matches")
        .select("id")
        .or(`user1_id.eq.${userId},user2_id.eq.${userId}`);

      const { data: swipes } = await supabase
        .from("swipes")
        .select("is_like")
        .eq("swiper_id", userId);

      const matchRate = swipes?.length
        ? ((matches?.length || 0) / swipes.length) * 100
        : 0;

      setAnalytics({
        totalViews: views?.length || 0,
        viewsThisMonth,
        matchRate: Math.round(matchRate),
        responseRate: 75, // Placeholder - would need message data
      });
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <h3 className="font-semibold mb-4">Profile Insights</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h3 className="font-semibold mb-4">Profile Insights</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Eye className="w-4 h-4" />
            <span className="text-sm">Total Views</span>
          </div>
          <p className="text-2xl font-bold">{analytics.totalViews}</p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-muted-foreground">
            <TrendingUp className="w-4 h-4" />
            <span className="text-sm">This Month</span>
          </div>
          <p className="text-2xl font-bold">{analytics.viewsThisMonth}</p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Heart className="w-4 h-4" />
            <span className="text-sm">Match Rate</span>
          </div>
          <p className="text-2xl font-bold">{analytics.matchRate}%</p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-muted-foreground">
            <MessageCircle className="w-4 h-4" />
            <span className="text-sm">Response Rate</span>
          </div>
          <p className="text-2xl font-bold">{analytics.responseRate}%</p>
        </div>
      </div>
    </Card>
  );
};

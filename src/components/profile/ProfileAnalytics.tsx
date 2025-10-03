import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Eye, Heart, MessageCircle, TrendingUp } from "lucide-react";
import { LoadingCard } from "@/components/shared/LoadingCard";
import { RetryBoundary } from "@/components/shared/RetryBoundary";
import { logError } from "@/lib/error-logger";
import { RealtimeChannel } from "@supabase/supabase-js";

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

    // Set up realtime subscription for profile views
    const channel: RealtimeChannel = supabase
      .channel('profile-views-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'profile_views',
          filter: `profile_id=eq.${userId}`
        },
        (payload) => {
          // Increment view count when new view is added
          setAnalytics(prev => ({
            ...prev,
            totalViews: prev.totalViews + 1,
            viewsThisMonth: prev.viewsThisMonth + 1,
          }));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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

      // Calculate real response rate from messages
      const { data: userMatches } = await supabase
        .from("matches")
        .select("id")
        .or(`user1_id.eq.${userId},user2_id.eq.${userId}`);

      if (userMatches && userMatches.length > 0) {
        const matchIds = userMatches.map(m => m.id);
        
        // Get messages received (others sent to user)
        const { data: receivedMessages } = await supabase
          .from("messages")
          .select("id")
          .in("match_id", matchIds)
          .neq("sender_id", userId);

        // Get messages sent (user replied)
        const { data: sentMessages } = await supabase
          .from("messages")
          .select("id")
          .in("match_id", matchIds)
          .eq("sender_id", userId);

        const responseRate = receivedMessages?.length
          ? ((sentMessages?.length || 0) / receivedMessages.length) * 100
          : 0;

        setAnalytics({
          totalViews: views?.length || 0,
          viewsThisMonth,
          matchRate: Math.round(matchRate),
          responseRate: Math.round(Math.min(responseRate, 100)),
        });
      } else {
        setAnalytics({
          totalViews: views?.length || 0,
          viewsThisMonth,
          matchRate: Math.round(matchRate),
          responseRate: 0,
        });
      }
    } catch (error) {
      logError(error, 'ProfileAnalytics.fetchAnalytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingCard showHeader={true} rows={4} />;
  }

  return (
    <RetryBoundary>
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
    </RetryBoundary>
  );
};

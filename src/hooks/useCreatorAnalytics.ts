import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { performanceMonitor } from "@/lib/performance-monitor";
import { logError } from "@/lib/error-logger";

interface CreatorAnalytics {
  subscriberCount: number;
  totalEarnings: number;
  subscriptionPrice: number;
  postCount: number;
  activeSubscriptions: number;
  avgSubscriptionDuration: number | null;
  churnRate: number | null;
  revenueGrowth: number | null;
  engagementRate: number | null;
}

export const useCreatorAnalytics = (creatorId: string | null) => {
  const [analytics, setAnalytics] = useState<CreatorAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!creatorId) {
      setLoading(false);
      return;
    }

    fetchAnalytics();
  }, [creatorId]);

  const fetchAnalytics = async () => {
    if (!creatorId) return;

    await performanceMonitor.track(
      'fetch-creator-analytics',
      async () => {
        try {
          setLoading(true);
          setError(null);

          // Fetch creator profile
          const { data: creatorProfile, error: profileError } = await supabase
            .from("creator_profiles")
            .select("*")
            .eq("user_id", creatorId)
            .single();

          if (profileError) throw profileError;

          // Fetch post count
          const { count: postCount, error: postsError } = await supabase
            .from("creator_posts")
            .select("*", { count: "exact", head: true })
            .eq("creator_id", creatorId);

          if (postsError) throw postsError;

          // Fetch active subscriptions
          const { count: activeSubscriptions, error: subsError } = await supabase
            .from("subscriptions")
            .select("*", { count: "exact", head: true })
            .eq("creator_id", creatorId)
            .eq("status", "active");

          if (subsError) throw subsError;

          // Calculate average subscription duration
          const { data: subs } = await supabase
            .from("subscriptions")
            .select("started_at, expires_at")
            .eq("creator_id", creatorId)
            .not("expires_at", "is", null);

          let avgDuration = null;
          if (subs && subs.length > 0) {
            const durations = subs.map(s => {
              const start = new Date(s.started_at).getTime();
              const end = new Date(s.expires_at!).getTime();
              return (end - start) / (1000 * 60 * 60 * 24); // days
            });
            avgDuration = durations.reduce((sum, d) => sum + d, 0) / durations.length;
          }

          // Calculate churn rate (last 30 days)
          const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
          const { count: canceledCount } = await supabase
            .from("subscriptions")
            .select("*", { count: "exact", head: true })
            .eq("creator_id", creatorId)
            .eq("status", "canceled")
            .gte("expires_at", thirtyDaysAgo);

          const churnRate = activeSubscriptions && activeSubscriptions > 0
            ? ((canceledCount || 0) / (activeSubscriptions + (canceledCount || 0))) * 100
            : null;

          // Calculate revenue growth (comparing last month to previous month)
          const lastMonth = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
          const twoMonthsAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString();

          const { data: lastMonthRevenue } = await supabase
            .from("platform_revenue")
            .select("creator_earnings")
            .eq("creator_id", creatorId)
            .gte("created_at", lastMonth);

          const { data: previousMonthRevenue } = await supabase
            .from("platform_revenue")
            .select("creator_earnings")
            .eq("creator_id", creatorId)
            .gte("created_at", twoMonthsAgo)
            .lt("created_at", lastMonth);

          const lastMonthTotal = lastMonthRevenue?.reduce((sum, r) => sum + Number(r.creator_earnings), 0) || 0;
          const previousMonthTotal = previousMonthRevenue?.reduce((sum, r) => sum + Number(r.creator_earnings), 0) || 0;

          const revenueGrowth = previousMonthTotal > 0
            ? ((lastMonthTotal - previousMonthTotal) / previousMonthTotal) * 100
            : null;

          // Calculate engagement rate (posts per week)
          const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
          const { count: recentPosts } = await supabase
            .from("creator_posts")
            .select("*", { count: "exact", head: true })
            .eq("creator_id", creatorId)
            .gte("created_at", weekAgo);

          const engagementRate = activeSubscriptions && activeSubscriptions > 0
            ? ((recentPosts || 0) / activeSubscriptions) * 100
            : null;

          setAnalytics({
            subscriberCount: creatorProfile.subscriber_count,
            totalEarnings: creatorProfile.total_earnings,
            subscriptionPrice: creatorProfile.subscription_price,
            postCount: postCount || 0,
            activeSubscriptions: activeSubscriptions || 0,
            avgSubscriptionDuration: avgDuration,
            churnRate,
            revenueGrowth,
            engagementRate,
          });
        } catch (err: any) {
          setError(err.message);
          logError(err, 'useCreatorAnalytics.fetchAnalytics');
          throw err;
        } finally {
          setLoading(false);
        }
      },
      { creatorId }
    );
  };

  const refresh = () => {
    fetchAnalytics();
  };

  return { analytics, loading, error, refresh };
};

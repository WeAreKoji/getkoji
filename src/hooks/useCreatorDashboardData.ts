import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { logError } from "@/lib/error-logger";
import { DateRange } from "react-day-picker";
import { subDays, format } from "date-fns";

interface CreatorStats {
  subscriberCount: number;
  totalEarnings: number;
  subscriptionPrice: number;
  postCount: number;
}

interface ChartData {
  date: string;
  subscribers: number;
}

interface RevenueData {
  date: string;
  revenue: number;
  subscribers: number;
}

interface Post {
  id: string;
  content: string;
  media_url: string | null;
  created_at: string;
}

interface FailedTransfer {
  id: string;
  amount: number;
  currency: string;
  error_message: string;
  retry_count: number;
  created_at: string;
}

export const useCreatorDashboardData = (userId: string | null, dateRange?: DateRange) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<CreatorStats | null>(null);
  const [previousStats, setPreviousStats] = useState<CreatorStats>({
    subscriberCount: 0,
    totalEarnings: 0,
    subscriptionPrice: 0,
    postCount: 0,
  });
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [recentPosts, setRecentPosts] = useState<Post[]>([]);
  const [failedTransfers, setFailedTransfers] = useState<FailedTransfer[]>([]);

  // Calculate date ranges
  const fromDate = dateRange?.from || subDays(new Date(), 30);
  const toDate = dateRange?.to || new Date();
  const daysDiff = Math.ceil((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24));
  const previousFromDate = subDays(fromDate, daysDiff);
  const previousToDate = subDays(toDate, daysDiff);

  const fetchDashboardData = async () => {
    if (!userId) return;

    try {
      // Fetch creator profile stats
      const { data: creatorProfile } = await supabase
        .from("creator_profiles")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (!creatorProfile) {
        toast({
          title: "Profile Not Found",
          description: "Please complete your creator setup",
          variant: "destructive",
        });
        return;
      }

      // Fetch current period stats
      const [postCount, currentSubsResult, prevSubsResult] = await Promise.all([
        supabase
          .from("creator_posts")
          .select("*", { count: "exact", head: true })
          .eq("creator_id", userId)
          .gte("created_at", fromDate.toISOString())
          .lte("created_at", toDate.toISOString()),
        supabase
          .from("subscriptions")
          .select("id", { count: "exact", head: true })
          .eq("creator_id", userId)
          .eq("status", "active")
          .gte("started_at", fromDate.toISOString())
          .lte("started_at", toDate.toISOString()),
        supabase
          .from("subscriptions")
          .select("id", { count: "exact", head: true })
          .eq("creator_id", userId)
          .eq("status", "active")
          .gte("started_at", previousFromDate.toISOString())
          .lte("started_at", previousToDate.toISOString()),
      ]);

      const currentStats = {
        subscriberCount: creatorProfile.subscriber_count,
        totalEarnings: creatorProfile.total_earnings,
        subscriptionPrice: creatorProfile.subscription_price,
        postCount: postCount.count || 0,
      };

      setStats(currentStats);
      setPreviousStats({
        subscriberCount: prevSubsResult.count || 0,
        totalEarnings: 0,
        subscriptionPrice: creatorProfile.subscription_price,
        postCount: postCount.count || 0,
      });

      // Fetch subscriber growth data with date range
      const { data: subscriptions } = await supabase
        .from("subscriptions")
        .select("started_at")
        .eq("creator_id", userId)
        .gte("started_at", fromDate.toISOString())
        .lte("started_at", toDate.toISOString())
        .order("started_at", { ascending: true });

      // Group by date
      const growthMap = new Map<string, number>();
      subscriptions?.forEach((sub) => {
        const date = format(new Date(sub.started_at), "MMM dd");
        growthMap.set(date, (growthMap.get(date) || 0) + 1);
      });

      const chartDataArray: ChartData[] = Array.from(growthMap.entries()).map(
        ([date, count]) => ({
          date,
          subscribers: count,
        })
      );

      setChartData(chartDataArray);

      // Fetch recent posts
      const { data: postsData } = await supabase
        .from("creator_posts")
        .select("*")
        .eq("creator_id", userId)
        .order("created_at", { ascending: false })
        .limit(5);

      setRecentPosts(postsData || []);

      // Fetch unresolved failed transfers
      const { data: failedTransfersData } = await supabase
        .from("failed_transfers")
        .select("*")
        .eq("creator_id", userId)
        .is("resolved_at", null)
        .order("created_at", { ascending: false })
        .limit(5);

      setFailedTransfers(failedTransfersData || []);

      // Fetch revenue data with date range
      const { data: revenueRecords } = await supabase
        .from("platform_revenue")
        .select("created_at, creator_earnings, subscription_id")
        .eq("creator_id", userId)
        .gte("created_at", fromDate.toISOString())
        .lte("created_at", toDate.toISOString())
        .order("created_at", { ascending: true });

      // Group revenue by date
      const revenueMap = new Map<string, { revenue: number; subscriptionIds: Set<string> }>();
      revenueRecords?.forEach((record) => {
        const date = format(new Date(record.created_at), "MMM dd");
        const existing = revenueMap.get(date) || { revenue: 0, subscriptionIds: new Set() };
        existing.revenue += Number(record.creator_earnings);
        if (record.subscription_id) {
          existing.subscriptionIds.add(record.subscription_id);
        }
        revenueMap.set(date, existing);
      });

      const revenueChartData: RevenueData[] = Array.from(revenueMap.entries()).map(
        ([date, data]) => ({
          date,
          revenue: data.revenue,
          subscribers: data.subscriptionIds.size,
        })
      );

      setRevenueData(revenueChartData);
    } catch (error) {
      logError(error, "useCreatorDashboardData.fetchDashboardData");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchDashboardData();
    }
  }, [userId, dateRange?.from, dateRange?.to]);

  // Setup realtime subscriptions
  useEffect(() => {
    if (!userId) return;

    // Subscribe to subscriptions changes
    const subscriptionsChannel = supabase
      .channel("creator-subscriptions-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "subscriptions",
          filter: `creator_id=eq.${userId}`,
        },
        (payload) => {
          console.log("Subscription change detected:", payload);
          fetchDashboardData();
          
          if (payload.eventType === "INSERT") {
            toast({
              title: "New Subscriber! 🎉",
              description: "You have a new subscriber",
            });
          }
        }
      )
      .subscribe();

    // Subscribe to posts changes
    const postsChannel = supabase
      .channel("creator-posts-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "creator_posts",
          filter: `creator_id=eq.${userId}`,
        },
        () => {
          fetchDashboardData();
        }
      )
      .subscribe();

    // Subscribe to creator profile changes
    const profileChannel = supabase
      .channel("creator-profile-changes")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "creator_profiles",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          fetchDashboardData();
        }
      )
      .subscribe();

    // Subscribe to revenue changes
    const revenueChannel = supabase
      .channel("creator-revenue-changes")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "platform_revenue",
          filter: `creator_id=eq.${userId}`,
        },
        () => {
          fetchDashboardData();
          toast({
            title: "Payment Received! 💰",
            description: "A new payment has been processed",
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscriptionsChannel);
      supabase.removeChannel(postsChannel);
      supabase.removeChannel(profileChannel);
      supabase.removeChannel(revenueChannel);
    };
  }, [userId]);

  return {
    loading,
    stats,
    previousStats,
    chartData,
    revenueData,
    recentPosts,
    failedTransfers,
    refetch: fetchDashboardData,
  };
};

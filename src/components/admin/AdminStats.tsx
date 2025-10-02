import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, DollarSign, FileText, AlertTriangle, TrendingUp, Shield } from "lucide-react";
import { performanceMonitor } from "@/lib/performance-monitor";

interface AdminStats {
  totalUsers: number;
  totalCreators: number;
  totalSubscriptions: number;
  totalRevenue: number;
  pendingVerifications: number;
  pendingModerations: number;
  revenueGrowth: number;
  userGrowth: number;
}

export const AdminStats = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AdminStats | null>(null);

  useEffect(() => {
    fetchStats();

    // Set up real-time subscription for new verifications/moderations
    const channel = supabase
      .channel('admin-stats')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'creator_id_verification' },
        () => fetchStats()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'creator_posts' },
        () => fetchStats()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchStats = async () => {
    await performanceMonitor.track('fetch-admin-stats', async () => {
      try {
        // Total users
        const { count: totalUsers } = await supabase
          .from("profiles")
          .select("*", { count: "exact", head: true });

        // Total creators
        const { count: totalCreators } = await supabase
          .from("user_roles")
          .select("*", { count: "exact", head: true })
          .eq("role", "creator");

        // Active subscriptions
        const { count: totalSubscriptions } = await supabase
          .from("subscriptions")
          .select("*", { count: "exact", head: true })
          .eq("status", "active");

        // Total revenue
        const { data: revenueData } = await supabase
          .from("platform_revenue")
          .select("platform_commission");

        const totalRevenue = revenueData?.reduce(
          (sum, r) => sum + Number(r.platform_commission),
          0
        ) || 0;

        // Pending verifications
        const { count: pendingVerifications } = await supabase
          .from("creator_id_verification")
          .select("*", { count: "exact", head: true })
          .eq("status", "pending");

        // Pending moderations
        const { count: pendingModerations } = await supabase
          .from("creator_posts")
          .select("*", { count: "exact", head: true })
          .eq("moderation_status", "pending");

        // Calculate growth rates
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
        const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString();

        // Revenue growth
        const { data: lastMonthRevenue } = await supabase
          .from("platform_revenue")
          .select("platform_commission")
          .gte("created_at", thirtyDaysAgo);

        const { data: previousMonthRevenue } = await supabase
          .from("platform_revenue")
          .select("platform_commission")
          .gte("created_at", sixtyDaysAgo)
          .lt("created_at", thirtyDaysAgo);

        const lastMonth = lastMonthRevenue?.reduce((sum, r) => sum + Number(r.platform_commission), 0) || 0;
        const prevMonth = previousMonthRevenue?.reduce((sum, r) => sum + Number(r.platform_commission), 0) || 0;
        const revenueGrowth = prevMonth > 0 ? ((lastMonth - prevMonth) / prevMonth) * 100 : 0;

        // User growth
        const { count: recentUsers } = await supabase
          .from("profiles")
          .select("*", { count: "exact", head: true })
          .gte("created_at", thirtyDaysAgo);

        const { count: previousUsers } = await supabase
          .from("profiles")
          .select("*", { count: "exact", head: true })
          .gte("created_at", sixtyDaysAgo)
          .lt("created_at", thirtyDaysAgo);

        const userGrowth = previousUsers && previousUsers > 0
          ? (((recentUsers || 0) - previousUsers) / previousUsers) * 100
          : 0;

        setStats({
          totalUsers: totalUsers || 0,
          totalCreators: totalCreators || 0,
          totalSubscriptions: totalSubscriptions || 0,
          totalRevenue,
          pendingVerifications: pendingVerifications || 0,
          pendingModerations: pendingModerations || 0,
          revenueGrowth,
          userGrowth,
        });
      } catch (error) {
        console.error("Error fetching admin stats:", error);
      } finally {
        setLoading(false);
      }
    });
  };

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Users className="w-4 h-4" />
            Total Users
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalUsers.toLocaleString()}</div>
          {stats.userGrowth !== 0 && (
            <p className={`text-xs mt-1 flex items-center gap-1 ${stats.userGrowth > 0 ? 'text-green-600' : 'text-red-600'}`}>
              <TrendingUp className="w-3 h-3" />
              {stats.userGrowth > 0 ? '+' : ''}{stats.userGrowth.toFixed(1)}% from last month
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Creators
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalCreators.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground mt-1">
            {((stats.totalCreators / stats.totalUsers) * 100).toFixed(1)}% of users
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Users className="w-4 h-4" />
            Active Subscriptions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalSubscriptions.toLocaleString()}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            Platform Revenue
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${stats.totalRevenue.toFixed(2)}</div>
          {stats.revenueGrowth !== 0 && (
            <p className={`text-xs mt-1 flex items-center gap-1 ${stats.revenueGrowth > 0 ? 'text-green-600' : 'text-red-600'}`}>
              <TrendingUp className="w-3 h-3" />
              {stats.revenueGrowth > 0 ? '+' : ''}{stats.revenueGrowth.toFixed(1)}% from last month
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-orange-500" />
            Pending Verifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.pendingVerifications}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <FileText className="w-4 h-4 text-orange-500" />
            Pending Moderations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.pendingModerations}</div>
        </CardContent>
      </Card>
    </div>
  );
};

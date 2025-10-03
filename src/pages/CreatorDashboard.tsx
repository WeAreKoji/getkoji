import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ArrowLeft, Loader2, Plus, DollarSign, Users, FileText, BarChart3, AlertTriangle, Download, ExternalLink, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import BottomNav from "@/components/navigation/BottomNav";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line } from "recharts";
import SubscriptionPriceEditor from "@/components/creator/SubscriptionPriceEditor";
import PostCreationDialog from "@/components/creator/PostCreationDialog";
import PayoutSettings from "@/components/creator/PayoutSettings";
import { VerificationStatusBanner } from "@/components/creator/VerificationStatusBanner";
import { VerificationGate } from "@/components/creator/VerificationGate";
import { EnhancedPayoutDisplay } from "@/components/creator/EnhancedPayoutDisplay";
import { KojiConnectCard } from "@/components/referrals/KojiConnectCard";
import { TrendIndicator } from "@/components/creator/TrendIndicator";
import { DateRangeSelector } from "@/components/creator/DateRangeSelector";
import { SubscriberList } from "@/components/creator/SubscriberList";
import { ContentPerformance } from "@/components/creator/ContentPerformance";
import { GoalsTracking } from "@/components/creator/GoalsTracking";
import { TransactionHistory } from "@/components/payments/TransactionHistory";
import { MobileEarningsChart } from "@/components/creator/MobileEarningsChart";
import { useIsMobile } from "@/hooks/use-mobile";
import { SafeAreaView } from "@/components/layout/SafeAreaView";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { RetryBoundary } from "@/components/shared/RetryBoundary";
import { logError } from "@/lib/error-logger";
import { useCreatorAnalytics } from "@/hooks/useCreatorAnalytics";
import { DateRange } from "react-day-picker";
import { subDays } from "date-fns";

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

interface PayoutInfo {
  connected: boolean;
  isTestMode?: boolean;
  balance?: {
    available: number;
    pending: number;
    currency: string;
  };
  nextPayout?: {
    amount: number;
    arrivalDate: string;
    status: string;
  };
  payoutSchedule?: {
    interval: string;
    delayDays: number;
  };
  dashboardUrl?: string;
}

interface RevenueData {
  date: string;
  revenue: number;
  subscribers: number;
}

const CreatorDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = useIsMobile();
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
  const [payoutInfo, setPayoutInfo] = useState<PayoutInfo | null>(null);
  const [showPriceEditor, setShowPriceEditor] = useState(false);
  const [showPostDialog, setShowPostDialog] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });
  const [kojiStats, setKojiStats] = useState({
    activeReferrals: 0,
    totalCommission: 0,
    pendingCommission: 0,
  });
  
  const { analytics, loading: analyticsLoading } = useCreatorAnalytics(userId);

  useEffect(() => {
    checkAuthAndFetchData();
    
    // Handle Stripe Connect redirect
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('connected') === 'true') {
      toast({
        title: "Connected!",
        description: "Your Stripe account has been connected successfully.",
      });
      // Clean up URL
      window.history.replaceState({}, '', '/creator/dashboard');
    } else if (urlParams.get('refresh') === 'true') {
      toast({
        title: "Please try again",
        description: "Complete the onboarding process to enable payouts.",
      });
      window.history.replaceState({}, '', '/creator/dashboard');
    }
  }, []);

  const checkAuthAndFetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      setUserId(user.id);

      // Check if user has creator role
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "creator")
        .single();

      if (!roleData) {
        toast({
          title: "Access Denied",
          description: "You need to be a creator to access this page",
          variant: "destructive",
        });
        navigate("/creator/apply");
        return;
      }

      await fetchDashboardData(user.id);
    } catch (error) {
      logError(error, 'CreatorDashboard.checkCreatorStatus');
      setLoading(false);
    }
  };

  const fetchDashboardData = async (creatorId: string) => {
    try {
      // Fetch creator profile stats
      const { data: creatorProfile } = await supabase
        .from("creator_profiles")
        .select("*")
        .eq("user_id", creatorId)
        .single();

      if (!creatorProfile) {
        toast({
          title: "Profile Not Found",
          description: "Please complete your creator setup",
          variant: "destructive",
        });
        navigate("/creator/setup");
        return;
      }

      // Fetch current and previous period stats for trend indicators
      const thirtyDaysAgo = subDays(new Date(), 30);
      const sixtyDaysAgo = subDays(new Date(), 60);

      const [postCount, prevSubsResult] = await Promise.all([
        supabase
          .from("creator_posts")
          .select("*", { count: "exact", head: true })
          .eq("creator_id", creatorId),
        supabase
          .from("subscriptions")
          .select("id", { count: "exact", head: true })
          .eq("creator_id", creatorId)
          .eq("status", "active")
          .lt("started_at", thirtyDaysAgo.toISOString()),
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

      // Fetch subscriber growth data (last 30 days)
      const { data: subscriptions } = await supabase
        .from("subscriptions")
        .select("started_at")
        .eq("creator_id", creatorId)
        .gte("started_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .order("started_at", { ascending: true });

      // Group by date
      const growthMap = new Map<string, number>();
      subscriptions?.forEach((sub) => {
        const date = new Date(sub.started_at).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });
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
        .eq("creator_id", creatorId)
        .order("created_at", { ascending: false })
        .limit(5);

      setRecentPosts(postsData || []);
      
      // Fetch unresolved failed transfers
      const { data: failedTransfersData } = await supabase
        .from("failed_transfers")
        .select("*")
        .eq("creator_id", creatorId)
        .is("resolved_at", null)
        .order("created_at", { ascending: false })
        .limit(5);
      
      setFailedTransfers(failedTransfersData || []);

      // Fetch revenue data from platform_revenue (last 30 days)
      const { data: revenueRecords } = await supabase
        .from("platform_revenue")
        .select("created_at, creator_earnings")
        .eq("creator_id", creatorId)
        .gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .order("created_at", { ascending: true });

      // Group revenue by date
      const revenueMap = new Map<string, { revenue: number; count: number }>();
      revenueRecords?.forEach((record) => {
        const date = new Date(record.created_at).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });
        const existing = revenueMap.get(date) || { revenue: 0, count: 0 };
        revenueMap.set(date, {
          revenue: existing.revenue + Number(record.creator_earnings),
          count: existing.count + 1,
        });
      });

      const revenueChartData: RevenueData[] = Array.from(revenueMap.entries()).map(
        ([date, data]) => ({
          date,
          revenue: data.revenue,
          subscribers: data.count,
        })
      );

      setRevenueData(revenueChartData);

      // Fetch Koji Connect stats
      const { data: referralData } = await supabase
        .from("creator_referrals")
        .select(`
          *,
          creator_referral_commissions(commission_amount)
        `)
        .eq("referrer_id", creatorId);

      if (referralData) {
        const activeReferrals = referralData.filter((r: any) => r.status === "active").length;
        const totalCommission = referralData.reduce((sum: number, r: any) => {
          const commissions = r.creator_referral_commissions || [];
          return sum + commissions.reduce((s: number, c: any) => s + (c.commission_amount || 0), 0);
        }, 0);
        
        setKojiStats({
          activeReferrals,
          totalCommission,
          pendingCommission: totalCommission * 0.1,
        });
      }

      // Fetch payout info
      const { data: payoutData, error: payoutError } = await supabase.functions.invoke(
        "get-payout-info"
      );

      if (!payoutError && payoutData) {
        setPayoutInfo(payoutData);
      }
    } catch (error) {
      logError(error, 'CreatorDashboard.fetchDashboardData');
    } finally {
      setLoading(false);
    }
  };

  const handlePriceUpdate = async () => {
    setShowPriceEditor(false);
    if (userId) {
      await fetchDashboardData(userId);
    }
  };

  const handlePostCreated = async () => {
    setShowPostDialog(false);
    if (userId) {
      await fetchDashboardData(userId);
    }
  };

  const exportToCSV = () => {
    if (!stats) return;

    const mrr = stats.subscriptionPrice * stats.subscriberCount * 0.97 * 0.80;
    const csvData = [
      ["Metric", "Value"],
      ["Subscribers", stats.subscriberCount],
      ["Subscription Price", `$${stats.subscriptionPrice.toFixed(2)}`],
      ["Total Earnings", `$${stats.totalEarnings.toFixed(2)}`],
      ["Monthly Recurring Revenue (MRR)", `$${mrr.toFixed(2)}`],
      ["Posts", stats.postCount],
      ["", ""],
      ["Revenue History", ""],
      ["Date", "Revenue", "Subscribers"],
      ...revenueData.map(d => [d.date, `$${d.revenue.toFixed(2)}`, d.subscribers]),
    ];

    const csv = csvData.map(row => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `creator-analytics-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Export Complete",
      description: "Your analytics have been exported to CSV",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading your dashboard..." />
      </div>
    );
  }

  if (!stats) return null;

  return (
    <RetryBoundary>
      <SafeAreaView bottom={false}>
        <div className="min-h-screen bg-background pb-20">
        <div className={isMobile ? "w-full" : "container max-w-4xl mx-auto"}>
          {/* Header */}
          <div className={`sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border z-10 ${isMobile ? 'px-3 py-2.5' : 'px-4 py-3'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Link to="/discover" aria-label="Back to discover">
                  <ArrowLeft className={isMobile ? "w-5 h-5 text-foreground hover:text-primary transition-colors" : "w-6 h-6 text-foreground hover:text-primary transition-colors"} />
                </Link>
                <h1 className={isMobile ? "text-base font-bold" : "text-xl font-bold"}>Creator Dashboard</h1>
              </div>
              <BarChart3 className={isMobile ? "w-5 h-5 text-primary" : "w-6 h-6 text-primary"} />
            </div>
          </div>

          <div className={isMobile ? "p-3 space-y-4" : "p-4 space-y-6"}>
          {userId && <VerificationStatusBanner userId={userId} />}
          
          {/* Test Mode Banner */}
          {payoutInfo?.isTestMode && (
            <Alert className="border-orange-500 bg-orange-50 dark:bg-orange-950">
              <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              <AlertTitle className="text-orange-600 dark:text-orange-400">Test Mode Active</AlertTitle>
              <AlertDescription className="text-orange-600 dark:text-orange-400">
                You're using Stripe in test mode. Transactions won't process real payments.
              </AlertDescription>
            </Alert>
          )}

          {/* Failed Transfers Alert */}
          {failedTransfers.length > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Transfer Issues Detected</AlertTitle>
              <AlertDescription>
                {failedTransfers.length} transfer{failedTransfers.length > 1 ? 's' : ''} failed. 
                Total amount pending: ${failedTransfers.reduce((sum, t) => sum + Number(t.amount), 0).toFixed(2)}.
                {' '}Please ensure your Stripe Connect account is properly set up in Payout Settings below.
              </AlertDescription>
            </Alert>
          )}
          
          {/* Date Range and Export */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <DateRangeSelector 
              dateRange={dateRange}
              onDateRangeChange={setDateRange}
            />
            <Button variant="outline" size="sm" onClick={exportToCSV}>
              <Download className="w-4 h-4 mr-2" />
              Export Analytics
            </Button>
          </div>
          
          {/* Metrics Grid */}
          <div className={isMobile ? "grid grid-cols-2 gap-3" : "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4"}>
            <Card>
              <CardHeader className={isMobile ? "pb-1 p-3" : "pb-2"}>
                <CardTitle className={isMobile ? "text-xs font-medium text-muted-foreground flex items-center gap-1.5" : "text-sm font-medium text-muted-foreground flex items-center gap-2"}>
                  <Users className={isMobile ? "w-3.5 h-3.5" : "w-4 h-4"} />
                  Subscribers
                </CardTitle>
              </CardHeader>
              <CardContent className={isMobile ? "p-3 pt-0" : ""}>
                <div className="flex items-center justify-between">
                  <div className={isMobile ? "text-xl font-bold" : "text-2xl font-bold"}>{stats.subscriberCount}</div>
                  <TrendIndicator current={stats.subscriberCount} previous={previousStats.subscriberCount} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className={isMobile ? "pb-1 p-3" : "pb-2"}>
                <CardTitle className={isMobile ? "text-xs font-medium text-muted-foreground flex items-center gap-1.5" : "text-sm font-medium text-muted-foreground flex items-center gap-2"}>
                  <DollarSign className={isMobile ? "w-3.5 h-3.5" : "w-4 h-4"} />
                  Earnings
                </CardTitle>
              </CardHeader>
              <CardContent className={isMobile ? "p-3 pt-0" : ""}>
                <div className="space-y-1">
                  <div className={isMobile ? "text-xl font-bold" : "text-2xl font-bold"}>${stats.totalEarnings.toFixed(2)}</div>
                  {!isMobile && <p className="text-xs text-muted-foreground">Total lifetime</p>}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className={isMobile ? "pb-1 p-3" : "pb-2"}>
                <CardTitle className={isMobile ? "text-xs font-medium text-muted-foreground flex items-center gap-1.5" : "text-sm font-medium text-muted-foreground flex items-center gap-2"}>
                  <TrendingUp className={isMobile ? "w-3.5 h-3.5" : "w-4 h-4"} />
                  MRR
                </CardTitle>
              </CardHeader>
              <CardContent className={isMobile ? "p-3 pt-0" : ""}>
                <div className={isMobile ? "text-xl font-bold" : "text-2xl font-bold"}>${(stats.subscriptionPrice * stats.subscriberCount * 0.97 * 0.80).toFixed(2)}</div>
                {!isMobile && <p className="text-xs text-muted-foreground mt-1">Monthly recurring</p>}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className={isMobile ? "pb-1 p-3" : "pb-2"}>
                <CardTitle className={isMobile ? "text-xs font-medium text-muted-foreground flex items-center gap-1.5" : "text-sm font-medium text-muted-foreground flex items-center gap-2"}>
                  <FileText className={isMobile ? "w-3.5 h-3.5" : "w-4 h-4"} />
                  Posts
                </CardTitle>
              </CardHeader>
              <CardContent className={isMobile ? "p-3 pt-0" : ""}>
                <div className={isMobile ? "text-xl font-bold" : "text-2xl font-bold"}>{stats.postCount}</div>
              </CardContent>
            </Card>
          </div>

          {/* Payout Info Card */}
          {payoutInfo?.connected && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Payout Information</span>
                  {payoutInfo.dashboardUrl && (
                    <Button variant="ghost" size="sm" asChild>
                      <a href={payoutInfo.dashboardUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Stripe Dashboard
                      </a>
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Available Balance</p>
                    <p className="text-2xl font-bold text-primary">${payoutInfo.balance?.available.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Pending Balance</p>
                    <p className="text-2xl font-bold">${payoutInfo.balance?.pending.toFixed(2)}</p>
                  </div>
                </div>
                {payoutInfo.nextPayout && (
                  <div className="pt-3 border-t">
                    <p className="text-sm text-muted-foreground mb-1">Next Payout</p>
                    <div className="flex justify-between items-center">
                      <span className="font-semibold">${payoutInfo.nextPayout.amount.toFixed(2)}</span>
                      <span className="text-sm text-muted-foreground">
                        {new Date(payoutInfo.nextPayout.arrivalDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                )}
                {payoutInfo.payoutSchedule && (
                  <p className="text-xs text-muted-foreground">
                    Payout schedule: {payoutInfo.payoutSchedule.interval} 
                    {payoutInfo.payoutSchedule.delayDays ? ` (${payoutInfo.payoutSchedule.delayDays} day delay)` : ''}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Enhanced Revenue Breakdown with Visual */}
          <div className={isMobile ? "space-y-4" : "grid md:grid-cols-2 gap-4"}>
            {/* Detailed Revenue Cards */}
            <div className={isMobile ? "grid grid-cols-2 gap-3" : "grid grid-cols-1 sm:grid-cols-2 gap-4"}>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-medium text-muted-foreground">
                    Gross Revenue
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-bold text-foreground">
                    ${(stats.subscriptionPrice * stats.subscriberCount).toFixed(2)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">100% of subscriptions</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-medium text-muted-foreground">
                    Stripe Fees
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-bold text-destructive">
                    -${(stats.subscriptionPrice * stats.subscriberCount * 0.03).toFixed(2)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">~3% processing</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-medium text-muted-foreground">
                    Platform Commission
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-bold text-destructive">
                    -${(stats.subscriptionPrice * stats.subscriberCount * 0.97 * 0.20).toFixed(2)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">20% of net revenue</p>
                </CardContent>
              </Card>

              <Card className="border-primary/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-medium text-muted-foreground">
                    Your Monthly Earnings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-bold text-primary">
                    ${(stats.subscriptionPrice * stats.subscriberCount * 0.97 * 0.80).toFixed(2)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">80% of net revenue</p>
                </CardContent>
              </Card>
            </div>

            {/* Revenue Distribution Pie Chart */}
            {!isMobile && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Revenue Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={180} className="text-xs sm:text-sm">
                  <PieChart>
                    <Pie
                      data={[
                        { 
                          name: "Your Earnings", 
                          value: parseFloat((stats.subscriptionPrice * stats.subscriberCount * 0.97 * 0.80).toFixed(2)),
                          color: "hsl(var(--primary))"
                        },
                        { 
                          name: "Platform Fee", 
                          value: parseFloat((stats.subscriptionPrice * stats.subscriberCount * 0.97 * 0.20).toFixed(2)),
                          color: "hsl(var(--muted-foreground))"
                        },
                        { 
                          name: "Stripe Fees", 
                          value: parseFloat((stats.subscriptionPrice * stats.subscriberCount * 0.03).toFixed(2)),
                          color: "hsl(var(--destructive))"
                        }
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      paddingAngle={2}
                      dataKey="value"
                      label={false}
                    >
                      {[0, 1, 2].map((index) => (
                        <Cell key={`cell-${index}`} fill={
                          index === 0 ? "hsl(var(--primary))" :
                          index === 1 ? "hsl(var(--muted-foreground))" :
                          "hsl(var(--destructive))"
                        } />
                      ))}
                    </Pie>
                    <Legend 
                      verticalAlign="bottom" 
                      height={36}
                      iconSize={10}
                      wrapperStyle={{ fontSize: '12px' }}
                    />
                    <Tooltip 
                      formatter={(value: number) => `$${value.toFixed(2)}`}
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            )}
          </div>

          {/* Monthly Revenue Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Monthly Revenue Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Subscription Price</span>
                <span className="font-semibold">${stats.subscriptionPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">× Active Subscribers</span>
                <span className="font-semibold">× {stats.subscriberCount}</span>
              </div>
              <div className="border-t pt-3 space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Gross Revenue (100%)</span>
                  <span className="font-medium">${(stats.subscriptionPrice * stats.subscriberCount).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Stripe Fees (~3%)</span>
                  <span className="text-destructive font-medium">-${(stats.subscriptionPrice * stats.subscriberCount * 0.03).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Net After Stripe</span>
                  <span className="font-medium">${(stats.subscriptionPrice * stats.subscriberCount * 0.97).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Platform Commission (20%)</span>
                  <span className="text-destructive font-medium">-${(stats.subscriptionPrice * stats.subscriberCount * 0.97 * 0.20).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center font-bold text-primary border-t pt-2 mt-2">
                  <span>Your Monthly Earnings (80%)</span>
                  <span>${(stats.subscriptionPrice * stats.subscriberCount * 0.97 * 0.80).toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Mobile-Optimized Performance Charts */}
          {isMobile && revenueData.length > 0 && (
            <MobileEarningsChart revenueData={revenueData} period="7d" />
          )}

          {/* Subscriber Growth Chart */}
          {chartData.length > 0 && !isMobile && (
            <Card>
              <CardHeader>
                <CardTitle className={isMobile ? "text-sm" : ""}>Subscriber Growth (Last 30 Days)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={isMobile ? 160 : 200} className="text-xs sm:text-sm">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorSubscribers" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="subscribers"
                      stroke="hsl(var(--primary))"
                      fillOpacity={1}
                      fill="url(#colorSubscribers)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Revenue Chart */}
          {revenueData.length > 0 && !isMobile && (
            <Card>
              <CardHeader>
                <CardTitle className={isMobile ? "text-sm" : ""}>Revenue Trend (Last 30 Days)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={isMobile ? 160 : 200} className="text-xs sm:text-sm">
                  <LineChart data={revenueData}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Tooltip
                      formatter={(value: number) => `$${value.toFixed(2)}`}
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="hsl(var(--primary))"
                      strokeWidth={3}
                      dot={{ fill: "hsl(var(--primary))", r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          <Card>
            <CardHeader className={isMobile ? "p-4 pb-2" : ""}>
              <CardTitle className={isMobile ? "text-base" : ""}>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className={isMobile ? "p-4 pt-2 space-y-2" : "space-y-3"}>
              <Button onClick={() => setShowPostDialog(true)} className="w-full" size={isMobile ? "default" : "lg"}>
                <Plus className={isMobile ? "w-3.5 h-3.5 mr-2" : "w-4 h-4 mr-2"} />
                Create New Post
              </Button>
              <Button
                onClick={() => navigate(`/creator/${userId}`)}
                variant="outline"
                className="w-full"
                size={isMobile ? "default" : "lg"}
              >
                View My Feed
              </Button>
              <Button
                onClick={() => setShowPriceEditor(true)}
                variant="outline"
                className="w-full"
                size={isMobile ? "default" : "lg"}
              >
                Edit Subscription Price
              </Button>
            </CardContent>
          </Card>

          {/* Advanced Analytics from useCreatorAnalytics Hook */}
          {analytics && !analyticsLoading && (
            <div className={isMobile ? "space-y-4" : "grid md:grid-cols-3 gap-4"}>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Avg. Subscription Duration
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.avgSubscriptionDuration.toFixed(1)} months</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Churn Rate
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.churnRate.toFixed(1)}%</div>
                  <TrendIndicator current={analytics.churnRate} previous={analytics.churnRate * 1.2} inverse />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Engagement Rate
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.engagementRate.toFixed(1)}%</div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Koji Connect Card */}
          {kojiStats.activeReferrals > 0 && (
            <KojiConnectCard 
              activeReferrals={kojiStats.activeReferrals}
              totalCommission={kojiStats.totalCommission}
              pendingCommission={kojiStats.pendingCommission}
            />
          )}

          {/* Subscriber Management */}
          {userId && stats.subscriberCount > 0 && (
            <SubscriberList creatorId={userId} limit={5} />
          )}

          {/* Content Performance */}
          {userId && stats.postCount > 0 && (
            <ContentPerformance creatorId={userId} />
          )}

          {/* Goals & Progress */}
          {userId && (
            <GoalsTracking 
              currentSubscribers={stats.subscriberCount}
              currentRevenue={stats.totalEarnings}
            />
          )}

          {/* Transaction History */}
          <TransactionHistory />

          {/* Payout Settings */}
          {userId && (
            <>
              <VerificationGate userId={userId} feature="payout settings">
                <PayoutSettings />
              </VerificationGate>

              {/* Enhanced Payout Display */}
              <VerificationGate userId={userId} feature="payout tracking">
                <EnhancedPayoutDisplay creatorId={userId} />
              </VerificationGate>
            </>
          )}

          {/* Recent Posts */}
          {recentPosts.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Recent Posts</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate(`/creator/${userId}`)}
                  >
                    View All
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {recentPosts.map((post) => (
                  <div key={post.id} className="flex gap-3 p-3 border border-border rounded-lg">
                    {post.media_url && (
                      <img
                        src={post.media_url}
                        alt="Post thumbnail"
                        className="w-16 h-16 object-cover rounded"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground line-clamp-2 mb-1">
                        {post.content || "Media post"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(post.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      </div>

      {isMobile && <BottomNav />}

      <SubscriptionPriceEditor
        open={showPriceEditor}
        onOpenChange={setShowPriceEditor}
        currentPrice={stats.subscriptionPrice}
        onPriceUpdated={handlePriceUpdate}
      />

      <PostCreationDialog
        open={showPostDialog}
        onOpenChange={setShowPostDialog}
        onPostCreated={handlePostCreated}
      />
    </SafeAreaView>
    </RetryBoundary>
  );
};

export default CreatorDashboard;

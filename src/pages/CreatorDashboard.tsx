import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import BottomNav from "@/components/navigation/BottomNav";
import SubscriptionPriceEditor from "@/components/creator/SubscriptionPriceEditor";
import PostCreationDialog from "@/components/creator/PostCreationDialog";
import PayoutSettings from "@/components/creator/PayoutSettings";
import { VerificationGate } from "@/components/creator/VerificationGate";
import { EnhancedPayoutDisplay } from "@/components/creator/EnhancedPayoutDisplay";
import { KojiConnectCard } from "@/components/referrals/KojiConnectCard";
import { SubscriberList } from "@/components/creator/SubscriberList";
import { ContentPerformance } from "@/components/creator/ContentPerformance";
import { GoalsTracking } from "@/components/creator/GoalsTracking";
import { TransactionHistory } from "@/components/payments/TransactionHistory";
import { useIsMobile } from "@/hooks/use-mobile";
import { SafeAreaView } from "@/components/layout/SafeAreaView";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { RetryBoundary } from "@/components/shared/RetryBoundary";
import { logError } from "@/lib/error-logger";
import { useCreatorAnalytics } from "@/hooks/useCreatorAnalytics";
import { useCreatorDashboardData } from "@/hooks/useCreatorDashboardData";
import { DateRange } from "react-day-picker";
import { subDays } from "date-fns";
import { DashboardHeader } from "@/components/creator/dashboard/DashboardHeader";
import { DashboardAlerts } from "@/components/creator/dashboard/DashboardAlerts";
import { DashboardMetrics } from "@/components/creator/dashboard/DashboardMetrics";
import { DashboardCharts } from "@/components/creator/dashboard/DashboardCharts";
import { QuickActionsMenu } from "@/components/creator/QuickActionsMenu";
import { SubscriberDemographics } from "@/components/creator/analytics/SubscriberDemographics";
import { EnhancedContentAnalytics } from "@/components/creator/analytics/EnhancedContentAnalytics";
import { PostAnalyticsDashboard } from "@/components/creator/analytics/PostAnalyticsDashboard";
import { SubscriberCohortAnalysis } from "@/components/creator/analytics/SubscriberCohortAnalysis";
import { RevenueForecast } from "@/components/creator/analytics/RevenueForecast";
import { PostSchedulingDialog } from "@/components/creator/PostSchedulingDialog";
import { BulkMessageDialog } from "@/components/creator/BulkMessageDialog";
import { ScheduledPostsList } from "@/components/creator/ScheduledPostsList";
import { ContentCalendar } from "@/components/creator/ContentCalendar";

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

const CreatorDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [initialLoading, setInitialLoading] = useState(true);
  const [payoutInfo, setPayoutInfo] = useState<PayoutInfo | null>(null);
  const [showPriceEditor, setShowPriceEditor] = useState(false);
  const [showPostDialog, setShowPostDialog] = useState(false);
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [showBulkMessage, setShowBulkMessage] = useState(false);
  const [editingPost, setEditingPost] = useState<any>(null);
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
  const {
    loading: dataLoading,
    stats,
    previousStats,
    chartData,
    revenueData,
    recentPosts,
    failedTransfers,
    refetch
  } = useCreatorDashboardData(userId, dateRange);

  useEffect(() => {
    checkAuthAndInitialize();
  }, []);

  const checkAuthAndInitialize = async () => {
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
        .maybeSingle();

      if (!roleData) {
        toast({
          title: "Access Denied",
          description: "You need to be a creator to access this page",
          variant: "destructive",
        });
        navigate("/creator/apply");
        return;
      }

      // Handle Stripe Connect redirect
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('connected') === 'true') {
        toast({
          title: "Connected!",
          description: "Your Stripe account has been connected successfully.",
        });
        window.history.replaceState({}, '', '/creator/dashboard');
      } else if (urlParams.get('refresh') === 'true') {
        toast({
          title: "Please try again",
          description: "Complete the onboarding process to enable payouts.",
        });
        window.history.replaceState({}, '', '/creator/dashboard');
      }

      await Promise.all([
        fetchPayoutInfo(),
        fetchKojiStats(user.id)
      ]);
    } catch (error) {
      logError(error, 'CreatorDashboard.checkAuthAndInitialize');
    } finally {
      setInitialLoading(false);
    }
  };

  const fetchPayoutInfo = async () => {
    try {
      const { data: payoutData, error: payoutError } = await supabase.functions.invoke(
        "get-payout-info"
      );

      if (!payoutError && payoutData) {
        setPayoutInfo(payoutData);
      }
    } catch (error) {
      logError(error, 'CreatorDashboard.fetchPayoutInfo');
    }
  };

  const fetchKojiStats = async (creatorId: string) => {
    try {
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
    } catch (error) {
      logError(error, 'CreatorDashboard.fetchKojiStats');
    }
  };

  const handlePriceUpdate = async () => {
    setShowPriceEditor(false);
    refetch();
  };

  const handlePostCreated = async () => {
    setShowPostDialog(false);
    refetch();
  };

  const handleBulkMessage = async (message: string) => {
    if (!userId) return;

    // Create notifications for all active subscribers
    const { data: activeSubscribers } = await supabase
      .from("subscriptions")
      .select("subscriber_id")
      .eq("creator_id", userId)
      .eq("status", "active");

    if (activeSubscribers) {
      for (const sub of activeSubscribers) {
        await supabase.from("notifications").insert({
          user_id: sub.subscriber_id,
          type: "creator_message",
          title: "Message from Creator",
          message: message,
          data: { creator_id: userId },
        });
      }
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

  if (initialLoading || dataLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading your dashboard..." />
      </div>
    );
  }

  if (!stats || !userId) return null;

  return (
    <RetryBoundary>
      <SafeAreaView bottom={false}>
        <div className="min-h-screen bg-background pb-20">
          <div className={isMobile ? "w-full" : "container max-w-4xl mx-auto"}>
            <DashboardHeader
              isMobile={isMobile}
              dateRange={dateRange}
              onDateRangeChange={setDateRange}
              onExport={exportToCSV}
            />

            <div className={isMobile ? "p-3 space-y-4" : "p-4 space-y-6"}>
              <DashboardAlerts
                userId={userId}
                payoutInfo={payoutInfo}
                failedTransfers={failedTransfers}
              />

              {/* Quick Actions */}
              <div className="flex gap-2">
                <Button onClick={() => setShowPostDialog(true)} className="flex-1">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Post
                </Button>
                <QuickActionsMenu
                  onCreatePost={() => setShowPostDialog(true)}
                  onSchedulePost={() => {
                    setEditingPost(null);
                    setShowScheduleDialog(true);
                  }}
                  onEditPrice={() => setShowPriceEditor(true)}
                  onExportData={exportToCSV}
                  onMessageSubscribers={() => setShowBulkMessage(true)}
                  onViewSubscribers={() => navigate('/subscriber-management')}
                  onViewSettings={() => navigate("/creator/setup")}
                />
              </div>

              <DashboardMetrics
                stats={stats}
                previousStats={previousStats}
                isMobile={isMobile}
              />

              <DashboardCharts
                chartData={chartData}
                revenueData={revenueData}
                stats={stats}
                isMobile={isMobile}
              />

              {/* Advanced Analytics */}
              {analytics && !analyticsLoading && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Avg Subscription Duration
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {analytics.avgSubscriptionDuration !== null 
                          ? analytics.avgSubscriptionDuration.toFixed(0) 
                          : 'N/A'} days
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Churn Rate
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {analytics.churnRate !== null 
                          ? analytics.churnRate.toFixed(1) 
                          : 'N/A'}%
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        Engagement Rate
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {analytics.engagementRate !== null 
                          ? analytics.engagementRate.toFixed(1) 
                          : 'N/A'}%
                      </div>
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

              {/* Advanced Analytics with Tabs */}
              <Tabs defaultValue="content" className="w-full">
                <TabsList className="grid w-full grid-cols-6">
                  <TabsTrigger value="content">Content</TabsTrigger>
                  <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
                  <TabsTrigger value="subscribers">Subscribers</TabsTrigger>
                  <TabsTrigger value="cohorts">Cohorts</TabsTrigger>
                  <TabsTrigger value="forecast">Forecast</TabsTrigger>
                  <TabsTrigger value="goals">Goals</TabsTrigger>
                </TabsList>

                <TabsContent value="content" className="space-y-6">
                  {stats.postCount > 0 && (
                    <>
                      <PostAnalyticsDashboard creatorId={userId} />
                      <EnhancedContentAnalytics creatorId={userId} />
                      <ContentPerformance creatorId={userId} />
                    </>
                  )}
                  {stats.postCount === 0 && (
                    <Card>
                      <CardContent className="py-8 text-center">
                        <p className="text-muted-foreground">No content analytics available yet. Create your first post to see insights!</p>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="scheduled" className="space-y-6">
                  <div className="grid gap-6 lg:grid-cols-2">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold">Scheduled Posts</h3>
                        <Button
                          onClick={() => {
                            setEditingPost(null);
                            setShowScheduleDialog(true);
                          }}
                          size="sm"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Schedule Post
                        </Button>
                      </div>
                      <ScheduledPostsList
                        creatorId={userId}
                        onEdit={(post) => {
                          setEditingPost(post);
                          setShowScheduleDialog(true);
                        }}
                        onRefresh={refetch}
                      />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Calendar View</h3>
                      <ContentCalendar
                        creatorId={userId}
                        onPostClick={(post) => {
                          if (post.status === 'scheduled') {
                            setEditingPost(post);
                            setShowScheduleDialog(true);
                          }
                        }}
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="subscribers" className="space-y-6">
                  {stats.subscriberCount > 0 ? (
                    <>
                      <SubscriberDemographics creatorId={userId} />
                      <SubscriberList creatorId={userId} limit={5} />
                    </>
                  ) : (
                    <Card>
                      <CardContent className="py-8 text-center">
                        <p className="text-muted-foreground">No subscribers yet. Start growing your audience!</p>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="cohorts" className="space-y-6">
                  <SubscriberCohortAnalysis creatorId={userId} />
                </TabsContent>

                <TabsContent value="forecast" className="space-y-6">
                  <RevenueForecast creatorId={userId} />
                </TabsContent>

                <TabsContent value="goals" className="space-y-6">
                  <GoalsTracking 
                    currentSubscribers={stats.subscriberCount}
                    currentRevenue={stats.totalEarnings}
                  />
                </TabsContent>
              </Tabs>

              {/* Transaction History */}
              <TransactionHistory />

              {/* Payout Settings */}
              <VerificationGate userId={userId} feature="payout settings">
                <PayoutSettings />
              </VerificationGate>

              {/* Enhanced Payout Display */}
              <VerificationGate userId={userId} feature="payout tracking">
                <EnhancedPayoutDisplay creatorId={userId} />
              </VerificationGate>

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

        <PostSchedulingDialog
          open={showScheduleDialog}
          onOpenChange={(open) => {
            setShowScheduleDialog(open);
            if (!open) setEditingPost(null);
          }}
          creatorId={userId!}
          onSuccess={handlePostCreated}
          editPost={editingPost}
        />

        <BulkMessageDialog
          open={showBulkMessage}
          onOpenChange={setShowBulkMessage}
          subscriberCount={stats.subscriberCount}
          onSend={handleBulkMessage}
        />
      </SafeAreaView>
    </RetryBoundary>
  );
};

export default CreatorDashboard;

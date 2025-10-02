import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ArrowLeft, Loader2, Plus, DollarSign, Users, FileText, BarChart3, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import BottomNav from "@/components/navigation/BottomNav";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import SubscriptionPriceEditor from "@/components/creator/SubscriptionPriceEditor";
import PostCreationDialog from "@/components/creator/PostCreationDialog";
import PayoutSettings from "@/components/creator/PayoutSettings";

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

const CreatorDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<CreatorStats | null>(null);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [recentPosts, setRecentPosts] = useState<Post[]>([]);
  const [failedTransfers, setFailedTransfers] = useState<FailedTransfer[]>([]);
  const [showPriceEditor, setShowPriceEditor] = useState(false);
  const [showPostDialog, setShowPostDialog] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

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
      console.error("Error:", error);
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

      // Fetch post count
      const { count: postCount } = await supabase
        .from("creator_posts")
        .select("*", { count: "exact", head: true })
        .eq("creator_id", creatorId);

      setStats({
        subscriberCount: creatorProfile.subscriber_count,
        totalEarnings: creatorProfile.total_earnings,
        subscriptionPrice: creatorProfile.subscription_price,
        postCount: postCount || 0,
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
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="container max-w-4xl mx-auto">
        {/* Header */}
        <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border z-10 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link to="/discover">
                <ArrowLeft className="w-6 h-6 text-foreground hover:text-primary transition-colors" />
              </Link>
              <h1 className="text-xl font-bold">Creator Dashboard</h1>
            </div>
            <BarChart3 className="w-6 h-6 text-primary" />
          </div>
        </div>

        <div className="p-4 space-y-6">
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
          
          {/* Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Subscribers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.subscriberCount}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Your Earnings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${stats.totalEarnings.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground mt-1">Total lifetime</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Price
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${stats.subscriptionPrice}/mo</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Posts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.postCount}</div>
              </CardContent>
            </Card>
          </div>

          {/* Enhanced Revenue Breakdown with Visual */}
          <div className="grid md:grid-cols-2 gap-4">
            {/* Detailed Revenue Cards */}
            <div className="grid grid-cols-2 gap-4">
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
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Revenue Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
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
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {[0, 1, 2].map((index) => (
                        <Cell key={`cell-${index}`} fill={
                          index === 0 ? "hsl(var(--primary))" :
                          index === 1 ? "hsl(var(--muted-foreground))" :
                          "hsl(var(--destructive))"
                        } />
                      ))}
                    </Pie>
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

          {/* Subscriber Growth Chart */}
          {chartData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Subscriber Growth (Last 30 Days)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
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

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button onClick={() => setShowPostDialog(true)} className="w-full" size="lg">
                <Plus className="w-4 h-4 mr-2" />
                Create New Post
              </Button>
              <Button
                onClick={() => navigate(`/creator/${userId}`)}
                variant="outline"
                className="w-full"
                size="lg"
              >
                View My Feed
              </Button>
              <Button
                onClick={() => setShowPriceEditor(true)}
                variant="outline"
                className="w-full"
                size="lg"
              >
                Edit Subscription Price
              </Button>
            </CardContent>
          </Card>

          {/* Payout Settings */}
          <PayoutSettings />

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

      <BottomNav />

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
    </div>
  );
};

export default CreatorDashboard;

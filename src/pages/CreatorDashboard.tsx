import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Loader2, Plus, DollarSign, Users, FileText, BarChart3 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import BottomNav from "@/components/navigation/BottomNav";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import SubscriptionPriceEditor from "@/components/creator/SubscriptionPriceEditor";
import PostCreationDialog from "@/components/creator/PostCreationDialog";

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

const CreatorDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<CreatorStats | null>(null);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [recentPosts, setRecentPosts] = useState<Post[]>([]);
  const [showPriceEditor, setShowPriceEditor] = useState(false);
  const [showPostDialog, setShowPostDialog] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    checkAuthAndFetchData();
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
                  Total Earnings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${stats.totalEarnings.toFixed(2)}</div>
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

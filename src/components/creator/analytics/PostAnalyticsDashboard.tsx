import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { Eye, TrendingUp, BarChart3, Image, Video, FileText } from "lucide-react";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { Badge } from "@/components/ui/badge";

interface PostWithAnalytics {
  id: string;
  content: string | null;
  media_type: string | null;
  media_url: string | null;
  created_at: string;
  status: string;
  view_count: number;
  engagement_count: number;
}

interface PostAnalyticsDashboardProps {
  creatorId: string;
}

export const PostAnalyticsDashboard = ({ creatorId }: PostAnalyticsDashboardProps) => {
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<PostWithAnalytics[]>([]);
  const [stats, setStats] = useState({
    totalViews: 0,
    totalEngagement: 0,
    avgViewsPerPost: 0,
    topPerformingType: "text" as string,
  });

  useEffect(() => {
    fetchPostAnalytics();
  }, [creatorId]);

  const fetchPostAnalytics = async () => {
    try {
      // Fetch posts with their analytics
      const { data: postsData, error: postsError } = await supabase
        .from("creator_posts")
        .select(`
          id,
          content,
          media_type,
          media_url,
          created_at,
          status,
          post_analytics (
            view_count,
            engagement_count
          )
        `)
        .eq("creator_id", creatorId)
        .eq("status", "published")
        .order("created_at", { ascending: false })
        .limit(20);

      if (postsError) throw postsError;

      const postsWithAnalytics = (postsData || []).map((post: any) => ({
        ...post,
        view_count: post.post_analytics?.[0]?.view_count || 0,
        engagement_count: post.post_analytics?.[0]?.engagement_count || 0,
      }));

      setPosts(postsWithAnalytics);

      // Calculate stats
      const totalViews = postsWithAnalytics.reduce((sum, p) => sum + p.view_count, 0);
      const totalEngagement = postsWithAnalytics.reduce((sum, p) => sum + p.engagement_count, 0);
      const avgViews = postsWithAnalytics.length > 0 ? totalViews / postsWithAnalytics.length : 0;

      // Find top performing content type
      const typeStats = postsWithAnalytics.reduce((acc, post) => {
        const type = post.media_type || "text";
        acc[type] = (acc[type] || 0) + post.engagement_count;
        return acc;
      }, {} as Record<string, number>);

      const topType = Object.entries(typeStats).sort(([, a], [, b]) => b - a)[0]?.[0] || "text";

      setStats({
        totalViews,
        totalEngagement,
        avgViewsPerPost: avgViews,
        topPerformingType: topType,
      });
    } catch (error) {
      console.error("Error fetching post analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  const getMediaIcon = (type: string | null) => {
    switch (type) {
      case "image":
        return <Image className="w-4 h-4" />;
      case "video":
        return <Video className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <LoadingSpinner />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          Post Performance Analytics
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="posts">Top Posts</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Total Views</p>
                <p className="text-2xl font-bold">{stats.totalViews.toLocaleString()}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Total Engagement</p>
                <p className="text-2xl font-bold">{stats.totalEngagement.toLocaleString()}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Avg Views/Post</p>
                <p className="text-2xl font-bold">{stats.avgViewsPerPost.toFixed(0)}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Top Content</p>
                <p className="text-2xl font-bold capitalize">{stats.topPerformingType}</p>
              </div>
            </div>

            <div className="pt-4">
              <h4 className="text-sm font-medium mb-2">Insights</h4>
              <div className="space-y-2">
                <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg">
                  <TrendingUp className="w-4 h-4 mt-0.5 text-primary" />
                  <div className="text-sm">
                    <p className="font-medium">Best Performing Content Type</p>
                    <p className="text-muted-foreground capitalize">
                      {stats.topPerformingType} posts generate the most engagement
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="posts" className="space-y-3">
            {posts.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No published posts yet
              </p>
            ) : (
              posts.slice(0, 10).map((post) => (
                <div
                  key={post.id}
                  className="flex items-start gap-3 p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  {post.media_url && (
                    <img
                      src={post.media_url}
                      alt="Post thumbnail"
                      className="w-16 h-16 object-cover rounded"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {getMediaIcon(post.media_type)}
                      <Badge variant="outline" className="text-xs">
                        {post.media_type || "text"}
                      </Badge>
                    </div>
                    <p className="text-sm line-clamp-2 mb-2">
                      {post.content || "Media post"}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {post.view_count} views
                      </span>
                      <span className="flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        {post.engagement_count} engagement
                      </span>
                      <span>
                        {new Date(post.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

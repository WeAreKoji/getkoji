import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Image, Video, Calendar } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { logError } from "@/lib/error-logger";
import { format } from "date-fns";

interface PostAnalytics {
  id: string;
  content: string | null;
  media_type: string | null;
  media_url: string | null;
  created_at: string;
  status: string;
  moderation_status: string;
}

interface ContentStats {
  totalPosts: number;
  publishedPosts: number;
  scheduledPosts: number;
  draftPosts: number;
  imagePosts: number;
  videoPosts: number;
  textPosts: number;
}

interface EnhancedContentAnalyticsProps {
  creatorId: string;
}

export const EnhancedContentAnalytics = ({ creatorId }: EnhancedContentAnalyticsProps) => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<ContentStats>({
    totalPosts: 0,
    publishedPosts: 0,
    scheduledPosts: 0,
    draftPosts: 0,
    imagePosts: 0,
    videoPosts: 0,
    textPosts: 0,
  });
  const [topPosts, setTopPosts] = useState<PostAnalytics[]>([]);

  useEffect(() => {
    fetchAnalytics();
  }, [creatorId]);

  const fetchAnalytics = async () => {
    try {
      const { data: posts, error } = await supabase
        .from("creator_posts")
        .select("*")
        .eq("creator_id", creatorId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const postAnalytics: PostAnalytics[] = posts || [];

      const newStats: ContentStats = {
        totalPosts: postAnalytics.length,
        publishedPosts: postAnalytics.filter(p => p.status === "published").length,
        scheduledPosts: postAnalytics.filter(p => p.status === "scheduled").length,
        draftPosts: postAnalytics.filter(p => p.status === "draft").length,
        imagePosts: postAnalytics.filter(p => p.media_type === "image").length,
        videoPosts: postAnalytics.filter(p => p.media_type === "video").length,
        textPosts: postAnalytics.filter(p => !p.media_type).length,
      };

      setStats(newStats);
      setTopPosts(postAnalytics.slice(0, 5));
    } catch (error) {
      logError(error, "EnhancedContentAnalytics.fetchAnalytics");
    } finally {
      setLoading(false);
    }
  };

  const getMediaIcon = (mediaType: string | null) => {
    if (mediaType === "image") return <Image className="w-3 h-3" />;
    if (mediaType === "video") return <Video className="w-3 h-3" />;
    return <FileText className="w-3 h-3" />;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (stats.totalPosts === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Content Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            No content yet. Create your first post to see analytics!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Tabs defaultValue="overview" className="space-y-4">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="top-posts">Top Posts</TabsTrigger>
        <TabsTrigger value="insights">Insights</TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Posts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalPosts}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Published
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{stats.publishedPosts}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Scheduled
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-500">{stats.scheduledPosts}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Drafts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-muted-foreground">{stats.draftPosts}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Content Types</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Image className="w-4 h-4" />
                  <span className="text-sm">Image Posts</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{stats.imagePosts}</span>
                  <Badge variant="outline">
                    {stats.totalPosts > 0 ? ((stats.imagePosts / stats.totalPosts) * 100).toFixed(0) : 0}%
                  </Badge>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Video className="w-4 h-4" />
                  <span className="text-sm">Video Posts</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{stats.videoPosts}</span>
                  <Badge variant="outline">
                    {stats.totalPosts > 0 ? ((stats.videoPosts / stats.totalPosts) * 100).toFixed(0) : 0}%
                  </Badge>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  <span className="text-sm">Text Only</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{stats.textPosts}</span>
                  <Badge variant="outline">
                    {stats.totalPosts > 0 ? ((stats.textPosts / stats.totalPosts) * 100).toFixed(0) : 0}%
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="top-posts" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Posts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topPosts.map((post, index) => (
                <div key={post.id} className="flex items-start gap-3 p-3 border rounded-lg">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold">
                    {index + 1}
                  </div>
                  {post.media_url && (
                    <img
                      src={post.media_url}
                      alt="Post thumbnail"
                      className="w-16 h-16 object-cover rounded"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm line-clamp-2 mb-1">
                      {post.content || "Media post"}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {getMediaIcon(post.media_type)}
                      <span>{format(new Date(post.created_at), "MMM dd, yyyy")}</span>
                      <Badge variant="outline" className="ml-auto">
                        {post.status}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="insights" className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Content Insights</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Most Used Media Type</span>
                <div className="flex items-center gap-2">
                  {stats.imagePosts > stats.videoPosts ? (
                    <>
                      <Image className="w-4 h-4" />
                      <span className="font-semibold">Images</span>
                    </>
                  ) : stats.videoPosts > stats.imagePosts ? (
                    <>
                      <Video className="w-4 h-4" />
                      <span className="font-semibold">Videos</span>
                    </>
                  ) : (
                    <>
                      <FileText className="w-4 h-4" />
                      <span className="font-semibold">Text</span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Publishing Rate</span>
                <span className="font-semibold">
                  {stats.totalPosts > 0 ? (stats.totalPosts / 30).toFixed(1) : 0} posts/day
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Content Mix</span>
                <span className="font-semibold">
                  {stats.totalPosts > 0 ? ((stats.imagePosts / stats.totalPosts) * 100).toFixed(0) : 0}% Images,{" "}
                  {stats.totalPosts > 0 ? ((stats.videoPosts / stats.totalPosts) * 100).toFixed(0) : 0}% Videos
                </span>
              </div>
            </div>

            {stats.scheduledPosts > 0 && (
              <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-primary" />
                  <span>
                    You have <strong>{stats.scheduledPosts}</strong> scheduled posts ready to publish
                  </span>
                </div>
              </div>
            )}

            {stats.draftPosts > 0 && (
              <div className="mt-2 p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2 text-sm">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  <span>
                    You have <strong>{stats.draftPosts}</strong> draft posts
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
};

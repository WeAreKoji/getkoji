import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Calendar, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";

interface Post {
  id: string;
  content: string;
  status: string;
  moderation_status: string;
  created_at: string;
  scheduled_publish_at: string | null;
  media_type: string | null;
}

interface ContentPerformanceProps {
  creatorId: string;
}

export const ContentPerformance = ({ creatorId }: ContentPerformanceProps) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPosts();
  }, [creatorId]);

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from("creator_posts")
        .select("*")
        .eq("creator_id", creatorId)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      setPosts(data || []);
    } catch (error) {
      console.error("Error fetching posts:", error);
    } finally {
      setLoading(false);
    }
  };

  const publishedPosts = posts.filter(p => p.status === "published");
  const scheduledPosts = posts.filter(p => p.status === "scheduled");
  const draftPosts = posts.filter(p => p.status === "draft");

  const PostList = ({ posts }: { posts: Post[] }) => (
    <div className="space-y-3">
      {posts.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">No posts found</p>
      ) : (
        posts.map((post) => (
          <div
            key={post.id}
            className="p-4 rounded-lg border hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-start justify-between mb-2">
              <p className="text-sm line-clamp-2 flex-1">{post.content}</p>
              <Badge
                variant={
                  post.moderation_status === "approved"
                    ? "default"
                    : post.moderation_status === "rejected"
                    ? "destructive"
                    : "secondary"
                }
                className="ml-2"
              >
                {post.moderation_status}
              </Badge>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              {post.scheduled_publish_at ? (
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  <span>
                    Scheduled for{" "}
                    {formatDistanceToNow(new Date(post.scheduled_publish_at), {
                      addSuffix: true,
                    })}
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>
                    {formatDistanceToNow(new Date(post.created_at), {
                      addSuffix: true,
                    })}
                  </span>
                </div>
              )}
              {post.media_type && (
                <Badge variant="outline" className="text-xs">
                  {post.media_type}
                </Badge>
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );

  if (loading) return <LoadingSpinner />;

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <FileText className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold">Content Performance</h3>
      </div>

      <Tabs defaultValue="published" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="published">
            Published ({publishedPosts.length})
          </TabsTrigger>
          <TabsTrigger value="scheduled">
            Scheduled ({scheduledPosts.length})
          </TabsTrigger>
          <TabsTrigger value="draft">Drafts ({draftPosts.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="published" className="mt-4">
          <PostList posts={publishedPosts} />
        </TabsContent>
        <TabsContent value="scheduled" className="mt-4">
          <PostList posts={scheduledPosts} />
        </TabsContent>
        <TabsContent value="draft" className="mt-4">
          <PostList posts={draftPosts} />
        </TabsContent>
      </Tabs>
    </Card>
  );
};

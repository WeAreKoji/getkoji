import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { EmptyStateCard } from "@/components/shared/EmptyStateCard";
import { Calendar, Image as ImageIcon, Video, FileText, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { logError } from "@/lib/error-logger";

interface CreatorPost {
  id: string;
  content: string | null;
  media_url: string | null;
  media_type: string | null;
  status: string;
  moderation_status: string;
  created_at: string;
  scheduled_publish_at: string | null;
}

interface CreatorPostsDisplayProps {
  creatorId: string;
  isOwnProfile?: boolean;
}

export const CreatorPostsDisplay = ({ creatorId, isOwnProfile }: CreatorPostsDisplayProps) => {
  const [posts, setPosts] = useState<CreatorPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPosts();
  }, [creatorId]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("creator_posts")
        .select("*")
        .eq("creator_id", creatorId)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      setPosts(data || []);
    } catch (error) {
      logError(error, "CreatorPostsDisplay.fetchPosts");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <LoadingSpinner />
      </Card>
    );
  }

  const publishedPosts = posts.filter(p => p.status === "published" && p.moderation_status === "approved");
  const scheduledPosts = posts.filter(p => p.status === "scheduled");
  const pendingPosts = posts.filter(p => p.moderation_status === "pending");

  const PostCard = ({ post }: { post: CreatorPost }) => {
    const getMediaIcon = () => {
      if (!post.media_type) return <FileText className="w-4 h-4" />;
      if (post.media_type.startsWith("image")) return <ImageIcon className="w-4 h-4" />;
      if (post.media_type.startsWith("video")) return <Video className="w-4 h-4" />;
      return <FileText className="w-4 h-4" />;
    };

    const getModerationBadge = () => {
      if (post.moderation_status === "approved") return <Badge variant="default" className="text-xs">Approved</Badge>;
      if (post.moderation_status === "pending") return <Badge variant="secondary" className="text-xs">Pending Review</Badge>;
      if (post.moderation_status === "rejected") return <Badge variant="destructive" className="text-xs">Rejected</Badge>;
      return null;
    };

    return (
      <Card className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 text-muted-foreground">
            {getMediaIcon()}
            <span className="text-xs">
              {post.status === "scheduled" && post.scheduled_publish_at
                ? `Scheduled for ${formatDistanceToNow(new Date(post.scheduled_publish_at), { addSuffix: true })}`
                : formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
            </span>
          </div>
          {isOwnProfile && getModerationBadge()}
        </div>

        {post.media_url && (
          <div className="rounded-lg overflow-hidden bg-muted">
            {post.media_type?.startsWith("image") ? (
              <img src={post.media_url} alt="Post media" className="w-full h-48 object-cover" />
            ) : post.media_type?.startsWith("video") ? (
              <video src={post.media_url} className="w-full h-48 object-cover" controls />
            ) : null}
          </div>
        )}

        {post.content && (
          <p className="text-sm leading-relaxed">{post.content}</p>
        )}
      </Card>
    );
  };

  if (!isOwnProfile && publishedPosts.length === 0) {
    return (
      <Card className="p-6">
        <EmptyStateCard
          icon={FileText}
          title="No posts yet"
          description="Subscribe to see exclusive content from this creator"
        />
      </Card>
    );
  }

  if (isOwnProfile) {
    return (
      <Tabs defaultValue="published" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="published">
            Published ({publishedPosts.length})
          </TabsTrigger>
          <TabsTrigger value="scheduled">
            <Clock className="w-4 h-4 mr-1" />
            Scheduled ({scheduledPosts.length})
          </TabsTrigger>
          <TabsTrigger value="pending">
            Pending ({pendingPosts.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="published" className="space-y-3 mt-4">
          {publishedPosts.length > 0 ? (
            publishedPosts.map(post => <PostCard key={post.id} post={post} />)
          ) : (
            <EmptyStateCard
              icon={FileText}
              title="No published posts"
              description="Create your first post to share with your subscribers"
            />
          )}
        </TabsContent>

        <TabsContent value="scheduled" className="space-y-3 mt-4">
          {scheduledPosts.length > 0 ? (
            scheduledPosts.map(post => <PostCard key={post.id} post={post} />)
          ) : (
            <EmptyStateCard
              icon={Calendar}
              title="No scheduled posts"
              description="Schedule posts to publish automatically"
            />
          )}
        </TabsContent>

        <TabsContent value="pending" className="space-y-3 mt-4">
          {pendingPosts.length > 0 ? (
            pendingPosts.map(post => <PostCard key={post.id} post={post} />)
          ) : (
            <EmptyStateCard
              icon={Clock}
              title="No pending posts"
              description="Posts awaiting moderation will appear here"
            />
          )}
        </TabsContent>
      </Tabs>
    );
  }

  return (
    <div className="space-y-3">
      {publishedPosts.map(post => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
};

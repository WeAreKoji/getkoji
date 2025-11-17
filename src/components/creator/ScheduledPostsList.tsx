import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Calendar, Clock, Edit, Trash2, FileText, Image, Video } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface ScheduledPost {
  id: string;
  content: string | null;
  media_type: string | null;
  media_url: string | null;
  scheduled_publish_at: string;
  status: string;
  created_at: string;
}

interface ScheduledPostsListProps {
  creatorId: string;
  onEdit: (post: ScheduledPost) => void;
  onRefresh?: () => void;
}

export const ScheduledPostsList = ({ creatorId, onEdit, onRefresh }: ScheduledPostsListProps) => {
  const [posts, setPosts] = useState<ScheduledPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletePostId, setDeletePostId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchScheduledPosts();
    
    // Set up real-time subscription
    const channel = supabase
      .channel('scheduled-posts-changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'creator_posts',
          filter: `creator_id=eq.${creatorId}`
        }, 
        () => {
          fetchScheduledPosts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [creatorId]);

  const fetchScheduledPosts = async () => {
    try {
      const { data, error } = await supabase
        .from("creator_posts")
        .select("*")
        .eq("creator_id", creatorId)
        .eq("status", "scheduled")
        .order("scheduled_publish_at", { ascending: true });

      if (error) throw error;
      setPosts(data || []);
      onRefresh?.();
    } catch (error: any) {
      console.error("Error fetching scheduled posts:", error);
      toast({
        title: "Error",
        description: "Failed to load scheduled posts",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (postId: string) => {
    try {
      const { error } = await supabase
        .from("creator_posts")
        .delete()
        .eq("id", postId);

      if (error) throw error;

      toast({
        title: "Post Cancelled",
        description: "Scheduled post has been cancelled",
      });
      
      fetchScheduledPosts();
    } catch (error: any) {
      console.error("Error cancelling post:", error);
      toast({
        title: "Error",
        description: "Failed to cancel post",
        variant: "destructive",
      });
    }
    setDeletePostId(null);
  };

  const getMediaIcon = (mediaType: string | null) => {
    if (!mediaType || mediaType === 'text') return <FileText className="h-4 w-4" />;
    if (mediaType.startsWith("image")) return <Image className="h-4 w-4" />;
    if (mediaType.startsWith("video")) return <Video className="h-4 w-4" />;
    return <FileText className="h-4 w-4" />;
  };

  const isOverdue = (scheduledDate: string) => {
    return new Date(scheduledDate) < new Date();
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (posts.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
            <h3 className="text-lg font-semibold mb-2">No Scheduled Posts</h3>
            <p className="text-sm text-muted-foreground">
              Schedule posts to automatically publish them at a future date
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {posts.map((post) => {
          const overdue = isOverdue(post.scheduled_publish_at);
          
          return (
            <Card key={post.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-2">
                      {getMediaIcon(post.media_type)}
                      <Badge variant={overdue ? "destructive" : "secondary"}>
                        {overdue ? "Overdue" : "Scheduled"}
                      </Badge>
                    </div>
                    
                    <p className="text-sm line-clamp-3">
                      {post.content || "No content"}
                    </p>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>{format(new Date(post.scheduled_publish_at), "MMM dd, yyyy")}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{format(new Date(post.scheduled_publish_at), "h:mm a")}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit(post)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDeletePostId(post.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <AlertDialog open={!!deletePostId} onOpenChange={() => setDeletePostId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Scheduled Post?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this scheduled post. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Post</AlertDialogCancel>
            <AlertDialogAction onClick={() => deletePostId && handleCancel(deletePostId)}>
              Cancel Post
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

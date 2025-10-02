import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle, XCircle, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface Post {
  id: string;
  creator_id: string;
  content: string;
  media_url: string | null;
  media_type: string | null;
  moderation_status: string;
  created_at: string;
  profiles: {
    display_name: string;
    username: string | null;
  };
}

export default function AdminContentModeration() {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [stats, setStats] = useState({
    pending_posts: 0,
    approved_posts: 0,
    rejected_posts: 0,
    total_posts: 0
  });

  useEffect(() => {
    if (!isAdmin) {
      navigate("/");
      return;
    }
    fetchPosts();
    fetchStats();
  }, [isAdmin, navigate]);

  const fetchStats = async () => {
    const { data, error } = await supabase.rpc('get_moderation_stats');
    if (!error && data && data.length > 0) {
      setStats(data[0]);
    }
  };

  const fetchPosts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("creator_posts")
      .select(`
        *,
        profiles:creator_id (
          display_name,
          username
        )
      `)
      .eq("moderation_status", "pending")
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to load posts for moderation",
        variant: "destructive",
      });
    } else {
      setPosts(data || []);
    }
    setLoading(false);
  };

  const handleModeration = async (postId: string, approved: boolean, reason?: string) => {
    setProcessing(postId);
    
    const { error } = await supabase
      .from("creator_posts")
      .update({
        moderation_status: approved ? "approved" : "rejected",
        moderated_by: (await supabase.auth.getUser()).data.user?.id,
        moderated_at: new Date().toISOString(),
        moderation_reason: reason || null,
      })
      .eq("id", postId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update post status",
        variant: "destructive",
      });
    } else {
      // Log admin action
      await supabase.rpc("log_admin_action", {
        _action: approved ? "approve_post" : "reject_post",
        _resource_type: "creator_post",
        _resource_id: postId,
        _details: {
          moderation_reason: reason || null
        }
      });

      toast({
        title: "Success",
        description: `Post ${approved ? "approved" : "rejected"} successfully`,
      });
      fetchPosts();
      fetchStats();
      setSelectedPost(null);
      setRejectionReason("");
    }
    setProcessing(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Content Moderation</h1>
        <p className="text-muted-foreground">Review and moderate creator posts</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending_posts}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.approved_posts}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.rejected_posts}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_posts}</div>
          </CardContent>
        </Card>
      </div>

      {posts.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center text-muted-foreground">
            No posts pending moderation
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {posts.map((post) => (
            <Card key={post.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">
                      {post.profiles?.display_name}
                      {post.profiles?.username && (
                        <span className="text-sm text-muted-foreground ml-2">
                          @{post.profiles.username}
                        </span>
                      )}
                    </CardTitle>
                    <CardDescription>
                      {new Date(post.created_at).toLocaleString()}
                    </CardDescription>
                  </div>
                  <Badge variant="secondary">Pending Review</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {post.content && (
                    <p className="text-sm">{post.content}</p>
                  )}
                  {post.media_url && (
                    <div className="relative rounded-lg overflow-hidden">
                      {post.media_type?.startsWith("image") ? (
                        <img
                          src={post.media_url}
                          alt="Post media"
                          className="w-full max-h-96 object-cover"
                        />
                      ) : post.media_type?.startsWith("video") ? (
                        <video
                          src={post.media_url}
                          controls
                          className="w-full max-h-96"
                        />
                      ) : null}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleModeration(post.id, true)}
                      disabled={processing === post.id}
                      className="flex-1"
                    >
                      {processing === post.id ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <CheckCircle className="w-4 h-4 mr-2" />
                      )}
                      Approve
                    </Button>
                    <Button
                      onClick={() => setSelectedPost(post)}
                      disabled={processing === post.id}
                      variant="destructive"
                      className="flex-1"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Reject
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!selectedPost} onOpenChange={() => setSelectedPost(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Post</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="Reason for rejection (optional)"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={4}
            />
            <div className="flex gap-2">
              <Button
                onClick={() => setSelectedPost(null)}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={() => selectedPost && handleModeration(selectedPost.id, false, rejectionReason)}
                variant="destructive"
                className="flex-1"
                disabled={processing === selectedPost?.id}
              >
                {processing === selectedPost?.id ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : null}
                Confirm Reject
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

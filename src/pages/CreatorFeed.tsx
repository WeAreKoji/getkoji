import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Loader2, Plus, Lock, ExternalLink, Edit, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import BottomNav from "@/components/navigation/BottomNav";
import PostCreationDialog from "@/components/creator/PostCreationDialog";
import PostEditDialog from "@/components/creator/PostEditDialog";
import { logError } from "@/lib/error-logger";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface CreatorProfile {
  id: string;
  user_id: string;
  subscription_price: number;
  subscriber_count: number;
}

interface Profile {
  display_name: string;
  avatar_url: string | null;
}

interface Post {
  id: string;
  content: string;
  media_url: string | null;
  media_type: string | null;
  created_at: string;
}

const CreatorFeed = () => {
  const { creatorId } = useParams<{ creatorId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(false);
  const [creatorProfile, setCreatorProfile] = useState<CreatorProfile | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [showPostDialog, setShowPostDialog] = useState(false);
  const [managingPortal, setManagingPortal] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    if (creatorId) {
      fetchCreatorData();
    }
  }, [creatorId]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('success') === 'true') {
      toast({
        title: "Welcome!",
        description: "Your subscription is now active. Enjoy exclusive content!",
      });
      checkSubscription();
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const fetchCreatorData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      setIsOwnProfile(user.id === creatorId);

      // Fetch creator profile (public data - financial data only visible to owner/admin)
      const { data: creator } = await supabase
        .from("public_creator_profiles")
        .select("*")
        .eq("user_id", creatorId)
        .single();

      if (!creator) {
        toast({
          title: "Creator not found",
          variant: "destructive",
        });
        navigate("/discover");
        return;
      }

      setCreatorProfile(creator);

      // Fetch profile
      const { data: userProfile } = await supabase
        .from("profiles")
        .select("display_name, avatar_url")
        .eq("id", creatorId)
        .single();

      setProfile(userProfile);

      // Check subscription status
      if (!isOwnProfile) {
        await checkSubscription();
      } else {
        setIsSubscribed(true);
      }

      // Fetch posts
      const { data: postsData } = await supabase
        .from("creator_posts")
        .select("*")
        .eq("creator_id", creatorId)
        .order("created_at", { ascending: false });

      setPosts(postsData || []);
    } catch (error) {
      logError(error, 'CreatorFeed.fetchCreatorData');
    } finally {
      setLoading(false);
    }
  };

  const checkSubscription = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("check-subscription", {
        body: { creatorId },
      });

      if (error) throw error;
      setIsSubscribed(data.subscribed);
    } catch (error) {
      logError(error, 'CreatorFeed.checkSubscription');
    }
  };

  const handleSubscribe = async () => {
    if (!creatorProfile) return;

    setSubscribing(true);

    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: {
          creatorId: creatorId,
        },
      });

      if (error) throw error;

      if (data.url) {
        window.open(data.url, "_blank");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSubscribing(false);
    }
  };

  const handlePostCreated = () => {
    setShowPostDialog(false);
    fetchCreatorData();
  };

  const handleManageSubscription = async () => {
    setManagingPortal(true);
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal");

      if (error) throw error;

      if (data.url) {
        window.open(data.url, "_blank");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to open customer portal",
        variant: "destructive",
      });
    } finally {
      setManagingPortal(false);
    }
  };

  const handleEditPost = (post: Post) => {
    setEditingPost(post);
    setShowEditDialog(true);
  };

  const handlePostUpdated = () => {
    setShowEditDialog(false);
    setEditingPost(null);
    fetchCreatorData();
  };

  const handleDeleteClick = (postId: string) => {
    setDeletingPostId(postId);
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingPostId) return;

    try {
      const { error } = await supabase
        .from("creator_posts")
        .delete()
        .eq("id", deletingPostId);

      if (error) throw error;

      toast({
        title: "Post deleted",
        description: "Your post has been removed",
      });

      fetchCreatorData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setShowDeleteDialog(false);
      setDeletingPostId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!creatorProfile || !profile) return null;

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="container max-w-2xl mx-auto">
        {/* Header */}
        <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border z-10 px-4 py-3">
          <div className="flex items-center justify-between">
            <Link to="/discover" aria-label="Back to discover">
              <ArrowLeft className="w-6 h-6 text-foreground hover:text-primary transition-colors" />
            </Link>
            {isOwnProfile && (
              <Link to="/creator/dashboard">
                <Button variant="outline" size="sm">
                  Dashboard
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Creator Info */}
        <Card className="m-4 p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold">{profile.display_name}</h1>
              <p className="text-muted-foreground">
                ${creatorProfile.subscription_price}/month
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {creatorProfile.subscriber_count} subscribers
              </p>
            </div>
            {!isOwnProfile && (
              <Button
                onClick={handleSubscribe}
                disabled={subscribing || isSubscribed}
                size="lg"
              >
                {subscribing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : isSubscribed ? (
                  "Subscribed ✓"
                ) : (
                  "Subscribe"
                )}
              </Button>
            )}
          </div>

          {!isSubscribed && !isOwnProfile && (
            <div className="bg-muted rounded-lg p-4">
              <p className="text-sm text-muted-foreground">
                Subscribe to see exclusive content from {profile.display_name}
              </p>
            </div>
          )}

          {isSubscribed && !isOwnProfile && (
            <div className="mt-4 pt-4 border-t border-border">
              <Button
                onClick={handleManageSubscription}
                disabled={managingPortal}
                variant="outline"
                size="sm"
                className="w-full"
              >
                {managingPortal ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Opening...
                  </>
                ) : (
                  <>
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Manage Subscription
                  </>
                )}
              </Button>
            </div>
          )}
        </Card>

        {/* Create Post Button (Own Profile) */}
        {isOwnProfile && (
          <div className="px-4 mb-4">
            <Button onClick={() => setShowPostDialog(true)} className="w-full" size="lg">
              <Plus className="w-4 h-4 mr-2" />
              Create Post
            </Button>
          </div>
        )}

        {/* Posts */}
        <div className="px-4 space-y-4">
          {posts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No posts yet</p>
            </div>
          ) : (
            posts.map((post) => (
              <Card key={post.id} className="p-4">
                {isOwnProfile && (
                  <div className="flex gap-2 justify-end mb-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditPost(post)}
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteClick(post.id)}
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                )}
                {!isSubscribed && !isOwnProfile ? (
                  <div className="relative">
                    <div className="filter blur-lg">
                      {post.media_url && (
                        <>
                          {post.media_type === 'video' ? (
                            <video
                              src={post.media_url}
                              className="w-full aspect-video object-cover rounded-lg mb-3"
                            />
                          ) : (
                            <img
                              src={post.media_url}
                              alt="Locked content"
                              className="w-full aspect-video object-cover rounded-lg mb-3"
                            />
                          )}
                        </>
                      )}
                      <p className="text-foreground">{post.content}</p>
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="bg-background/90 rounded-lg p-6 text-center">
                        <Lock className="w-12 h-12 mx-auto mb-3 text-primary" />
                        <p className="font-semibold mb-2">Subscribe to view</p>
                        <Button onClick={handleSubscribe} size="sm">
                          Subscribe for ${creatorProfile.subscription_price}/month
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    {post.media_url && (
                      <>
                        {post.media_type === 'video' ? (
                          <video
                            src={post.media_url}
                            controls
                            className="w-full aspect-video object-cover rounded-lg mb-3"
                          />
                        ) : (
                          <img
                            src={post.media_url}
                            alt="Post media"
                            className="w-full aspect-video object-cover rounded-lg mb-3"
                          />
                        )}
                      </>
                    )}
                    <p className="text-foreground mb-2">{post.content}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(post.created_at).toLocaleDateString()}
                    </p>
                  </>
                )}
              </Card>
            ))
          )}
        </div>
      </div>

      <BottomNav />

      <PostCreationDialog
        open={showPostDialog}
        onOpenChange={setShowPostDialog}
        onPostCreated={handlePostCreated}
      />

      <PostEditDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        onPostUpdated={handlePostUpdated}
        post={editingPost}
      />

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Post</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this post? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CreatorFeed;

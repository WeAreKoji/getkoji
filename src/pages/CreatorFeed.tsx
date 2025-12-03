import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Loader2, Plus, Lock, ExternalLink, Edit, Trash2, MapPin, Calendar, Users } from "lucide-react";
import { VerificationBadges } from "@/components/profile/VerificationBadges";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
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
import { SafeAreaView } from "@/components/layout/SafeAreaView";
import { useIsMobile } from "@/hooks/use-mobile";

interface CreatorProfile {
  id: string;
  user_id: string;
  subscription_price: number;
  subscriber_count: number;
  id_verified: boolean;
  created_at: string;
}

interface Profile {
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  age: number | null;
  city: string | null;
  created_at: string;
}

interface Post {
  id: string;
  content: string;
  media_url: string | null;
  media_type: string | null;
  created_at: string;
}

const CreatorFeed = () => {
  const { creatorId, username } = useParams<{ creatorId?: string; username?: string }>();
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
  const [resolvedCreatorId, setResolvedCreatorId] = useState<string | null>(null);
  const isMobile = useIsMobile();
  const showMobileCTA = isMobile && !isSubscribed && !isOwnProfile;

  useEffect(() => {
    if (creatorId || username) {
      fetchCreatorData();
    }
  }, [creatorId, username]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('success') === 'true' && (resolvedCreatorId || creatorId)) {
      toast({
        title: "Welcome!",
        description: "Your subscription is now active. Enjoy exclusive content!",
      });
      checkSubscription();
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [resolvedCreatorId, creatorId]);

  const fetchCreatorData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      let actualCreatorId = creatorId;

      // If username is provided instead of UUID, resolve it
      if (username && !creatorId) {
        // Check if username is actually a UUID
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        
        if (uuidRegex.test(username)) {
          // It's a UUID, use it directly
          actualCreatorId = username;
        } else {
          // It's a username, resolve it using the RPC
          const { data: resolvedData, error: resolveError } = await supabase
            .rpc('get_user_id_by_username', { p_username: username })
            .maybeSingle();

          if (resolveError || !resolvedData) {
            toast({
              title: "Creator not found",
              description: "This creator profile doesn't exist.",
              variant: "destructive",
            });
            navigate("/creators");
            return;
          }

          actualCreatorId = resolvedData.id;
        }
        
        setResolvedCreatorId(actualCreatorId);
      }

      if (!actualCreatorId) {
        navigate("/creators");
        return;
      }

      setIsOwnProfile(user.id === actualCreatorId);

      // Fetch creator profile
      const { data: creator, error: creatorError } = await supabase
        .from("creator_profiles")
        .select("*")
        .eq("user_id", actualCreatorId)
        .maybeSingle();

      if (creatorError) {
        logError(creatorError, 'CreatorFeed.fetchCreatorData.creator_profiles');
      }

      if (!creator) {
        // If it's the user's own profile and they're not a creator, redirect to setup
        if (user.id === actualCreatorId) {
          toast({
            title: "Creator Profile Not Set Up",
            description: "You haven't set up your creator profile yet.",
            variant: "default",
          });
          navigate("/creator/setup");
          return;
        }
        
        toast({
          title: "Creator not found",
          description: "This creator profile doesn't exist.",
          variant: "destructive",
        });
        navigate("/creators");
        return;
      }

      setCreatorProfile(creator);

      // Fetch profile using get_safe_profile to respect RLS
      const { data: safeProfile } = await supabase.rpc('get_safe_profile', { 
        profile_id: actualCreatorId 
      });
      const userProfile = Array.isArray(safeProfile) ? safeProfile[0] : safeProfile;

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
        .eq("creator_id", actualCreatorId)
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
      const actualId = resolvedCreatorId || creatorId;
      if (!actualId) {
        console.warn('checkSubscription called without a valid creator ID');
        return;
      }
      const { data, error } = await supabase.functions.invoke("check-subscription", {
        body: { creatorId: actualId },
      });

      if (error) throw error;
      setIsSubscribed(data?.subscribed ?? false);
    } catch (error) {
      logError(error, 'CreatorFeed.checkSubscription');
    }
  };

  const handleSubscribe = async () => {
    if (!creatorProfile) return;

    setSubscribing(true);

    try {
      const actualId = resolvedCreatorId || creatorId;
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: {
          creatorId: actualId,
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
    <div className={`min-h-screen bg-background ${showMobileCTA ? 'pb-[calc(env(safe-area-inset-bottom)+80px)]' : 'pb-20'}`}>
      <div className="container max-w-2xl mx-auto">
        {/* Header */}
        <div className="sticky z-10" style={{ top: 'env(safe-area-inset-top, 0px)' }}>
          <SafeAreaView top={true} bottom={false}>
            <div className="bg-background/95 backdrop-blur-sm border-b border-border px-4 py-3 flex items-center justify-between">
              <Link to="/discover" aria-label="Back to discover">
                <ArrowLeft className="w-6 h-6 text-foreground hover:text-primary transition-colors" />
              </Link>
              {isOwnProfile ? (
                <Link to="/creator/dashboard">
                  <Button variant="outline" size="sm">Dashboard</Button>
                </Link>
              ) : (
                <div />
              )}
            </div>
          </SafeAreaView>
        </div>

        {/* Creator Info */}
        <Card className="m-3 sm:m-4 overflow-hidden">
          {/* Cover gradient */}
          <div className="h-28 sm:h-40 bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20" />
          
          <div className="px-4 sm:px-6 pb-4 sm:pb-6">
            {/* Avatar positioned over cover */}
            <div className="flex items-end justify-between -mt-14 sm:-mt-20 mb-3 sm:mb-4">
              <Avatar className="w-20 h-20 sm:w-24 sm:h-24 border-4 border-background shadow-lg">
                <AvatarImage src={profile.avatar_url || undefined} />
                <AvatarFallback className="text-xl sm:text-2xl">
                  {profile.display_name?.charAt(0) || 'C'}
                </AvatarFallback>
              </Avatar>
              
              {!isOwnProfile && !showMobileCTA && (
                <Button
                  onClick={handleSubscribe}
                  disabled={subscribing || isSubscribed}
                  size="default"
                  className="shadow-lg text-sm sm:text-base h-9 sm:h-10"
                >
                  {subscribing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-1.5 sm:mr-2 animate-spin" />
                      <span className="hidden xs:inline">Processing...</span>
                      <span className="xs:hidden">...</span>
                    </>
                  ) : isSubscribed ? (
                    "Subscribed ✓"
                  ) : (
                    "Subscribe"
                  )}
                </Button>
              )}
            </div>

            {/* Creator details */}
            <div className="space-y-2.5 sm:space-y-3">
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold truncate">{profile.display_name}</h1>
                <VerificationBadges 
                  userId={resolvedCreatorId || creatorId}
                  isCreator={true}
                  idVerified={creatorProfile.id_verified}
                  size="lg"
                />
              </div>

              {profile.bio && (
                <p className="text-sm sm:text-base text-muted-foreground line-clamp-3">{profile.bio}</p>
              )}

              {/* Stats row */}
              <div className="flex flex-wrap items-center gap-3 sm:gap-6 text-xs sm:text-sm">
                {profile.age && (
                  <span className="text-muted-foreground whitespace-nowrap">{profile.age} years old</span>
                )}
                {profile.city && (
                  <span className="flex items-center gap-1 text-muted-foreground whitespace-nowrap">
                    <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                    <span className="truncate max-w-[120px] sm:max-w-none">{profile.city}</span>
                  </span>
                )}
                <span className="flex items-center gap-1 text-muted-foreground whitespace-nowrap">
                  <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                  Joined {new Date(profile.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                </span>
              </div>

              {/* Subscription info */}
              <div className="flex flex-wrap items-center gap-3 sm:gap-6 pt-2.5 sm:pt-2 border-t border-border">
                <div>
                  <p className="text-xl sm:text-2xl font-bold text-primary whitespace-nowrap">
                    ${creatorProfile.subscription_price}
                    <span className="text-xs sm:text-sm text-muted-foreground font-normal">/month</span>
                  </p>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-xs sm:text-sm whitespace-nowrap">
                    <span className="font-semibold">{creatorProfile.subscriber_count}</span>
                    <span className="text-muted-foreground"> subscribers</span>
                  </span>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="text-xs sm:text-sm whitespace-nowrap">
                    <span className="font-semibold">{posts.length}</span>
                    <span className="text-muted-foreground"> posts</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {!isSubscribed && !isOwnProfile && (
            <div className="bg-muted rounded-lg p-3 sm:p-4 mx-4 sm:mx-6 mb-4 sm:mb-6">
              <p className="text-xs sm:text-sm text-muted-foreground text-center">
                Subscribe to see exclusive content from {profile.display_name}
              </p>
            </div>
          )}

          {isSubscribed && !isOwnProfile && (
            <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-border px-4 sm:px-6 pb-4 sm:pb-6">
              <Button
                onClick={handleManageSubscription}
                disabled={managingPortal}
                variant="outline"
                size="sm"
                className="w-full"
              >
                {managingPortal ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-2 animate-spin" />
                    <span className="text-xs sm:text-sm">Opening...</span>
                  </>
                ) : (
                  <>
                    <ExternalLink className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-2" />
                    <span className="text-xs sm:text-sm">Manage Subscription</span>
                  </>
                )}
              </Button>
            </div>
          )}
        </Card>

        {/* Create Post Button (Own Profile) */}
        {isOwnProfile && (
          <div className="px-3 sm:px-4 mb-3 sm:mb-4">
            <Button onClick={() => setShowPostDialog(true)} className="w-full h-11 sm:h-12" size="lg">
              <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              <span className="text-sm sm:text-base">Create Post</span>
            </Button>
          </div>
        )}

        {/* Posts */}
        <div className="px-3 sm:px-4 space-y-3 sm:space-y-4 pb-4">
          {posts.length === 0 ? (
            <div className="text-center py-8 sm:py-12">
              <p className="text-sm sm:text-base text-muted-foreground">No posts yet</p>
            </div>
          ) : (
            posts.map((post) => (
              <Card key={post.id} className="p-3 sm:p-4">
                {isOwnProfile && (
                  <div className="flex gap-2 justify-end mb-2 sm:mb-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditPost(post)}
                      className="h-8 text-xs sm:text-sm"
                    >
                      <Edit className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteClick(post.id)}
                      className="h-8 text-xs sm:text-sm"
                    >
                      <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1" />
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
                              playsInline
                              preload="metadata"
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
                      <div className="bg-background/90 rounded-lg p-4 sm:p-6 text-center mx-4">
                        <Lock className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 sm:mb-3 text-primary" />
                        <p className="text-sm sm:text-base font-semibold mb-2">Subscribe to view</p>
                        <Button onClick={handleSubscribe} size="sm" className="text-xs sm:text-sm">
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
                            className="w-full aspect-video object-cover rounded-lg mb-2 sm:mb-3"
                            playsInline
                            preload="metadata"
                          />
                        ) : (
                          <img
                            src={post.media_url}
                            alt="Post media"
                            className="w-full aspect-video object-cover rounded-lg mb-2 sm:mb-3"
                          />
                        )}
                      </>
                    )}
                    <p className="text-sm sm:text-base text-foreground mb-2">{post.content}</p>
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

      {showMobileCTA && (
        <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-border bg-background/95 backdrop-blur-sm shadow-lg">
          <SafeAreaView top={false} bottom={true}>
            <div className="px-3 py-2.5 flex items-center gap-2.5">
              <div className="flex-1 min-w-0">
                <p className="text-xs sm:text-sm font-medium truncate">Subscribe to {profile?.display_name}</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                  ${creatorProfile?.subscription_price}/mo • {creatorProfile?.subscriber_count} subscribers
                </p>
              </div>
              <Button 
                onClick={handleSubscribe} 
                disabled={subscribing} 
                size="default" 
                className="min-w-[100px] sm:min-w-[120px] h-10 text-sm whitespace-nowrap"
              >
                {subscribing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                    <span className="hidden xs:inline">Processing...</span>
                  </>
                ) : (
                  "Subscribe"
                )}
              </Button>
            </div>
          </SafeAreaView>
        </div>
      )}

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

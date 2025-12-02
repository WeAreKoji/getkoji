import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Heart, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { logError } from "@/lib/error-logger";
import LikesYouCard from "./LikesYouCard";
import { LikesYouProfileModal } from "./LikesYouProfileModal";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface Photo {
  id: string;
  photo_url: string;
  order_index: number;
}

interface LikeProfile {
  id: string;
  display_name: string;
  username: string | null;
  age: number;
  city: string | null;
  bio: string | null;
  avatar_url: string | null;
  liked_at: string;
  is_creator: boolean;
  id_verified: boolean;
  photos: Photo[];
  interests: string[];
}

interface LikesYouSectionProps {
  currentUserId: string;
  onMatch?: () => void;
  onCountChange?: (count: number) => void;
}

const LikesYouSection = ({ currentUserId, onMatch, onCountChange }: LikesYouSectionProps) => {
  const [likes, setLikes] = useState<LikeProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(true);
  const [selectedProfile, setSelectedProfile] = useState<LikeProfile | null>(null);
  const [modalLoading, setModalLoading] = useState(false);

  useEffect(() => {
    fetchLikes();

    // Subscribe to new likes in real-time
    const channel = supabase
      .channel('likes-received')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'swipes',
          filter: `swiped_id=eq.${currentUserId}`,
        },
        (payload) => {
          if (payload.new.is_like) {
            fetchLikes();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId]);

  useEffect(() => {
    onCountChange?.(likes.length);
  }, [likes.length, onCountChange]);

  const fetchLikes = async () => {
    try {
      const { data, error } = await supabase.rpc('get_likes_received', {
        p_user_id: currentUserId
      });

      if (error) throw error;
      
      // Transform data to ensure photos and interests are arrays
      const transformedData = (data || []).map((like: any) => ({
        ...like,
        photos: Array.isArray(like.photos) ? like.photos : [],
        interests: Array.isArray(like.interests) ? like.interests : [],
      }));
      
      setLikes(transformedData);
    } catch (error) {
      logError(error, 'LikesYouSection.fetchLikes');
    } finally {
      setLoading(false);
    }
  };

  const handleLikeBack = async (likerId: string) => {
    setModalLoading(true);
    try {
      // Create a swipe (like) for this user - this will trigger the match
      const { error } = await supabase
        .from('swipes')
        .insert({
          swiper_id: currentUserId,
          swiped_id: likerId,
          is_like: true,
        });

      if (error) throw error;

      // Remove from UI optimistically
      setLikes(prev => prev.filter(l => l.id !== likerId));

      toast({
        title: "It's a match! 🎉",
        description: "You can now start chatting!",
      });

      onMatch?.();
    } catch (error) {
      logError(error, 'LikesYouSection.handleLikeBack');
      toast({
        title: "Error",
        description: "Could not complete the action. Please try again.",
        variant: "destructive",
      });
    } finally {
      setModalLoading(false);
    }
  };

  const handlePass = async (likerId: string) => {
    setModalLoading(true);
    try {
      // Create a pass swipe
      const { error } = await supabase
        .from('swipes')
        .insert({
          swiper_id: currentUserId,
          swiped_id: likerId,
          is_like: false,
        });

      if (error) throw error;

      // Remove from UI optimistically
      setLikes(prev => prev.filter(l => l.id !== likerId));

      toast({
        title: "Passed",
        description: "This profile has been removed from your likes.",
      });
    } catch (error) {
      logError(error, 'LikesYouSection.handlePass');
      toast({
        title: "Error",
        description: "Could not complete the action. Please try again.",
        variant: "destructive",
      });
    } finally {
      setModalLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-3">
          <Skeleton className="w-5 h-5 rounded" />
          <Skeleton className="h-5 w-32" />
        </div>
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="flex items-center gap-3 p-3 bg-card rounded-lg border">
              <Skeleton className="w-14 h-14 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-3 w-20" />
              </div>
              <div className="flex gap-2">
                <Skeleton className="w-9 h-9 rounded-full" />
                <Skeleton className="w-9 h-9 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (likes.length === 0) {
    return null;
  }

  return (
    <>
      <Collapsible open={isOpen} onOpenChange={setIsOpen} className="mb-4">
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            className="w-full flex items-center justify-between p-3 h-auto bg-primary/5 hover:bg-primary/10 rounded-lg border border-primary/20"
          >
            <div className="flex items-center gap-2">
              <div className="relative">
                <Heart className="w-5 h-5 text-primary" fill="currentColor" />
                <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {likes.length}
                </span>
              </div>
              <span className="font-semibold text-foreground">
                {likes.length} {likes.length === 1 ? 'person likes' : 'people like'} you
              </span>
            </div>
            {isOpen ? (
              <ChevronUp className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            )}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-2 space-y-2">
          {likes.map((like) => (
            <LikesYouCard
              key={like.id}
              profile={like}
              likedAt={like.liked_at}
              onLikeBack={() => handleLikeBack(like.id)}
              onPass={() => handlePass(like.id)}
              onViewProfile={() => setSelectedProfile(like)}
            />
          ))}
        </CollapsibleContent>
      </Collapsible>

      {/* Profile Preview Modal */}
      <LikesYouProfileModal
        profile={selectedProfile}
        open={!!selectedProfile}
        onOpenChange={(open) => !open && setSelectedProfile(null)}
        onLikeBack={() => selectedProfile && handleLikeBack(selectedProfile.id)}
        onPass={() => selectedProfile && handlePass(selectedProfile.id)}
        loading={modalLoading}
      />
    </>
  );
};

export default LikesYouSection;

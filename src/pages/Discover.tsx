import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { Sparkles, LogOut, SlidersHorizontal } from "lucide-react";
import BottomNav from "@/components/navigation/BottomNav";
import SwipeableCard from "@/components/discover/SwipeableCard";
import { DiscoverProfileModal } from "@/components/discover/DiscoverProfileModal";
import { MatchCelebrationModal } from "@/components/discover/MatchCelebrationModal";
import { UndoButton } from "@/components/discover/UndoButton";
import { PageTransition } from "@/components/transitions/PageTransition";
import { ProfileCardSkeleton } from "@/components/shared/SkeletonLoader";
import { haptics } from "@/lib/native";
import { useIsMobile } from "@/hooks/use-mobile";
import { ClientRateLimiter } from "@/lib/rate-limit-client";
import { ActiveFilters } from "@/components/discover/ActiveFilters";
import { InviteEarnModal } from "@/components/referrals/InviteEarnModal";
import { useOnboardingModal } from "@/hooks/useOnboardingModal";

interface Profile {
  id: string;
  display_name: string;
  username: string | null;
  bio: string | null;
  age: number;
  city: string | null;
  avatar_url: string | null;
  intent: string;
  photos: Array<{ id: string; photo_url: string; order_index: number }>;
  photo_count: number;
  interests: string[];
  is_creator: boolean;
  creator_subscription_price: number | null;
  creator_tagline: string | null;
  id_verified: boolean;
}

const UNDO_TIMEOUT = 5000; // 5 seconds

const Discover = () => {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [currentUserProfile, setCurrentUserProfile] = useState<any>(null);
  const [modalProfile, setModalProfile] = useState<Profile | null>(null);
  const [matchedProfile, setMatchedProfile] = useState<{ display_name: string; avatar_url: string | null } | null>(null);
  const [showMatchCelebration, setShowMatchCelebration] = useState(false);
  const [newMatchId, setNewMatchId] = useState<string | undefined>(undefined);
  
  // Undo feature state
  const [lastPassedProfile, setLastPassedProfile] = useState<Profile | null>(null);
  const [lastSwipeId, setLastSwipeId] = useState<string | null>(null);
  const [canUndo, setCanUndo] = useState(false);
  const [undoLoading, setUndoLoading] = useState(false);
  const undoTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const [filters, setFilters] = useState({
    ageRange: [18, 99] as [number, number],
    distance: 50,
    interestedIn: ['open_to_dating', 'make_friends', 'support_creators'],
    interestedInGender: ['male', 'female'],
    showCreatorsOnly: false,
    showVerifiedOnly: false,
  });
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { toast } = useToast();
  
  // Onboarding modal for referrals
  const { shouldShow: shouldShowInviteModal, markAsShown: markInviteModalShown, referralLink } = useOnboardingModal(user?.id || null);
  
  // Clear undo timeout on unmount
  useEffect(() => {
    return () => {
      if (undoTimeoutRef.current) {
        clearTimeout(undoTimeoutRef.current);
      }
    };
  }, []);
  
  // Initialize user data when authenticated
  useEffect(() => {
    if (user) {
      initializeUserData();
    }
  }, [user]);

  // Real-time match detection
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('match-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'matches',
          filter: `user1_id=eq.${user.id},user2_id=eq.${user.id}`
        },
        async (payload) => {
          console.log('Match detected!', payload);
          
          // Get matched user's profile from notification
          const matchedUserId = payload.new.user1_id === user.id 
            ? payload.new.user2_id 
            : payload.new.user1_id;

          const { data: profile } = await supabase
            .from('profiles')
            .select('display_name, avatar_url')
            .eq('id', matchedUserId)
            .single();

          if (profile) {
            setMatchedProfile(profile);
            setNewMatchId(payload.new.id);
            setShowMatchCelebration(true);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const initializeUserData = async () => {
    if (!user) return;
    
    // Load current user's profile for match celebration
    const { data: profile } = await supabase
      .from('profiles')
      .select('avatar_url')
      .eq('id', user.id)
      .single();
    
    if (profile) {
      setCurrentUserProfile(profile);
    }

    // Load user's discovery preferences
    await loadUserPreferences(user.id);
    // Load profiles after user is set
    await loadProfiles(user.id);
  };

  const loadUserPreferences = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('discovery_preferences')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (data) {
        setFilters({
          ageRange: [data.min_age || 18, data.max_age || 99],
          distance: data.max_distance_km || 50,
          interestedIn: data.interested_in || ['open_to_dating', 'make_friends', 'support_creators'],
          interestedInGender: data.interested_in_gender || ['male', 'female'],
          showCreatorsOnly: data.show_creators_only || false,
          showVerifiedOnly: data.show_verified_only || false,
        });
      } else {
        // Create default preferences if none exist
        await supabase.from('discovery_preferences').insert({
          user_id: userId,
          min_age: 18,
          max_age: 99,
          max_distance_km: 50,
          interested_in: ['open_to_dating', 'make_friends', 'support_creators'],
          interested_in_gender: ['male', 'female'],
          show_verified_only: false,
          show_creators_only: false,
          show_non_creators: true,
        });
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    }
  };

  const loadProfiles = async (userId: string) => {
    try {
      // Use smart ranked RPC function
      const { data, error } = await supabase.rpc("get_discover_profiles_ranked", {
        user_id: userId,
        max_count: 10
      });

      if (error) throw error;

      // Cast the data to match our Profile interface
      const profiles = (data || []).map((profile: any) => ({
        ...profile,
        photos: Array.isArray(profile.photos) ? profile.photos : [],
        interests: Array.isArray(profile.interests) ? profile.interests : [],
        photo_count: profile.photo_count || 0,
        is_creator: profile.is_creator === true,
        id_verified: profile.id_verified === true,
      }));

      // Update last_active for current user
      supabase.from("profiles").update({ last_active_at: new Date().toISOString() }).eq("id", userId).then();

      setProfiles(profiles);
    } catch (error: any) {
      toast({
        title: "Error loading profiles",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const clearUndoState = () => {
    setCanUndo(false);
    setLastPassedProfile(null);
    setLastSwipeId(null);
    if (undoTimeoutRef.current) {
      clearTimeout(undoTimeoutRef.current);
      undoTimeoutRef.current = null;
    }
  };

  const handleUndo = async () => {
    if (!lastPassedProfile || !lastSwipeId || !user) return;
    
    setUndoLoading(true);
    try {
      // Delete the swipe record
      const { error } = await supabase
        .from('swipes')
        .delete()
        .eq('id', lastSwipeId);
      
      if (error) throw error;
      
      // Re-insert the profile at current position
      setProfiles(prev => {
        const newProfiles = [...prev];
        newProfiles.splice(currentIndex, 0, lastPassedProfile);
        return newProfiles;
      });
      
      haptics.success();
      toast({
        title: "Undone! 🔄",
        description: `${lastPassedProfile.display_name} is back!`,
        duration: 2000,
      });
      
      clearUndoState();
    } catch (error: any) {
      console.error('Undo error:', error);
      toast({
        title: "Couldn't undo",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setUndoLoading(false);
    }
  };

  const handleSwipe = async (isLike: boolean) => {
    const currentProfile = profiles[currentIndex];
    if (!currentProfile || !user) {
      console.log('⚠️ handleSwipe called without profile or user');
      return;
    }

    // Clear any existing undo state when making a new swipe
    clearUndoState();

    console.log('🎯 handleSwipe called:', {
      isLike,
      profileId: currentProfile.id,
      profileName: currentProfile.display_name,
      userId: user.id,
      currentIndex,
      totalProfiles: profiles.length,
      timestamp: new Date().toISOString()
    });

    // Rate limit: 50 swipes per 5 minutes
    const rateLimit = ClientRateLimiter.checkLimit({
      key: `swipe_${user.id}`,
      maxAttempts: 50,
      windowMinutes: 5,
    });

    if (!rateLimit.allowed) {
      console.log('⚠️ Rate limit exceeded');
      toast({
        title: "Slow down!",
        description: "You're swiping too quickly. Please wait a moment.",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log('📤 Inserting swipe to database...');
      const { data, error } = await supabase
        .from("swipes")
        .insert({
          swiper_id: user.id,
          swiped_id: currentProfile.id,
          is_like: isLike
        })
        .select('id')
        .single();
      
      if (error) {
        console.error('❌ Database error:', error);
        throw error;
      }

      console.log('✅ Swipe inserted successfully');
      
      if (isLike) {
        haptics.success();
        toast({
          title: "Liked! 💜",
          description: "You'll be notified if it's a match!"
        });
      } else {
        // Enable undo for pass actions
        setLastPassedProfile(currentProfile);
        setLastSwipeId(data.id);
        setCanUndo(true);
        
        // Auto-clear undo after timeout
        undoTimeoutRef.current = setTimeout(() => {
          clearUndoState();
        }, UNDO_TIMEOUT);
        
        toast({
          title: "Passed 👋",
          description: "Keep swiping to find your match!",
          duration: 2000
        });
      }
      
      console.log('⏭️ Moving to next profile');
      setCurrentIndex(prev => prev + 1);
    } catch (error: any) {
      console.error('❌ handleSwipe error:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const currentProfile = profiles[currentIndex];
  if (loading) {
    return <div className={isMobile ? "min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/5 pb-24" : "min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/5"}>
        <ProfileCardSkeleton />
        {isMobile && <BottomNav />}
      </div>;
  }
  if (!currentProfile) {
    return <div className={isMobile ? "min-h-screen flex flex-col bg-gradient-to-br from-primary/5 to-secondary/5 px-4 pb-24" : "min-h-screen flex flex-col bg-gradient-to-br from-primary/5 to-secondary/5 px-4"}>
        <div className="container mx-auto max-w-md pt-8">
          <div className="flex justify-between items-center mb-6">
            <img 
              src="/logo.png" 
              alt="Koji" 
              className="h-10 w-auto"
            />
            <div className="flex gap-2">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => navigate('/discovery-settings')} 
                aria-label="Discovery settings"
              >
                <SlidersHorizontal className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon" onClick={handleLogout} aria-label="Log out">
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Active Filters Display */}
          <ActiveFilters {...filters} />
        </div>

        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md px-4">
            <Sparkles className="w-16 h-16 mx-auto mb-4 text-primary animate-pulse" />
            <h2 className="text-2xl font-bold mb-2">You're Early! 🎉</h2>
            <p className="text-muted-foreground mb-4">
              No profiles match your current filters. Try adjusting your preferences or check back later as more people join!
            </p>
            <Button onClick={() => navigate('/discovery-settings')} className="mt-4">
              Adjust Filters
            </Button>
          </div>
        </div>
        
        {isMobile && <BottomNav />}
      </div>;
  }
  return (
    <PageTransition>
      <div className={cn(
        "min-h-screen bg-gradient-to-br from-background to-muted/30",
        isMobile ? "pt-4 pb-24 px-2" : "py-8 px-4"
      )}>
        <div className="container mx-auto max-w-md">
          {/* Header */}
          <div className="flex justify-between items-center mb-4 px-2">
            <img 
              src="/logo.png" 
              alt="Koji" 
              className="h-8 w-auto"
            />
            <div className="flex gap-1">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => navigate('/discovery-settings')} 
                aria-label="Discovery settings"
                className="h-9 w-9"
              >
                <SlidersHorizontal className="w-5 h-5" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleLogout} 
                aria-label="Log out"
                className="h-9 w-9"
              >
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Active Filters Display */}
          <div className="px-2 mb-3">
            <ActiveFilters {...filters} />
          </div>

          {/* Swipeable Card */}
          <SwipeableCard 
            profile={currentProfile} 
            onSwipe={handleSwipe}
            onProfileOpen={() => setModalProfile(currentProfile)}
          />

          <p className="text-center text-muted-foreground mt-2 text-xs">
            {profiles.length - currentIndex - 1} profiles remaining
          </p>
        </div>

        {/* Undo Button */}
        <UndoButton 
          visible={canUndo} 
          onClick={handleUndo} 
          loading={undoLoading} 
        />
        
        {/* Full Profile Modal */}
        <DiscoverProfileModal
          profile={modalProfile}
          open={!!modalProfile}
          onOpenChange={(open) => !open && setModalProfile(null)}
          onLike={() => {
            if (modalProfile) {
              handleSwipe(true);
              setModalProfile(null);
            }
          }}
          onPass={() => {
            if (modalProfile) {
              handleSwipe(false);
              setModalProfile(null);
            }
          }}
        />

        {/* Match Celebration Modal */}
        <MatchCelebrationModal
          open={showMatchCelebration}
          onOpenChange={(open) => {
            setShowMatchCelebration(open);
            if (!open) setNewMatchId(undefined);
          }}
          matchedProfile={matchedProfile}
          currentUserAvatar={currentUserProfile?.avatar_url || null}
          matchId={newMatchId}
        />

        {/* Invite & Earn Modal - Post Onboarding */}
        <InviteEarnModal
          open={shouldShowInviteModal}
          onOpenChange={(open) => {
            if (!open) markInviteModalShown();
          }}
          referralLink={referralLink}
          onNavigateToReferrals={() => {
            markInviteModalShown();
            navigate("/referrals");
          }}
        />
        
        {isMobile && <BottomNav />}
      </div>
    </PageTransition>
  );
};

export default Discover;
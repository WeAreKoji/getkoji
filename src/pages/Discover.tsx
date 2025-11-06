import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, LogOut, SlidersHorizontal } from "lucide-react";
import BottomNav from "@/components/navigation/BottomNav";
import SwipeableCard from "@/components/discover/SwipeableCard";
import { DiscoverProfileModal } from "@/components/discover/DiscoverProfileModal";
import { MatchCelebrationModal } from "@/components/discover/MatchCelebrationModal";
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
const Discover = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [currentUserProfile, setCurrentUserProfile] = useState<any>(null);
  const [modalProfile, setModalProfile] = useState<Profile | null>(null);
  const [matchedProfile, setMatchedProfile] = useState<{ display_name: string; avatar_url: string | null } | null>(null);
  const [showMatchCelebration, setShowMatchCelebration] = useState(false);
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
  
  useEffect(() => {
    checkUser();
  }, []);

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
            setShowMatchCelebration(true);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
    } else {
      setUser(user);
      
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
    }
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
      // Use RPC function for smart filtering (excludes own profile and already swiped)
      const { data, error } = await supabase.rpc("get_discover_profiles", {
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
  const handleSwipe = async (isLike: boolean) => {
    const currentProfile = profiles[currentIndex];
    if (!currentProfile || !user) {
      console.log('⚠️ handleSwipe called without profile or user');
      return;
    }

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
      const {
        error
      } = await supabase.from("swipes").insert({
        swiper_id: user.id,
        swiped_id: currentProfile.id,
        is_like: isLike
      });
      
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
      <div className={isMobile ? "min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 py-8 px-4 pb-24" : "min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 py-8 px-4"}>
        <div className="container mx-auto max-w-md">
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

          <SwipeableCard 
            profile={currentProfile} 
            onSwipe={handleSwipe}
            onProfileOpen={() => setModalProfile(currentProfile)}
          />

          <p className="text-center text-muted-foreground mt-4 text-sm">
            {profiles.length - currentIndex - 1} profiles remaining
          </p>
        </div>
        
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
          onOpenChange={setShowMatchCelebration}
          matchedProfile={matchedProfile}
          currentUserAvatar={currentUserProfile?.avatar_url || null}
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
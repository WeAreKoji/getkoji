import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, LogOut, SlidersHorizontal } from "lucide-react";
import BottomNav from "@/components/navigation/BottomNav";
import SwipeableCard from "@/components/discover/SwipeableCard";
import { PageTransition } from "@/components/transitions/PageTransition";
import { ProfileCardSkeleton } from "@/components/shared/SkeletonLoader";
import { haptics } from "@/lib/native";
import { useIsMobile } from "@/hooks/use-mobile";
import { ClientRateLimiter } from "@/lib/rate-limit-client";
import logo from "@/assets/logo.png";
interface Profile {
  id: string;
  display_name: string;
  bio: string | null;
  age: number;
  city: string | null;
  avatar_url: string | null;
  intent: string;
}
const Discover = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const {
    toast
  } = useToast();
  useEffect(() => {
    checkUser();
  }, []);
  const checkUser = async () => {
    const {
      data: {
        user
      }
    } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
    } else {
      setUser(user);
      // Load profiles after user is set
      await loadProfiles(user.id);
    }
  };
  const loadProfiles = async (userId: string) => {
    try {
      // Use RPC function for smart filtering (excludes own profile and already swiped)
      const {
        data,
        error
      } = await supabase.rpc("get_discover_profiles", {
        user_id: userId,
        max_count: 10
      });
      if (error) throw error;
      setProfiles(data || []);
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
    return <div className={isMobile ? "min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/5 px-4 pb-24" : "min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/5 px-4"}>
        <div className="text-center max-w-md">
          <Sparkles className="w-16 h-16 mx-auto mb-4 text-primary animate-pulse" />
          <h2 className="text-2xl font-bold mb-2">You're Early! 🎉</h2>
          <p className="text-muted-foreground mb-4">
            No other profiles are available right now. You're one of the first members!
          </p>
          <p className="text-sm text-muted-foreground mb-6">
            Check back soon as more people join the community, or invite friends to get started.
          </p>
          
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
              src={logo} 
              alt="Koji" 
              className="h-10 w-auto"
            />
            <div className="flex gap-2">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => navigate('/settings/discovery')} 
                aria-label="Discovery settings"
              >
                <SlidersHorizontal className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon" onClick={handleLogout} aria-label="Log out">
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>

          <SwipeableCard profile={currentProfile} onSwipe={handleSwipe} />

          <p className="text-center text-muted-foreground mt-4 text-sm">
            {profiles.length - currentIndex - 1} profiles remaining
          </p>
        </div>
        
        {isMobile && <BottomNav />}
      </div>
    </PageTransition>
  );
};

export default Discover;
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, LogOut } from "lucide-react";
import BottomNav from "@/components/navigation/BottomNav";
import SwipeableCard from "@/components/discover/SwipeableCard";
import { PageTransition } from "@/components/transitions/PageTransition";
import { haptics } from "@/lib/native";
import { useIsMobile } from "@/hooks/use-mobile";
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
    if (!currentProfile || !user) return;
    try {
      const {
        error
      } = await supabase.from("swipes").insert({
        swiper_id: user.id,
        swiped_id: currentProfile.id,
        is_like: isLike
      });
      if (error) throw error;
      if (isLike) {
        haptics.success();
        toast({
          title: "Liked! 💜",
          description: "You'll be notified if it's a match!"
        });
      }
      setCurrentIndex(prev => prev + 1);
    } catch (error: any) {
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
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading profiles...</p>
        </div>
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
            <h1 className="text-2xl font-bold text-gradient-hero">Koji</h1>
            <Button variant="ghost" size="icon" onClick={handleLogout} aria-label="Log out">
              <LogOut className="w-5 h-5" />
            </Button>
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
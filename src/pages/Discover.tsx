import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Heart, X, MapPin, Sparkles, LogOut } from "lucide-react";
import BottomNav from "@/components/navigation/BottomNav";

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
  const { toast } = useToast();

  useEffect(() => {
    checkUser();
    loadProfiles();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
    } else {
      setUser(user);
    }
  };

  const loadProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .limit(10);

      if (error) throw error;
      setProfiles(data || []);
    } catch (error: any) {
      toast({
        title: "Error loading profiles",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSwipe = async (isLike: boolean) => {
    const currentProfile = profiles[currentIndex];
    if (!currentProfile || !user) return;

    try {
      const { error } = await supabase.from("swipes").insert({
        swiper_id: user.id,
        swiped_id: currentProfile.id,
        is_like: isLike,
      });

      if (error) throw error;

      if (isLike) {
        toast({
          title: "Liked! 💜",
          description: "You'll be notified if it's a match!",
        });
      }

      setCurrentIndex((prev) => prev + 1);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const currentProfile = profiles[currentIndex];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/5">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading profiles...</p>
        </div>
      </div>
    );
  }

  if (!currentProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-secondary/5">
        <div className="text-center">
          <Sparkles className="w-16 h-16 mx-auto mb-4 text-primary" />
          <h2 className="text-2xl font-bold mb-2">No more profiles!</h2>
          <p className="text-muted-foreground mb-6">Check back later for new matches.</p>
          <Button onClick={() => navigate("/")} variant="hero">
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-secondary/5 py-8 px-4 pb-24">
      <div className="container mx-auto max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gradient-hero">Koji</h1>
          <Button variant="ghost" size="icon" onClick={handleLogout}>
            <LogOut className="w-5 h-5" />
          </Button>
        </div>

        <div className="card-gradient-border overflow-hidden shadow-2xl">
          <div className="relative aspect-[3/4] bg-gradient-to-br from-muted to-muted/50">
            {currentProfile.avatar_url ? (
              <img
                src={currentProfile.avatar_url}
                alt={currentProfile.display_name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-8xl">👤</div>
              </div>
            )}
            
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 text-white">
              <h2 className="text-3xl font-bold mb-2">
                {currentProfile.display_name}, {currentProfile.age}
              </h2>
              {currentProfile.city && (
                <div className="flex items-center gap-2 mb-3">
                  <MapPin className="w-4 h-4" />
                  <span>{currentProfile.city}</span>
                </div>
              )}
              {currentProfile.bio && (
                <p className="text-white/90 mb-3">{currentProfile.bio}</p>
              )}
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="bg-white/20 backdrop-blur-sm border-white/30">
                  {currentProfile.intent.replace("_", " ")}
                </Badge>
              </div>
            </div>
          </div>

          <div className="p-6 flex justify-center gap-6">
            <Button
              size="icon"
              variant="swipe"
              className="w-16 h-16 rounded-full border-2 border-destructive/20 hover:border-destructive hover:bg-destructive/10"
              onClick={() => handleSwipe(false)}
            >
              <X className="w-8 h-8 text-destructive" />
            </Button>
            <Button
              size="icon"
              variant="swipe"
              className="w-16 h-16 rounded-full border-2 border-primary/20 hover:border-primary hover:bg-primary/10"
              onClick={() => handleSwipe(true)}
            >
              <Heart className="w-8 h-8 text-primary" />
            </Button>
          </div>
        </div>

        <p className="text-center text-muted-foreground mt-4 text-sm">
          {profiles.length - currentIndex - 1} profiles remaining
        </p>
      </div>
      
      <BottomNav />
    </div>
  );
};

export default Discover;
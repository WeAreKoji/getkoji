import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import BottomNav from "@/components/navigation/BottomNav";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { ProfileHero } from "@/components/profile/ProfileHero";
import { ProfileStats } from "@/components/profile/ProfileStats";
import { ProfileActions } from "@/components/profile/ProfileActions";
import { ProfileInfo } from "@/components/profile/ProfileInfo";
import { PageTransition } from "@/components/transitions/PageTransition";
import { Link } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { SafeAreaView } from "@/components/layout/SafeAreaView";

interface Profile {
  id: string;
  display_name: string;
  age: number;
  city: string | null;
  bio: string | null;
  avatar_url: string | null;
  intent: string;
}

interface Photo {
  id: string;
  photo_url: string;
  order_index: number;
}

interface Interest {
  id: string;
  name: string;
  category: string;
}

const Profile = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [interests, setInterests] = useState<Interest[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [isCreator, setIsCreator] = useState(false);

  useEffect(() => {
    checkAuth();
  }, [userId]);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }

    // If no userId provided, show own profile
    const profileId = userId || user.id;
    setIsOwnProfile(profileId === user.id);

    // Check if user is a creator
    if (profileId === user.id) {
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "creator")
        .single();
      
      setIsCreator(!!roleData);
    }
    
    await fetchProfile(profileId);
  };

  const fetchProfile = async (profileId: string) => {
    try {
      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", profileId)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData);

      // Fetch photos
      const { data: photosData, error: photosError } = await supabase
        .from("profile_photos")
        .select("*")
        .eq("user_id", profileId)
        .order("order_index", { ascending: true });

      if (photosError) throw photosError;
      setPhotos(photosData || []);

      // Fetch interests
      const { data: userInterests, error: interestsError } = await supabase
        .from("user_interests")
        .select("interest_id, interests(id, name, category)")
        .eq("user_id", profileId);

      if (interestsError) throw interestsError;

      const interestsData = userInterests
        .map((ui: any) => ui.interests)
        .filter(Boolean);
      setInterests(interestsData);
    } catch (error) {
      console.error("Error fetching profile:", error);
      navigate("/discover");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) return null;

  return (
    <PageTransition>
      <SafeAreaView bottom={false}>
        <div className="min-h-screen bg-background pb-20">
          {/* Header */}
          <ProfileHeader
            isOwnProfile={isOwnProfile}
            isCreator={isCreator}
            userId={profile.id}
            displayName={profile.display_name}
          />

          {/* Hero Section with Photos */}
          <ProfileHero
            photos={photos}
            displayName={profile.display_name}
            age={profile.age}
            city={profile.city}
            isCreator={isCreator}
          />

          {/* Content */}
          <div className={isMobile ? "px-4 py-4 space-y-4" : "container max-w-2xl mx-auto px-6 py-6 space-y-4"}>
            {/* Stats - Only for creators */}
            {isCreator && <ProfileStats userId={profile.id} isCreator={isCreator} />}

            {/* Action Buttons - Only for viewing others' profiles */}
            {!isOwnProfile && (
              <ProfileActions userId={profile.id} displayName={profile.display_name} />
            )}

            {/* Edit Button - Only for own profile */}
            {isOwnProfile && (
              <Link to="/profile/edit" className="block">
                <Button size={isMobile ? "default" : "lg"} className={isMobile ? "w-full h-11 text-sm font-semibold" : "w-full h-12 text-base font-semibold shadow-md"}>
                  <Edit className={isMobile ? "w-4 h-4 mr-2" : "w-5 h-5 mr-2"} />
                  Edit Profile
                </Button>
              </Link>
            )}

            {/* Profile Info */}
            <ProfileInfo bio={profile.bio} intent={profile.intent} interests={interests} />
          </div>

          <BottomNav />
        </div>
      </SafeAreaView>
    </PageTransition>
  );
};

export default Profile;

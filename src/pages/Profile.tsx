import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ArrowLeft, MapPin, Loader2, Edit, LayoutDashboard, CreditCard } from "lucide-react";
import BottomNav from "@/components/navigation/BottomNav";
import PhotoGrid from "@/components/profile/PhotoGrid";

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
    <div className="min-h-screen bg-background pb-20">
      <div className="container max-w-2xl mx-auto">
        {/* Header */}
        <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border z-10 px-4 py-3 flex items-center justify-between">
          <Link to="/discover" aria-label="Back to discover">
            <ArrowLeft className="w-6 h-6 text-foreground hover:text-primary transition-colors" />
          </Link>
          {isOwnProfile && (
            <div className="flex gap-2">
              <Link to="/subscriptions">
                <Button variant="ghost" size="sm">
                  <CreditCard className="w-4 h-4 mr-2" />
                  Subscriptions
                </Button>
              </Link>
              {isCreator && (
                <Link to="/creator/dashboard">
                  <Button variant="ghost" size="sm">
                    <LayoutDashboard className="w-4 h-4 mr-2" />
                    Dashboard
                  </Button>
                </Link>
              )}
              <Link to="/profile/edit">
                <Button variant="ghost" size="sm">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              </Link>
            </div>
          )}
        </div>

        <div className="px-4 py-6 space-y-6">
          {/* Photos */}
          <Card className="p-4">
            <PhotoGrid photos={photos} />
          </Card>

          {/* Info */}
          <Card className="p-6 space-y-4">
            <div>
              <h1 className="text-3xl font-bold mb-1">
                {profile.display_name}, {profile.age}
              </h1>
              {profile.city && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  <span>{profile.city}</span>
                </div>
              )}
            </div>

            {profile.bio && (
              <div>
                <h3 className="font-semibold mb-2">About</h3>
                <p className="text-muted-foreground">{profile.bio}</p>
              </div>
            )}

            <div>
              <h3 className="font-semibold mb-2">Intent</h3>
              <Badge variant="secondary">
                {profile.intent.replace(/_/g, " ")}
              </Badge>
            </div>

            {interests.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">Interests</h3>
                <div className="flex flex-wrap gap-2">
                  {interests.map((interest) => (
                    <Badge key={interest.id} variant="outline">
                      {interest.name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default Profile;

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Edit, Calendar, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import BottomNav from "@/components/navigation/BottomNav";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { ProfileHero } from "@/components/profile/ProfileHero";
import { ProfileStats } from "@/components/profile/ProfileStats";
import { ProfileActions } from "@/components/profile/ProfileActions";
import { ProfileInfo } from "@/components/profile/ProfileInfo";
import { ProfileInfoBar } from "@/components/profile/ProfileInfoBar";
import { ProfileTabs } from "@/components/profile/ProfileTabs";
import { ProfilePreviewModal } from "@/components/profile/ProfilePreviewModal";
import { ProfileAnalytics } from "@/components/profile/ProfileAnalytics";
import { ReferralCard } from "@/components/profile/ReferralCard";
import { ProfileCompleteness } from "@/components/profile/ProfileCompleteness";
import { ProfileAccordion } from "@/components/profile/ProfileAccordion";
import { CreatorSubscriptionCard } from "@/components/profile/CreatorSubscriptionCard";
import { PageTransition } from "@/components/transitions/PageTransition";
import { Link } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { SafeAreaView } from "@/components/layout/SafeAreaView";
import { format } from "date-fns";
import { logError } from "@/lib/error-logger";

interface Profile {
  id: string;
  display_name: string;
  username: string | null;
  email: string;
  age: number;
  city: string | null;
  bio: string | null;
  avatar_url: string | null;
  intent: string;
  gender: string | null;
  interested_in_gender: string[] | null;
  created_at?: string;
  privacy_settings?: any;
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
  const [memberSince, setMemberSince] = useState<string>("");
  const [stats, setStats] = useState<{ subscribers?: number; posts?: number; earnings?: number }>({});
  const [statsLoading, setStatsLoading] = useState(true);
  const [showPreview, setShowPreview] = useState(false);
  const [creatorProfile, setCreatorProfile] = useState<{
    welcomeVideoUrl?: string | null;
    coverImageUrl?: string | null;
    tagline?: string | null;
  }>({});

  useEffect(() => {
    checkAuth();
  }, [userId]);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }

    // Resolve username to userId if username is provided
    let profileId = userId;
    if (userId && userId.startsWith('@')) {
      const username = userId.substring(1);
      const { data: profileData } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", username)
        .maybeSingle();
      
      if (profileData) {
        profileId = profileData.id;
      } else {
        navigate("/discover");
        return;
      }
    }

    // If no userId provided, show own profile
    profileId = profileId || user.id;
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
      // Track profile view
      const { data: { user } } = await supabase.auth.getUser();
      if (user && user.id !== profileId) {
        // Track view (fire and forget)
        supabase.from("profile_views").insert({
          profile_id: profileId,
          viewer_id: user.id
        }).then();
      }

      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", profileId)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData);
      
      // Format member since date
      if (profileData.created_at) {
        setMemberSince(format(new Date(profileData.created_at), "MMMM yyyy"));
      }

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

      // Fetch creator profile data
      const { data: creatorData } = await supabase
        .from("creator_profiles")
        .select("welcome_video_url, cover_image_url, tagline")
        .eq("user_id", profileId)
        .maybeSingle();

      if (creatorData) {
        setCreatorProfile({
          welcomeVideoUrl: creatorData.welcome_video_url,
          coverImageUrl: creatorData.cover_image_url,
          tagline: creatorData.tagline,
        });
        setIsCreator(true);
      }

      // Fetch stats for creators
      if (isOwnProfile && isCreator) {
        const [subsResult, postsResult] = await Promise.all([
          supabase
            .from("subscriptions")
            .select("id", { count: "exact", head: true })
            .eq("creator_id", profileId)
            .eq("status", "active"),
          supabase
            .from("creator_posts")
            .select("id", { count: "exact", head: true })
            .eq("creator_id", profileId),
        ]);

        setStats({
          subscribers: subsResult.count || 0,
          posts: postsResult.count || 0,
          earnings: 0,
        });
      }
      setStatsLoading(false);
    } catch (error) {
      logError(error, 'Profile.fetchProfile');
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
      <SafeAreaView bottom={isMobile}>
        <div className={isMobile ? "min-h-screen bg-background pb-20" : "min-h-screen bg-background"}>
          {/* Header */}
          <ProfileHeader
            isOwnProfile={isOwnProfile}
            isCreator={isCreator}
            userId={profile.id}
            username={profile.username}
            displayName={profile.display_name}
            userEmail={profile.email}
          />

          {/* Hero Section with Photos */}
          <ProfileHero
            photos={photos}
            displayName={profile.display_name}
            age={profile.age}
            city={profile.city}
            isCreator={isCreator}
            welcomeVideoUrl={creatorProfile.welcomeVideoUrl}
            coverImageUrl={creatorProfile.coverImageUrl}
            tagline={creatorProfile.tagline}
          />

          {/* Content */}
          <div className={isMobile ? "px-4 py-4 space-y-4" : "container max-w-4xl mx-auto px-6 py-6"}>
            {isMobile ? (
              // Mobile: Single column layout with accordion
              <div className="space-y-4">
                {/* Profile Completeness for own profile */}
                {isOwnProfile && (
                  <ProfileCompleteness
                    profile={profile}
                    photosCount={photos.length}
                    interestsCount={interests.length}
                  />
                )}

                {/* Creator Subscription Card for visitors */}
                {!isOwnProfile && isCreator && (
                  <CreatorSubscriptionCard creatorId={profile.id} isOwnProfile={false} />
                )}

                {/* Action Buttons */}
                {!isOwnProfile ? (
                  <ProfileActions userId={profile.id} displayName={profile.display_name} />
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      variant="outline"
                      size="default"
                      onClick={() => setShowPreview(true)}
                      className="h-11"
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Preview
                    </Button>
                    <Link to="/profile/edit" className="block">
                      <Button size="default" className="w-full h-11">
                        <Edit className="w-4 h-4 mr-2" />
                        Edit Profile
                      </Button>
                    </Link>
                  </div>
                )}

                {/* Referral & Analytics for own profile */}
                {isOwnProfile && (
                  <>
                    <ReferralCard userId={profile.id} />
                    <ProfileAnalytics userId={profile.id} />
                  </>
                )}

                {/* Mobile Accordion */}
                <ProfileAccordion
                  bio={profile.bio}
                  intent={profile.intent}
                  interests={interests}
                  photos={photos}
                  isCreator={isCreator}
                  userId={profile.id}
                  gender={profile.gender}
                  interestedInGender={profile.interested_in_gender}
                  isOwnProfile={isOwnProfile}
                />
              </div>
            ) : (
              // Desktop: Modern layout with tabs
              <div className="space-y-4">
                {/* Profile Completeness for own profile */}
                {isOwnProfile && (
                  <ProfileCompleteness
                    profile={profile}
                    photosCount={photos.length}
                    interestsCount={interests.length}
                  />
                )}

                {/* Info Bar with Member Since, Stats, and Action Button */}
                <ProfileInfoBar
                  memberSince={memberSince}
                  username={profile.username}
                  userId={profile.id}
                  isCreator={isCreator}
                  stats={stats}
                  loading={statsLoading}
                >
                  {/* Action Button */}
                  {!isOwnProfile ? (
                    <ProfileActions userId={profile.id} displayName={profile.display_name} />
                  ) : (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowPreview(true)}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View as Public
                      </Button>
                      <Link to="/profile/edit">
                        <Button size="icon">
                          <Edit className="w-4 h-4" />
                        </Button>
                      </Link>
                    </div>
                  )}
                </ProfileInfoBar>

                {/* Creator Subscription Card for visitors */}
                {!isOwnProfile && isCreator && (
                  <CreatorSubscriptionCard creatorId={profile.id} isOwnProfile={false} />
                )}

                {/* Referral Card for own profile */}
                {isOwnProfile && <ReferralCard userId={profile.id} />}
                
                {/* Analytics for own profile */}
                {isOwnProfile && <ProfileAnalytics userId={profile.id} />}

                {/* Profile Tabs - About, Photos, Posts */}
                <ProfileTabs
                  bio={profile.bio}
                  intent={profile.intent}
                  interests={interests}
                  photos={photos}
                  isCreator={isCreator}
                  userId={profile.id}
                  gender={profile.gender}
                  interestedInGender={profile.interested_in_gender}
                  isOwnProfile={isOwnProfile}
                />
              </div>
            )}
          </div>

          {/* Preview Modal */}
          <ProfilePreviewModal
            open={showPreview}
            onOpenChange={setShowPreview}
            profile={profile}
            photos={photos}
            interests={interests}
            isCreator={isCreator}
          />

          {isMobile && <BottomNav />}
        </div>
      </SafeAreaView>
    </PageTransition>
  );
};

export default Profile;

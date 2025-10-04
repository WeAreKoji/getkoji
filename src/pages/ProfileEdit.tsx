import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Loader2, HelpCircle, Video, Image as ImageIcon, Lightbulb } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import PhotoUpload from "@/components/profile/PhotoUpload";
import { UsernameInput } from "@/components/profile/UsernameInput";
import { logError } from "@/lib/error-logger";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { SafeAreaView } from "@/components/layout/SafeAreaView";
import { useIsMobile } from "@/hooks/use-mobile";

interface Photo {
  id?: string;
  photo_url: string;
  order_index: number;
  isNew?: boolean;
}

interface Interest {
  id: string;
  name: string;
  category: string;
}

const ProfileEdit = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [age, setAge] = useState(18);
  const [city, setCity] = useState("");
  const [bio, setBio] = useState("");
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [interestedInGender, setInterestedInGender] = useState<string[]>(['male']);
  
  const [allInterests, setAllInterests] = useState<Interest[]>([]);
  const [selectedInterestIds, setSelectedInterestIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Creator-specific fields
  const [isCreator, setIsCreator] = useState(false);
  const [tagline, setTagline] = useState("");
  const [showcaseBio, setShowcaseBio] = useState("");
  const [welcomeVideoUrl, setWelcomeVideoUrl] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }
    setUserId(user.id);
    await Promise.all([
      fetchProfile(user.id),
      fetchInterests(),
      checkCreatorStatus(user.id),
    ]);
  };

  const checkCreatorStatus = async (userId: string) => {
    try {
      const { data } = await supabase
        .from("creator_profiles")
        .select("tagline, showcase_bio, welcome_video_url, cover_image_url")
        .eq("user_id", userId)
        .maybeSingle();

      if (data) {
        setIsCreator(true);
        setTagline(data.tagline || "");
        setShowcaseBio(data.showcase_bio || "");
        setWelcomeVideoUrl(data.welcome_video_url || "");
        setCoverImageUrl(data.cover_image_url || "");
      }
    } catch (error) {
      logError(error, 'ProfileEdit.checkCreatorStatus');
    }
  };

  const fetchProfile = async (userId: string) => {
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (profile) {
        setDisplayName(profile.display_name);
        setUsername(profile.username || "");
        setAge(profile.age);
        setCity(profile.city || "");
        setBio(profile.bio || "");
        setInterestedInGender(profile.interested_in_gender || ['male']);
      }

      const { data: photosData } = await supabase
        .from("profile_photos")
        .select("*")
        .eq("user_id", userId)
        .order("order_index", { ascending: true });

      setPhotos(photosData || []);

      const { data: userInterests } = await supabase
        .from("user_interests")
        .select("interest_id")
        .eq("user_id", userId);

      setSelectedInterestIds(userInterests?.map((ui) => ui.interest_id) || []);
    } catch (error) {
      logError(error, 'ProfileEdit.fetchProfile');
    } finally {
      setLoading(false);
    }
  };

  const fetchInterests = async () => {
    const { data } = await supabase
      .from("interests")
      .select("*")
      .order("category")
      .order("name");

    setAllInterests(data || []);
  };

  const toggleInterest = (interestId: string) => {
    setSelectedInterestIds((prev) =>
      prev.includes(interestId)
        ? prev.filter((id) => id !== interestId)
        : [...prev, interestId]
    );
  };

  const handleSave = async () => {
    if (!userId) return;

    if (selectedInterestIds.length < 5) {
      toast({
        title: "Not enough interests",
        description: "Please select at least 5 interests",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);

    try {
      // Update profile
      const updateData: any = {
        display_name: displayName,
        age,
        city,
        bio,
        interested_in_gender: interestedInGender,
      };
      
      // Only update username if it's changed
      if (username) {
        updateData.username = username;
        updateData.username_updated_at = new Date().toISOString();
      }

      const { error: profileError } = await supabase
        .from("profiles")
        .update(updateData)
        .eq("id", userId);

      if (profileError) throw profileError;

      // Handle photo updates with storage cleanup
      const oldPhotos = photos.filter((p) => p.id && !p.isNew);
      const oldPhotoIds = oldPhotos.map((p) => p.id!);
      
      // Delete old photos from storage and database
      if (oldPhotoIds.length > 0) {
        // Get old photo URLs to delete from storage
        const { data: oldPhotoData } = await supabase
          .from("profile_photos")
          .select("photo_url")
          .in("id", oldPhotoIds);

        if (oldPhotoData) {
          // Extract paths from URLs and delete from storage
          const filePaths = oldPhotoData
            .map((p) => {
              const url = new URL(p.photo_url);
              return url.pathname.split('/profile-photos/')[1];
            })
            .filter(Boolean);

          if (filePaths.length > 0) {
            await supabase.storage.from("profile-photos").remove(filePaths);
          }
        }

        // Delete from database
        await supabase.from("profile_photos").delete().in("id", oldPhotoIds);
      }

      // Insert new photos
      const newPhotos = photos.filter((p) => p.isNew || !p.id);
      if (newPhotos.length > 0) {
        const { error: photosError } = await supabase
          .from("profile_photos")
          .insert(
            newPhotos.map((photo) => ({
              user_id: userId,
              photo_url: photo.photo_url,
              order_index: photo.order_index,
            }))
          );

        if (photosError) throw photosError;
      }

      // Update interests
      await supabase.from("user_interests").delete().eq("user_id", userId);

      const { error: interestsError } = await supabase
        .from("user_interests")
        .insert(
          selectedInterestIds.map((interestId) => ({
            user_id: userId,
            interest_id: interestId,
          }))
        );

      if (interestsError) throw interestsError;

      // Update creator profile if applicable
      if (isCreator) {
        const { error: creatorError } = await supabase
          .from("creator_profiles")
          .update({
            tagline: tagline || null,
            showcase_bio: showcaseBio || null,
            welcome_video_url: welcomeVideoUrl || null,
            cover_image_url: coverImageUrl || null,
          })
          .eq("user_id", userId);

        if (creatorError) throw creatorError;
      }

      toast({
        title: "Profile updated!",
        description: "Your changes have been saved.",
      });

      navigate(`/profile/${userId}`);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const filteredInterests = allInterests.filter((interest) =>
    interest.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const groupedInterests = filteredInterests.reduce((acc, interest) => {
    if (!acc[interest.category]) {
      acc[interest.category] = [];
    }
    acc[interest.category].push(interest);
    return acc;
    }, {} as Record<string, Interest[]>);

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("video/")) {
      toast({
        title: "Invalid file type",
        description: "Please upload a video file",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Video must be under 10MB",
        variant: "destructive",
      });
      return;
    }

    setIsUploadingMedia(true);

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${userId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("creator-welcome-videos")
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("creator-welcome-videos")
        .getPublicUrl(fileName);

      setWelcomeVideoUrl(publicUrl);

      toast({
        title: "Success",
        description: "Welcome video uploaded successfully",
      });
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsUploadingMedia(false);
    }
  };

  const handleCoverImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file",
        variant: "destructive",
      });
      return;
    }

    setIsUploadingMedia(true);

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${userId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("creator-content")
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("creator-content")
        .getPublicUrl(fileName);

      setCoverImageUrl(publicUrl);

      toast({
        title: "Success",
        description: "Cover image uploaded successfully",
      });
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsUploadingMedia(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-[calc(env(safe-area-inset-bottom)+80px)] md:pb-6">
      <div className="container max-w-2xl mx-auto">
        {/* Header */}
        <div className="sticky z-10" style={{ top: 'env(safe-area-inset-top, 0px)' }}>
          <SafeAreaView top={true} bottom={false}>
            <div className="bg-background/95 backdrop-blur-sm border-b border-border px-4 py-3 flex items-center justify-between">
              <Link to={`/profile/${userId}`} aria-label="Back to profile">
                <ArrowLeft className="w-6 h-6 text-foreground hover:text-primary transition-colors" />
              </Link>
              <h1 className="font-semibold">Edit Profile</h1>
              <Button onClick={handleSave} disabled={saving} size={isMobile ? "default" : "sm"} className="min-h-[44px] min-w-[44px]">
                {saving ? "Saving..." : "Save"}
              </Button>
            </div>
          </SafeAreaView>
        </div>

        <div className="px-4 py-6 space-y-6">
          {/* Photos */}
          <Card className="p-4">
            <h3 className="font-semibold mb-4">Photos</h3>
            <PhotoUpload photos={photos} onPhotosChange={setPhotos} userId={userId || ""} />
          </Card>

          {/* Basic Info */}
          <Card className="p-4 md:p-6 space-y-4">
            <h3 className="font-semibold text-base md:text-lg">Basic Information</h3>

            <div className="space-y-2">
              <Label htmlFor="displayName" className="text-sm md:text-base">Display Name</Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your name"
                className="h-11"
                onFocus={(e) => isMobile && e.currentTarget.scrollIntoView({ behavior: 'smooth', block: 'center' })}
              />
            </div>

            <UsernameInput 
              value={username} 
              onChange={setUsername}
              currentUsername={username}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="age" className="text-sm md:text-base">Age</Label>
                <Input
                  id="age"
                  type="number"
                  min="18"
                  max="120"
                  value={age}
                  onChange={(e) => setAge(parseInt(e.target.value) || 18)}
                  className="h-11"
                  onFocus={(e) => isMobile && e.currentTarget.scrollIntoView({ behavior: 'smooth', block: 'center' })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="city" className="text-sm md:text-base">City</Label>
                <Input
                  id="city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Your city"
                  className="h-11"
                  onFocus={(e) => isMobile && e.currentTarget.scrollIntoView({ behavior: 'smooth', block: 'center' })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio" className="text-sm md:text-base">Bio</Label>
              <Textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell others about yourself..."
                rows={4}
                maxLength={500}
                className="text-base min-h-[100px] md:min-h-[80px]"
                onFocus={(e) => isMobile && e.currentTarget.scrollIntoView({ behavior: 'smooth', block: 'center' })}
              />
              <p className="text-xs text-muted-foreground text-right">
                {bio.length}/500
              </p>
            </div>
          </Card>

          {/* Interested In */}
          <Card className="p-4 md:p-6 space-y-4">
            <h3 className="font-semibold text-base md:text-lg">Interested In</h3>
            <RadioGroup
              value={
                interestedInGender.length === 2 &&
                interestedInGender.includes('male') &&
                interestedInGender.includes('female')
                  ? 'everyone'
                  : interestedInGender[0] || 'male'
              }
              onValueChange={(value) => {
                if (value === 'everyone') {
                  setInterestedInGender(['male', 'female']);
                } else {
                  setInterestedInGender([value]);
                }
              }}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="male" id="edit_interested_male" />
                <Label htmlFor="edit_interested_male" className="font-normal cursor-pointer">Men</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="female" id="edit_interested_female" />
                <Label htmlFor="edit_interested_female" className="font-normal cursor-pointer">Women</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="everyone" id="edit_interested_everyone" />
                <Label htmlFor="edit_interested_everyone" className="font-normal cursor-pointer">Everyone</Label>
              </div>
            </RadioGroup>
          </Card>

          {/* Interests */}
          <Card className="p-4 md:p-6 space-y-4">
            <div>
              <h3 className="font-semibold mb-1 text-base md:text-lg">Interests</h3>
              <p className="text-sm text-muted-foreground">
                {selectedInterestIds.length} selected (minimum 5)
              </p>
            </div>

            <Input
              placeholder="Search interests..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-11"
              onFocus={(e) => isMobile && e.currentTarget.scrollIntoView({ behavior: 'smooth', block: 'center' })}
            />

            <div className="space-y-4 md:max-h-[400px] md:overflow-y-auto">
              {Object.entries(groupedInterests).map(([category, interests]) => (
                <div key={category}>
                  <h4 className="text-sm font-semibold text-muted-foreground uppercase mb-2 md:sticky md:top-0 bg-background py-1">
                    {category}
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {interests.map((interest) => {
                      const isSelected = selectedInterestIds.includes(interest.id);
                      return (
                        <Badge
                          key={interest.id}
                          variant={isSelected ? "default" : "outline"}
                          className="cursor-pointer touch-manipulation h-9 md:h-auto px-3 md:px-2.5 text-sm md:text-xs"
                          onClick={() => toggleInterest(interest.id)}
                        >
                          {interest.name}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Creator Settings - Only visible to creators */}
          {isCreator && (
            <Card className="p-4 md:p-6 space-y-4 border-primary/20">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold text-base md:text-lg">Creator Settings</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Customize how your creator profile appears to potential subscribers
                  </p>
                </div>
              </div>

              {/* Creator Tips Collapsible */}
              <Collapsible defaultOpen>
                <CollapsibleTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full justify-start gap-2 text-sm md:text-base">
                    <Lightbulb className="w-4 h-4" />
                    Tips for an Engaging Creator Profile
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-3 space-y-2 text-sm text-muted-foreground p-3 md:p-4 bg-primary/5 rounded-lg border border-primary/10">
                  <p>✨ <strong>Welcome video:</strong> Creators with videos get 3x more profile views</p>
                  <p>🎯 <strong>Tagline:</strong> Mention what makes your content unique (e.g., "Daily fitness routines & meal plans")</p>
                  <p>📝 <strong>Showcase bio:</strong> Focus on what subscribers will get, not just who you are</p>
                  <p>🖼️ <strong>Cover image:</strong> Use a high-quality image that represents your brand</p>
                </CollapsibleContent>
              </Collapsible>

              {/* Welcome Video */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="welcome-video" className="text-sm md:text-base">Welcome Video</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="w-4 h-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>A 10-15 second video introducing yourself. Max 10MB. This significantly boosts profile engagement!</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <div className="flex flex-col gap-3">
                  <Input
                    id="welcome-video"
                    type="file"
                    accept="video/*"
                    onChange={handleVideoUpload}
                    disabled={isUploadingMedia}
                    className="cursor-pointer h-11"
                  />
                  {isUploadingMedia && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Uploading...
                    </div>
                  )}
                  {welcomeVideoUrl && (
                    <div className="w-full max-h-[300px] overflow-hidden rounded-lg border border-border bg-black">
                      <video
                        src={welcomeVideoUrl}
                        className="w-full h-full object-contain aspect-video"
                        controls
                        playsInline
                        preload="metadata"
                      />
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Recommended: 10-15 seconds, vertical or square format
                </p>
              </div>

              {/* Cover Image */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="cover-image" className="text-sm md:text-base">Cover Image</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="w-4 h-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>Shows when no video is available. Use a professional, eye-catching image.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <div className="flex flex-col gap-3">
                  <Input
                    id="cover-image"
                    type="file"
                    accept="image/*"
                    onChange={handleCoverImageUpload}
                    disabled={isUploadingMedia}
                    className="cursor-pointer h-11"
                  />
                  {coverImageUrl && (
                    <div className="w-full max-h-[300px] overflow-hidden rounded-lg border border-border">
                      <img
                        src={coverImageUrl}
                        alt="Cover preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  High-resolution image (min 800x800px recommended)
                </p>
              </div>

              {/* Tagline */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="tagline" className="text-sm md:text-base">Tagline</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="w-4 h-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>A catchy one-liner that describes your content. Make it specific!</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Input
                  id="tagline"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value.slice(0, 100))}
                  placeholder="e.g., Exclusive fitness content & meal plans"
                  maxLength={100}
                  className="h-11"
                  onFocus={(e) => isMobile && e.currentTarget.scrollIntoView({ behavior: 'smooth', block: 'center' })}
                />
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-1">
                  <p className="text-xs text-muted-foreground">
                    Example: "Daily workouts + nutrition tips for busy professionals"
                  </p>
                  <p className="text-xs font-medium text-primary whitespace-nowrap">
                    {tagline.length}/100
                  </p>
                </div>
              </div>

              {/* Showcase Bio */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="showcase-bio" className="text-sm md:text-base">Showcase Bio</Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="w-4 h-4 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p>Tell potential subscribers what they'll get. Focus on benefits, not just who you are.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Textarea
                  id="showcase-bio"
                  value={showcaseBio}
                  onChange={(e) => setShowcaseBio(e.target.value.slice(0, 300))}
                  placeholder="Write a compelling bio for the creators page..."
                  maxLength={300}
                  rows={4}
                  className="text-base min-h-[100px] md:min-h-[80px]"
                  onFocus={(e) => isMobile && e.currentTarget.scrollIntoView({ behavior: 'smooth', block: 'center' })}
                />
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-1">
                  <p className="text-xs text-muted-foreground flex-1">
                    Focus on: What content you create, posting frequency, and unique value
                  </p>
                  <p className="text-xs font-medium text-primary whitespace-nowrap">
                    {showcaseBio.length}/300
                  </p>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Mobile Bottom Save Bar */}
      {isMobile && (
        <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-border bg-background/95 backdrop-blur-sm">
          <SafeAreaView top={false} bottom={true}>
            <div className="px-4 py-3">
              <Button 
                onClick={handleSave} 
                disabled={saving} 
                size="lg"
                className="w-full min-h-[44px]"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </SafeAreaView>
        </div>
      )}
    </div>
  );
};

export default ProfileEdit;

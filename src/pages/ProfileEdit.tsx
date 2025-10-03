import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import PhotoUpload from "@/components/profile/PhotoUpload";
import { UsernameInput } from "@/components/profile/UsernameInput";
import { logError } from "@/lib/error-logger";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

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
    ]);
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-2xl mx-auto">
        {/* Header */}
        <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border z-10 px-4 py-3 flex items-center justify-between">
          <Link to={`/profile/${userId}`} aria-label="Back to profile">
            <ArrowLeft className="w-6 h-6 text-foreground hover:text-primary transition-colors" />
          </Link>
          <h1 className="font-semibold">Edit Profile</h1>
          <Button onClick={handleSave} disabled={saving} size="sm">
            {saving ? "Saving..." : "Save"}
          </Button>
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
                className="h-11 md:h-10"
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
                  className="h-11 md:h-10"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="city" className="text-sm md:text-base">City</Label>
                <Input
                  id="city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Your city"
                  className="h-11 md:h-10"
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
              className="h-11 md:h-10"
            />

            <div className="space-y-4 max-h-[500px] md:max-h-[400px] overflow-y-auto">
              {Object.entries(groupedInterests).map(([category, interests]) => (
                <div key={category}>
                  <h4 className="text-sm font-semibold text-muted-foreground uppercase mb-2 sticky top-0 bg-background py-1">
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
        </div>
      </div>
    </div>
  );
};

export default ProfileEdit;

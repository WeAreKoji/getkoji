import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Upload, Video, Image as ImageIcon, Loader2 } from "lucide-react";

interface CreatorCardCustomizationProps {
  creatorId: string;
  currentData?: {
    welcome_video_url?: string;
    cover_image_url?: string;
    tagline?: string;
    showcase_bio?: string;
  };
  onSave?: () => void;
}

export const CreatorCardCustomization = ({
  creatorId,
  currentData,
  onSave,
}: CreatorCardCustomizationProps) => {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [tagline, setTagline] = useState(currentData?.tagline || "");
  const [showcaseBio, setShowcaseBio] = useState(currentData?.showcase_bio || "");
  const [welcomeVideoUrl, setWelcomeVideoUrl] = useState(currentData?.welcome_video_url || "");
  const [coverImageUrl, setCoverImageUrl] = useState(currentData?.cover_image_url || "");

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("video/")) {
      toast({
        title: "Invalid file type",
        description: "Please upload a video file",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Video must be under 10MB",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${creatorId}/${Date.now()}.${fileExt}`;

      const { error: uploadError, data } = await supabase.storage
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
      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
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

    setIsUploading(true);

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${creatorId}/${Date.now()}.${fileExt}`;

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
      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);

    try {
      const { error } = await supabase
        .from("creator_profiles")
        .update({
          tagline: tagline || null,
          showcase_bio: showcaseBio || null,
          welcome_video_url: welcomeVideoUrl || null,
          cover_image_url: coverImageUrl || null,
        })
        .eq("user_id", creatorId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Your creator card has been updated",
      });

      onSave?.();
    } catch (error: any) {
      console.error("Save error:", error);
      toast({
        title: "Save failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Customize Your Creator Card</CardTitle>
        <CardDescription>
          Make your profile stand out on the creators page with a welcome video and custom content
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Welcome Video */}
        <div className="space-y-2">
          <Label htmlFor="welcome-video">Welcome Video (15 seconds, max 10MB)</Label>
          <div className="flex items-center gap-4">
            <Input
              id="welcome-video"
              type="file"
              accept="video/*"
              onChange={handleVideoUpload}
              disabled={isUploading}
              className="cursor-pointer"
            />
            {isUploading && <Loader2 className="w-4 h-4 animate-spin" />}
          </div>
          {welcomeVideoUrl && (
            <div className="mt-2">
              <video
                src={welcomeVideoUrl}
                className="w-full max-w-md rounded-lg"
                controls
              />
            </div>
          )}
        </div>

        {/* Cover Image */}
        <div className="space-y-2">
          <Label htmlFor="cover-image">Cover Image (fallback if no video)</Label>
          <div className="flex items-center gap-4">
            <Input
              id="cover-image"
              type="file"
              accept="image/*"
              onChange={handleCoverImageUpload}
              disabled={isUploading}
              className="cursor-pointer"
            />
            {isUploading && <Loader2 className="w-4 h-4 animate-spin" />}
          </div>
          {coverImageUrl && (
            <img
              src={coverImageUrl}
              alt="Cover preview"
              className="w-full max-w-md rounded-lg mt-2"
            />
          )}
        </div>

        {/* Tagline */}
        <div className="space-y-2">
          <Label htmlFor="tagline">Tagline (max 100 characters)</Label>
          <Input
            id="tagline"
            value={tagline}
            onChange={(e) => setTagline(e.target.value.slice(0, 100))}
            placeholder="e.g., Exclusive fitness content & meal plans"
            maxLength={100}
          />
          <p className="text-xs text-muted-foreground">
            {tagline.length}/100 characters
          </p>
        </div>

        {/* Showcase Bio */}
        <div className="space-y-2">
          <Label htmlFor="showcase-bio">Showcase Bio (max 300 characters)</Label>
          <Textarea
            id="showcase-bio"
            value={showcaseBio}
            onChange={(e) => setShowcaseBio(e.target.value.slice(0, 300))}
            placeholder="Write a compelling bio for the creators page..."
            maxLength={300}
            rows={4}
          />
          <p className="text-xs text-muted-foreground">
            {showcaseBio.length}/300 characters
          </p>
        </div>

        {/* Save Button */}
        <Button
          onClick={handleSave}
          disabled={isSaving || isUploading}
          className="w-full"
          size="lg"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Changes"
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, X, MapPin, Sparkles, BadgeCheck } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

interface Photo {
  id: string;
  photo_url: string;
  order_index: number;
}

interface LikeProfile {
  id: string;
  display_name: string;
  username: string | null;
  age: number;
  city: string | null;
  bio: string | null;
  avatar_url: string | null;
  is_creator: boolean;
  id_verified: boolean;
  photos: Photo[];
  interests: string[];
}

interface LikesYouProfileModalProps {
  profile: LikeProfile | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLikeBack: () => void;
  onPass: () => void;
  loading?: boolean;
}

export const LikesYouProfileModal = ({
  profile,
  open,
  onOpenChange,
  onLikeBack,
  onPass,
  loading,
}: LikesYouProfileModalProps) => {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const isMobile = useIsMobile();

  if (!profile) return null;

  const allPhotos: Photo[] = profile.photos?.length > 0
    ? profile.photos
    : profile.avatar_url
      ? [{ id: 'avatar', photo_url: profile.avatar_url, order_index: 0 }]
      : [];

  const handleLikeBack = () => {
    onLikeBack();
    onOpenChange(false);
  };

  const handlePass = () => {
    onPass();
    onOpenChange(false);
  };

  const content = (
    <div className="flex flex-col max-h-[90vh]">
      {/* Photo Carousel */}
      <div className="relative aspect-[3/4] max-h-[50vh] bg-gradient-to-br from-muted to-muted/50 flex-shrink-0">
        {allPhotos.length > 0 ? (
          <>
            <img
              src={allPhotos[currentPhotoIndex].photo_url}
              alt={`${profile.display_name} - Photo ${currentPhotoIndex + 1}`}
              className="w-full h-full object-cover"
            />

            {/* Photo indicators */}
            {allPhotos.length > 1 && (
              <div className="absolute top-4 left-0 right-0 flex gap-2 px-4">
                {allPhotos.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentPhotoIndex(idx)}
                    className={cn(
                      "flex-1 h-1 rounded-full transition-all",
                      idx === currentPhotoIndex ? "bg-white" : "bg-white/30"
                    )}
                    aria-label={`View photo ${idx + 1}`}
                  />
                ))}
              </div>
            )}

            {/* Creator Badge */}
            {profile.is_creator && (
              <div className="absolute top-8 left-4 flex items-center gap-2 bg-accent/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-lg">
                <Sparkles className="w-4 h-4 text-white" />
                <span className="text-white font-semibold text-sm">Creator</span>
                {profile.id_verified && (
                  <BadgeCheck className="w-4 h-4 text-white" />
                )}
              </div>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-8xl">👤</div>
          </div>
        )}
      </div>

      {/* Profile Info */}
      <div className="p-6 space-y-4 overflow-y-auto">
        {/* Name and Age */}
        <div>
          <h2 className="text-2xl font-bold mb-1">
            {profile.display_name}, {profile.age}
          </h2>
          {profile.username && (
            <p className="text-muted-foreground">@{profile.username}</p>
          )}
          {profile.city && (
            <div className="flex items-center gap-2 text-muted-foreground mt-2">
              <MapPin className="w-4 h-4" />
              <span>{profile.city}</span>
            </div>
          )}
        </div>

        {/* Bio */}
        {profile.bio && (
          <div>
            <h3 className="font-semibold mb-2">About</h3>
            <p className="text-muted-foreground">{profile.bio}</p>
          </div>
        )}

        {/* Badges */}
        <div className="flex flex-wrap gap-2">
          {profile.id_verified && (
            <Badge variant="outline" className="bg-green-500/20 border-green-500 text-green-500">
              <BadgeCheck className="w-3 h-3 mr-1" />
              Verified
            </Badge>
          )}
          {profile.is_creator && (
            <Badge variant="outline" className="bg-purple-500/20 border-purple-500 text-purple-500">
              <Sparkles className="w-3 h-3 mr-1" />
              Creator
            </Badge>
          )}
        </div>

        {/* Interests */}
        {profile.interests?.length > 0 && (
          <div>
            <h3 className="font-semibold mb-2">Interests</h3>
            <div className="flex flex-wrap gap-2">
              {profile.interests.map((interest) => (
                <Badge key={interest} variant="secondary">
                  {interest}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4 pt-4">
          <Button
            size="lg"
            variant="outline"
            className="flex-1 border-2 border-destructive/20 hover:border-destructive hover:bg-destructive/10"
            onClick={handlePass}
            disabled={loading}
          >
            <X className="w-5 h-5 mr-2 text-destructive" />
            Pass
          </Button>
          <Button
            size="lg"
            className="flex-1"
            onClick={handleLikeBack}
            disabled={loading}
          >
            <Heart className="w-5 h-5 mr-2" fill="currentColor" />
            Like Back
          </Button>
        </div>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[95vh]">
          {content}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 overflow-hidden">
        <DialogHeader className="sr-only">
          <h2>{profile.display_name}'s Profile</h2>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
};
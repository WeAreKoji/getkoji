import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, X, MapPin, Sparkles, BadgeCheck } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface Profile {
  id: string;
  display_name: string;
  username: string | null;
  bio: string | null;
  age: number;
  city: string | null;
  avatar_url: string | null;
  intent: string;
  photos: Array<{ id: string; photo_url: string; order_index: number }>;
  photo_count: number;
  interests: string[];
  is_creator: boolean;
  creator_subscription_price: number | null;
  creator_tagline: string | null;
  id_verified: boolean;
}

interface DiscoverProfileModalProps {
  profile: Profile | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLike: () => void;
  onPass: () => void;
}

export const DiscoverProfileModal = ({
  profile,
  open,
  onOpenChange,
  onLike,
  onPass,
}: DiscoverProfileModalProps) => {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  if (!profile) return null;

  const allPhotos = profile.photos.length > 0
    ? profile.photos
    : profile.avatar_url
      ? [{ id: 'avatar', photo_url: profile.avatar_url, order_index: 0 }]
      : [];

  const getIntentColor = (intent: string) => {
    switch (intent) {
      case 'open_to_dating':
        return 'bg-pink-500/20 border-pink-500 text-pink-500';
      case 'make_friends':
        return 'bg-blue-500/20 border-blue-500 text-blue-500';
      case 'support_creators':
        return 'bg-purple-500/20 border-purple-500 text-purple-500';
      case 'networking':
        return 'bg-green-500/20 border-green-500 text-green-500';
      default:
        return 'bg-secondary text-secondary-foreground';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="sr-only">
          <h2>{profile.display_name}'s Profile</h2>
        </DialogHeader>

        {/* Photo Carousel */}
        <div className="relative aspect-[3/4] bg-gradient-to-br from-muted to-muted/50">
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

              {/* Subscription Price */}
              {profile.is_creator && profile.creator_subscription_price && (
                <div className="absolute top-8 right-4 bg-black/70 backdrop-blur-sm px-3 py-1.5 rounded-full text-white text-sm font-semibold shadow-lg">
                  ${profile.creator_subscription_price}/mo
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
        <div className="p-6 space-y-4">
          {/* Name and Age */}
          <div>
            <h2 className="text-3xl font-bold mb-1">
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

          {/* Creator Tagline */}
          {profile.creator_tagline && (
            <p className="text-lg font-medium text-accent">{profile.creator_tagline}</p>
          )}

          {/* Bio */}
          {profile.bio && (
            <div>
              <h3 className="font-semibold mb-2">About</h3>
              <p className="text-muted-foreground">{profile.bio}</p>
            </div>
          )}

          {/* Badges */}
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className={cn("capitalize", getIntentColor(profile.intent))}>
              {profile.intent.replace("_", " ")}
            </Badge>
            {profile.id_verified && (
              <Badge variant="outline" className="bg-green-500/20 border-green-500 text-green-500">
                <BadgeCheck className="w-3 h-3 mr-1" />
                Verified
              </Badge>
            )}
          </div>

          {/* Interests */}
          {profile.interests.length > 0 && (
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
              onClick={() => {
                onPass();
                onOpenChange(false);
              }}
            >
              <X className="w-5 h-5 mr-2 text-destructive" />
              Pass
            </Button>
            <Button
              size="lg"
              className="flex-1"
              onClick={() => {
                onLike();
                onOpenChange(false);
              }}
            >
              <Heart className="w-5 h-5 mr-2" />
              Like
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

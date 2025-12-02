import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Calendar, Users, Play, Volume2, VolumeX } from "lucide-react";
import { VerificationBadges } from "@/components/profile/VerificationBadges";
import { format } from "date-fns";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

interface CreatorShowcaseCardProps {
  creator: {
    user_id: string;
    display_name: string;
    username?: string;
    avatar_url?: string;
    bio?: string;
    city?: string;
    age?: number;
    created_at: string;
    subscription_price: number;
    subscriber_count?: number;
    id_verified?: boolean;
    welcome_video_url?: string;
    cover_image_url?: string;
    tagline?: string;
    showcase_bio?: string;
  };
}

export const CreatorShowcaseCard = ({ creator }: CreatorShowcaseCardProps) => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isPressed, setIsPressed] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleCardClick = () => {
    const path = creator.username ? `/creators/${creator.username}` : `/creator/${creator.user_id}`;
    navigate(path);
  };

  const handleVideoClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      if (isVideoPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsVideoPlaying(!isVideoPlaying);
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMuted(!isMuted);
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
    }
  };

  const handleMouseEnter = () => {
    if (creator.welcome_video_url && videoRef.current && !isVideoPlaying) {
      videoRef.current.play();
      setIsVideoPlaying(true);
    }
  };

  const handleMouseLeave = () => {
    if (creator.welcome_video_url && videoRef.current && isVideoPlaying) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
      setIsVideoPlaying(false);
    }
  };

  const displayBio = creator.showcase_bio || creator.bio;

  // Mobile: Native app-style vertical card
  if (isMobile) {
    return (
      <Card
        className={cn(
          "cursor-pointer overflow-hidden border-border bg-card",
          "transition-transform duration-150 active:scale-[0.98]",
          isPressed && "scale-[0.98]"
        )}
        onClick={handleCardClick}
        onTouchStart={() => setIsPressed(true)}
        onTouchEnd={() => setIsPressed(false)}
        onTouchCancel={() => setIsPressed(false)}
      >
        {/* Cover Image */}
        <div className="relative aspect-[4/3] bg-gradient-to-br from-primary/20 to-background">
          {creator.cover_image_url || creator.avatar_url ? (
            <img
              src={creator.cover_image_url || creator.avatar_url}
              alt={creator.display_name}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Users className="w-12 h-12 text-muted-foreground/30" />
            </div>
          )}
          
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          
          {/* Verification badge overlay */}
          {creator.id_verified && (
            <div className="absolute top-3 right-3">
              <VerificationBadges 
                userId={creator.user_id} 
                isCreator={true}
                idVerified={creator.id_verified}
                size="sm"
              />
            </div>
          )}
          
          {/* Price tag overlay */}
          <div className="absolute bottom-3 right-3 bg-primary text-primary-foreground px-3 py-1.5 rounded-full text-sm font-bold shadow-lg">
            ${creator.subscription_price}/mo
          </div>
        </div>

        {/* Content Section */}
        <CardContent className="p-4 space-y-3">
          {/* Avatar + Name row */}
          <div className="flex items-center gap-3">
            <img
              src={creator.avatar_url || "/placeholder.svg"}
              alt={creator.display_name}
              className="w-12 h-12 rounded-full object-cover border-2 border-background shadow-md flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="font-bold text-foreground truncate text-base">
                  {creator.display_name}
                </h3>
                {creator.id_verified && !isMobile && (
                  <VerificationBadges 
                    userId={creator.user_id} 
                    isCreator={true}
                    idVerified={creator.id_verified}
                    size="sm"
                  />
                )}
              </div>
              {creator.username && (
                <p className="text-xs text-muted-foreground truncate">@{creator.username}</p>
              )}
            </div>
          </div>

          {/* Tagline */}
          {creator.tagline && (
            <p className="text-sm font-medium text-primary line-clamp-1">
              {creator.tagline}
            </p>
          )}

          {/* Bio */}
          {displayBio && (
            <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
              {displayBio}
            </p>
          )}

          {/* Stats row */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground pt-1">
            {creator.city && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {creator.city}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              {creator.subscriber_count || 0} subs
            </span>
          </div>

          {/* Subscribe button - full width on mobile */}
          <Button
            onClick={(e) => {
              e.stopPropagation();
              const path = creator.username ? `/creators/${creator.username}` : `/creator/${creator.user_id}`;
              navigate(path);
            }}
            className="w-full h-11 font-semibold text-sm"
          >
            View Profile
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Desktop: Original full card layout
  return (
    <Card
      className="group cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border-border bg-card"
      onClick={handleCardClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Video/Cover Section */}
      <div className="relative aspect-video bg-gradient-to-br from-primary/20 via-primary/10 to-background rounded-t-lg overflow-hidden">
        {creator.welcome_video_url ? (
          <>
            <video
              ref={videoRef}
              src={creator.welcome_video_url}
              className="w-full h-full object-cover rounded-t-lg"
              loop
              muted={isMuted}
              playsInline
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            
            {/* Video Controls */}
            <button
              onClick={handleVideoClick}
              className="absolute inset-0 flex items-center justify-center group/play"
            >
              <div className="w-16 h-16 rounded-full bg-background/90 flex items-center justify-center opacity-0 group-hover/play:opacity-100 transition-opacity">
                <Play className="w-8 h-8 text-primary" fill="currentColor" />
              </div>
            </button>

            {/* Mute Toggle */}
            <button
              onClick={toggleMute}
              className="absolute bottom-4 right-4 w-10 h-10 rounded-full bg-background/90 flex items-center justify-center hover:bg-background transition-colors"
            >
              {isMuted ? (
                <VolumeX className="w-5 h-5 text-foreground" />
              ) : (
                <Volume2 className="w-5 h-5 text-primary" />
              )}
            </button>
          </>
        ) : creator.cover_image_url ? (
          <>
            <img
              src={creator.cover_image_url}
              alt={creator.display_name}
              className="w-full h-full object-cover rounded-t-lg"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <Users className="w-16 h-16 mx-auto mb-2 opacity-20" />
              <p className="text-sm">No preview</p>
            </div>
          </div>
        )}

        {/* Profile Image Overlay */}
        <div className="absolute left-6 -bottom-12 z-10">
          <img
            src={creator.avatar_url || "/placeholder.svg"}
            alt={creator.display_name}
            className="w-24 h-24 rounded-lg border-4 border-background object-cover shadow-xl"
          />
        </div>
      </div>

      <CardContent className="pt-16 pb-6 px-4 md:px-6 space-y-3 md:space-y-4">
        {/* Name and Verification */}
        <div className="ml-28">
          <div className="flex items-center gap-2 mb-0.5">
            <h3 className="text-xl font-bold text-foreground truncate">{creator.display_name}</h3>
            <VerificationBadges 
              userId={creator.user_id} 
              isCreator={true}
              idVerified={creator.id_verified}
              size="sm"
            />
          </div>
          {creator.username && (
            <p className="text-xs text-muted-foreground truncate">@{creator.username}</p>
          )}
        </div>

        {/* Tagline */}
        {creator.tagline && (
          <p className="text-base font-semibold text-primary line-clamp-2">
            {creator.tagline}
          </p>
        )}

        {/* Bio */}
        {displayBio && (
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {displayBio}
          </p>
        )}

        {/* Stats */}
        <div className="flex gap-3 text-xs text-muted-foreground">
          {creator.city && (
            <div className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              <span>{creator.city}</span>
              {creator.age && <span>• {creator.age}</span>}
            </div>
          )}
          {creator.created_at && (
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>
                {(() => {
                  try {
                    const date = new Date(creator.created_at);
                    if (!isNaN(date.getTime())) {
                      return format(date, "MMM yyyy");
                    }
                    return "Recently";
                  } catch {
                    return "Recently";
                  }
                })()}
              </span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            <span>{creator.subscriber_count || 0} subs</span>
          </div>
        </div>

        {/* Price and CTA */}
        <div className="pt-4 border-t border-border flex items-center justify-between gap-2">
          <div>
            <p className="text-2xl font-bold text-foreground">
              ${creator.subscription_price}
              <span className="text-sm font-normal text-muted-foreground">/mo</span>
            </p>
          </div>
          <Button
            onClick={(e) => {
              e.stopPropagation();
              const path = creator.username ? `/creators/${creator.username}` : `/creator/${creator.user_id}`;
              navigate(path);
            }}
            size="sm"
            className="font-semibold min-w-[120px] h-10 text-sm"
          >
            Subscribe
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

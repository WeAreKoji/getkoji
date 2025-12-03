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

  // Mobile: Compact horizontal card layout
  if (isMobile) {
    return (
      <Card
        className={cn(
          "cursor-pointer overflow-hidden border-border bg-card w-full max-w-full",
          "transition-transform duration-150 active:scale-[0.98]",
          isPressed && "scale-[0.98]"
        )}
        onClick={handleCardClick}
        onTouchStart={() => setIsPressed(true)}
        onTouchEnd={() => setIsPressed(false)}
        onTouchCancel={() => setIsPressed(false)}
      >
        <div className="flex p-2.5 gap-2.5">
          {/* Left: Compact Avatar */}
          <div className="relative flex-shrink-0">
            <img
              src={creator.avatar_url || creator.cover_image_url || "/placeholder.svg"}
              alt={creator.display_name}
              className="w-14 h-14 rounded-lg object-cover"
              loading="lazy"
            />
            {creator.id_verified && (
              <div className="absolute -top-1 -right-1">
                <VerificationBadges 
                  userId={creator.user_id} 
                  isCreator={true}
                  idVerified={creator.id_verified}
                  size="sm"
                />
              </div>
            )}
          </div>

          {/* Right: Content */}
          <div className="flex-1 min-w-0 flex flex-col justify-center gap-0.5">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-semibold text-foreground truncate text-sm">
                {creator.display_name}
              </h3>
              <span className="text-xs font-bold text-primary flex-shrink-0">
                ${creator.subscription_price}/mo
              </span>
            </div>
            {creator.username && (
              <p className="text-[11px] text-muted-foreground truncate">@{creator.username}</p>
            )}
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
              {creator.city && (
                <span className="flex items-center gap-0.5">
                  <MapPin className="w-2.5 h-2.5" />
                  {creator.city}
                </span>
              )}
              <span className="flex items-center gap-0.5">
                <Users className="w-2.5 h-2.5" />
                {creator.subscriber_count || 0}
              </span>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  // Desktop: Modern vertical card layout
  return (
    <Card
      className="group cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border-border/50 bg-card overflow-hidden"
      onClick={handleCardClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Cover Image/Video Section */}
      <div className="relative aspect-video bg-gradient-to-br from-primary/20 via-primary/10 to-background overflow-hidden">
        {creator.welcome_video_url ? (
          <>
            <video
              ref={videoRef}
              src={creator.welcome_video_url}
              className="w-full h-full object-cover"
              loop
              muted={isMuted}
              playsInline
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
            
            {/* Video Controls - visible on hover */}
            <div className="absolute bottom-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={handleVideoClick}
                className="w-8 h-8 rounded-full bg-background/90 flex items-center justify-center hover:bg-background transition-colors shadow-md"
              >
                <Play className="w-4 h-4 text-primary" fill="currentColor" />
              </button>
              <button
                onClick={toggleMute}
                className="w-8 h-8 rounded-full bg-background/90 flex items-center justify-center hover:bg-background transition-colors shadow-md"
              >
                {isMuted ? (
                  <VolumeX className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <Volume2 className="w-4 h-4 text-primary" />
                )}
              </button>
            </div>
          </>
        ) : creator.cover_image_url || creator.avatar_url ? (
          <>
            <img
              src={creator.cover_image_url || creator.avatar_url || "/placeholder.svg"}
              alt={creator.display_name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Users className="w-12 h-12 text-muted-foreground/30" />
          </div>
        )}

        {/* Price badge on cover */}
        <div className="absolute top-3 right-3 bg-primary text-primary-foreground rounded-full px-3 py-1 shadow-md">
          <span className="text-sm font-bold">
            ${creator.subscription_price}
            <span className="text-xs font-normal opacity-80">/mo</span>
          </span>
        </div>
      </div>

      {/* Content Section */}
      <CardContent className="p-4 space-y-3">
        {/* Avatar + Name Row */}
        <div className="flex items-center gap-3">
          <img
            src={creator.avatar_url || "/placeholder.svg"}
            alt={creator.display_name}
            className="w-14 h-14 rounded-full border-2 border-border object-cover flex-shrink-0"
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <h3 className="font-bold text-foreground truncate">{creator.display_name}</h3>
              <VerificationBadges 
                userId={creator.user_id} 
                isCreator={true}
                idVerified={creator.id_verified}
                size="sm"
              />
            </div>
            {creator.username && (
              <p className="text-sm text-muted-foreground truncate">@{creator.username}</p>
            )}
          </div>
        </div>

        {/* Bio/Tagline */}
        {(creator.tagline || displayBio) && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {creator.tagline || displayBio}
          </p>
        )}

        {/* Stats Row */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {creator.city && (
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              {creator.city}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            {creator.subscriber_count || 0} subscribers
          </span>
        </div>

        {/* View Profile Button */}
        <Button
          onClick={(e) => {
            e.stopPropagation();
            const path = creator.username ? `/creators/${creator.username}` : `/creator/${creator.user_id}`;
            navigate(path);
          }}
          variant="secondary"
          className="w-full font-semibold"
        >
          View Profile
        </Button>
      </CardContent>
    </Card>
  );
};

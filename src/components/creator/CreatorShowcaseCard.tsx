import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Users, Play, Pause, Volume2, VolumeX, Star } from "lucide-react";
import { VerificationBadges } from "@/components/profile/VerificationBadges";
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
  isFeatured?: boolean;
}

export const CreatorShowcaseCard = ({ creator, isFeatured }: CreatorShowcaseCardProps) => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isPressed, setIsPressed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // Auto-featured based on subscriber count (100+ subscribers)
  const isTopCreator = isFeatured || (creator.subscriber_count && creator.subscriber_count >= 100);

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
    setIsHovered(true);
    if (creator.welcome_video_url && videoRef.current) {
      videoRef.current.play().catch(() => {
        // Autoplay failed, user interaction required
      });
      setIsVideoPlaying(true);
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    if (creator.welcome_video_url && videoRef.current) {
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
      className={cn(
        "group cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-2 border-border/50 bg-card overflow-hidden",
        isTopCreator && "ring-2 ring-primary/50 hover:ring-primary"
      )}
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
              className={cn(
                "w-full h-full object-cover transition-transform duration-500",
                isHovered && "scale-105"
              )}
              loop
              muted={isMuted}
              playsInline
              poster={creator.cover_image_url || creator.avatar_url}
            />
            <div className={cn(
              "absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent transition-opacity duration-300",
              isHovered ? "opacity-30" : "opacity-100"
            )} />
            
            {/* Video Controls - visible on hover */}
            <div className={cn(
              "absolute bottom-3 right-3 flex gap-2 transition-all duration-300",
              isHovered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
            )}>
              <button
                onClick={handleVideoClick}
                className="w-9 h-9 rounded-full bg-background/95 flex items-center justify-center hover:bg-background hover:scale-110 transition-all shadow-lg"
              >
                {isVideoPlaying ? (
                  <Pause className="w-4 h-4 text-primary" />
                ) : (
                  <Play className="w-4 h-4 text-primary ml-0.5" fill="currentColor" />
                )}
              </button>
              <button
                onClick={toggleMute}
                className="w-9 h-9 rounded-full bg-background/95 flex items-center justify-center hover:bg-background hover:scale-110 transition-all shadow-lg"
              >
                {isMuted ? (
                  <VolumeX className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <Volume2 className="w-4 h-4 text-primary" />
                )}
              </button>
            </div>

            {/* Playing indicator */}
            {isVideoPlaying && (
              <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-background/90 rounded-full px-2.5 py-1 animate-pulse">
                <span className="w-2 h-2 bg-red-500 rounded-full" />
                <span className="text-xs font-medium text-foreground">Live Preview</span>
              </div>
            )}
          </>
        ) : creator.cover_image_url || creator.avatar_url ? (
          <>
            <img
              src={creator.cover_image_url || creator.avatar_url || "/placeholder.svg"}
              alt={creator.display_name}
              className={cn(
                "w-full h-full object-cover transition-transform duration-500",
                isHovered && "scale-110"
              )}
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Users className="w-12 h-12 text-muted-foreground/30" />
          </div>
        )}

        {/* Featured Badge */}
        {isTopCreator && (
          <Badge className="absolute top-3 left-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 shadow-lg gap-1">
            <Star className="w-3 h-3" fill="currentColor" />
            Featured
          </Badge>
        )}

        {/* Price badge on cover */}
        <div className={cn(
          "absolute top-3 right-3 bg-primary text-primary-foreground rounded-full px-3 py-1.5 shadow-lg transition-transform duration-300",
          isHovered && "scale-105"
        )}>
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
          <div className="relative">
            <img
              src={creator.avatar_url || "/placeholder.svg"}
              alt={creator.display_name}
              className={cn(
                "w-14 h-14 rounded-full border-2 border-border object-cover flex-shrink-0 transition-all duration-300",
                isHovered && "border-primary scale-105 shadow-md"
              )}
            />
            {isTopCreator && (
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full flex items-center justify-center shadow-sm">
                <Star className="w-3 h-3 text-white" fill="currentColor" />
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <h3 className={cn(
                "font-bold text-foreground truncate transition-colors duration-300",
                isHovered && "text-primary"
              )}>{creator.display_name}</h3>
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
          variant={isHovered ? "default" : "secondary"}
          className="w-full font-semibold transition-all duration-300"
        >
          View Profile
        </Button>
      </CardContent>
    </Card>
  );
};

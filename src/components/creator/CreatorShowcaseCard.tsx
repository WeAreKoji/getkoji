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
      className="group cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-border/50 bg-card overflow-hidden"
      onClick={handleCardClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Cover Image/Video Section */}
      <div className="relative aspect-[4/3] bg-gradient-to-br from-primary/20 via-primary/10 to-background overflow-hidden">
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
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            
            {/* Play Button Overlay */}
            <button
              onClick={handleVideoClick}
              className="absolute inset-0 flex items-center justify-center"
            >
              <div className="w-14 h-14 rounded-full bg-background/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
                <Play className="w-7 h-7 text-primary" fill="currentColor" />
              </div>
            </button>

            {/* Mute Toggle */}
            <button
              onClick={toggleMute}
              className="absolute bottom-3 right-3 w-9 h-9 rounded-full bg-background/90 flex items-center justify-center hover:bg-background transition-colors opacity-0 group-hover:opacity-100"
            >
              {isMuted ? (
                <VolumeX className="w-4 h-4 text-muted-foreground" />
              ) : (
                <Volume2 className="w-4 h-4 text-primary" />
              )}
            </button>
          </>
        ) : creator.cover_image_url || creator.avatar_url ? (
          <>
            <img
              src={creator.cover_image_url || creator.avatar_url || "/placeholder.svg"}
              alt={creator.display_name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Users className="w-16 h-16 text-muted-foreground/30" />
          </div>
        )}

        {/* Avatar positioned at bottom of cover */}
        <div className="absolute -bottom-10 left-4">
          <img
            src={creator.avatar_url || "/placeholder.svg"}
            alt={creator.display_name}
            className="w-20 h-20 rounded-xl border-4 border-card object-cover shadow-lg"
          />
        </div>

        {/* Price badge */}
        <div className="absolute top-3 right-3 bg-background/95 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-md">
          <span className="text-sm font-bold text-foreground">
            ${creator.subscription_price}
            <span className="text-xs font-normal text-muted-foreground">/mo</span>
          </span>
        </div>
      </div>

      {/* Content Section */}
      <div className="pt-12 pb-5 px-4 space-y-3">
        {/* Name and Verification */}
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-foreground truncate">{creator.display_name}</h3>
            <VerificationBadges 
              userId={creator.user_id} 
              isCreator={true}
              idVerified={creator.id_verified}
              size="sm"
            />
          </div>
          {creator.username && (
            <p className="text-sm text-muted-foreground">@{creator.username}</p>
          )}
        </div>

        {/* Tagline or Bio */}
        {(creator.tagline || displayBio) && (
          <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
            {creator.tagline || displayBio}
          </p>
        )}

        {/* Stats Row */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          {creator.city && (
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              {creator.city}
            </span>
          )}
          {creator.created_at && (
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
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
          )}
          <span className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            {creator.subscriber_count || 0}
          </span>
        </div>

        {/* Subscribe Button */}
        <Button
          onClick={(e) => {
            e.stopPropagation();
            const path = creator.username ? `/creators/${creator.username}` : `/creator/${creator.user_id}`;
            navigate(path);
          }}
          className="w-full font-semibold h-10"
        >
          Subscribe
        </Button>
      </div>
    </Card>
  );
};

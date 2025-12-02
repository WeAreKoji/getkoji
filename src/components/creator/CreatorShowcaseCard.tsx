import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Calendar, Users, Play, Volume2, VolumeX } from "lucide-react";
import { VerificationBadges } from "@/components/profile/VerificationBadges";
import { format } from "date-fns";

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
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
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

  return (
    <Card
      className="group cursor-pointer transition-all duration-300 hover:shadow-lg hover:md:-translate-y-1 border-border bg-card active:scale-[0.98] md:active:scale-100"
      onClick={handleCardClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Video/Cover Section - more compact on mobile */}
      <div className="relative aspect-[3/2] sm:aspect-video max-h-[160px] sm:max-h-none bg-gradient-to-br from-primary/20 via-primary/10 to-background rounded-t-lg overflow-hidden">
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
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-background/90 flex items-center justify-center opacity-0 group-hover/play:opacity-100 transition-opacity">
                <Play className="w-6 h-6 sm:w-8 sm:h-8 text-primary" fill="currentColor" />
              </div>
            </button>

            {/* Mute Toggle */}
            <button
              onClick={toggleMute}
              className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-background/90 flex items-center justify-center hover:bg-background transition-colors"
            >
              {isMuted ? (
                <VolumeX className="w-4 h-4 sm:w-5 sm:h-5 text-foreground" />
              ) : (
                <Volume2 className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
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
              <Users className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-1 sm:mb-2 opacity-20" />
              <p className="text-xs sm:text-sm">No preview</p>
            </div>
          </div>
        )}

        {/* Profile Image Overlay - smaller on mobile */}
        <div className="absolute left-3 sm:left-6 -bottom-6 sm:-bottom-12 z-10">
          <img
            src={creator.avatar_url || "/placeholder.svg"}
            alt={creator.display_name}
            className="w-12 h-12 sm:w-24 sm:h-24 rounded-lg border-2 sm:border-4 border-background object-cover shadow-xl"
          />
        </div>
      </div>

      <CardContent className="pt-8 sm:pt-16 pb-2 sm:pb-6 px-2.5 sm:px-4 md:px-6 space-y-1.5 sm:space-y-3 md:space-y-4">
        {/* Name and Verification */}
        <div className="ml-14 sm:ml-28">
          <div className="flex items-center gap-1 sm:gap-2 mb-0.5">
            <h3 className="text-sm sm:text-xl font-bold text-foreground truncate">{creator.display_name}</h3>
            <VerificationBadges 
              userId={creator.user_id} 
              isCreator={true}
              idVerified={creator.id_verified}
              size="sm"
            />
          </div>
          {creator.username && (
            <p className="text-[10px] sm:text-xs text-muted-foreground truncate">@{creator.username}</p>
          )}
        </div>

        {/* Tagline - hidden on mobile to save space */}
        {creator.tagline && (
          <p className="hidden sm:block text-base font-semibold text-primary line-clamp-2">
            {creator.tagline}
          </p>
        )}

        {/* Bio */}
        {displayBio && (
          <p className="text-[10px] sm:text-xs text-muted-foreground line-clamp-1 sm:line-clamp-2 leading-relaxed">
            {displayBio}
          </p>
        )}

        {/* Stats - horizontal scroll on mobile */}
        <div className="flex gap-2 sm:gap-3 text-[10px] sm:text-xs text-muted-foreground overflow-x-auto scrollbar-hide whitespace-nowrap pb-0.5">
          {creator.city && (
            <div className="flex items-center gap-1">
              <MapPin className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
              <span>{creator.city}</span>
              {creator.age && <span>• {creator.age}</span>}
            </div>
          )}
          {creator.created_at && (
            <div className="flex items-center gap-1">
              <Calendar className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
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
            <Users className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
            <span>{creator.subscriber_count || 0} subs</span>
          </div>
        </div>

        {/* Price and CTA */}
        <div className="pt-1.5 sm:pt-4 border-t border-border flex items-center justify-between gap-2">
          <div>
            <p className="text-base sm:text-2xl font-bold text-foreground">
              ${creator.subscription_price}
              <span className="text-[10px] sm:text-sm font-normal text-muted-foreground">/mo</span>
            </p>
          </div>
          <Button
            onClick={(e) => {
              e.stopPropagation();
              const path = creator.username ? `/creators/${creator.username}` : `/creator/${creator.user_id}`;
              navigate(path);
            }}
            size="sm"
            className="font-semibold min-w-[70px] sm:min-w-[120px] h-7 sm:h-10 text-[10px] sm:text-sm"
          >
            Subscribe
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

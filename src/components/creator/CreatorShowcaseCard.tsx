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
      {/* Video/Cover Section */}
      <div className="relative aspect-video bg-gradient-to-br from-primary/20 via-primary/10 to-background rounded-t-lg">
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
              <p className="text-sm">No preview available</p>
            </div>
          </div>
        )}

        {/* Profile Image Overlay */}
        <div className="absolute left-4 sm:left-6 -bottom-10 sm:-bottom-12 z-10">
          <img
            src={creator.avatar_url || "/placeholder.svg"}
            alt={creator.display_name}
            className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg border-4 border-background object-cover shadow-xl"
          />
        </div>
      </div>

      <CardContent className="pt-14 sm:pt-16 md:pt-20 pb-4 sm:pb-6 px-3 sm:px-4 md:px-6 space-y-2.5 sm:space-y-3 md:space-y-4">
        {/* Name and Verification */}
        <div className="sm:ml-28">
          <div className="flex items-center gap-1.5 sm:gap-2 mb-0.5 sm:mb-1">
            <h3 className="text-lg sm:text-xl font-bold text-foreground truncate">{creator.display_name}</h3>
            <VerificationBadges 
              userId={creator.user_id} 
              isCreator={true}
              idVerified={creator.id_verified}
              size="sm"
            />
          </div>
          {creator.username && (
            <p className="text-xs sm:text-sm text-muted-foreground truncate">@{creator.username}</p>
          )}
        </div>

        {/* Tagline */}
        {creator.tagline && (
          <p className="text-sm sm:text-base font-semibold text-primary line-clamp-2">
            {creator.tagline}
          </p>
        )}

        {/* Bio */}
        {displayBio && (
          <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 sm:line-clamp-3 leading-relaxed">
            {displayBio}
          </p>
        )}

        {/* Stats */}
        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
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
                Joined{" "}
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
            <span>{creator.subscriber_count || 0} subscribers</span>
          </div>
        </div>

        {/* Price and CTA */}
        <div className="pt-3 sm:pt-4 border-t border-border flex items-center justify-between gap-3">
          <div>
            <p className="text-xl sm:text-2xl font-bold text-foreground">
              ${creator.subscription_price}
              <span className="text-xs sm:text-sm font-normal text-muted-foreground">/mo</span>
            </p>
          </div>
          <Button
            onClick={(e) => {
              e.stopPropagation();
              const path = creator.username ? `/creators/${creator.username}` : `/creator/${creator.user_id}`;
              navigate(path);
            }}
            size="default"
            className="font-semibold min-w-[100px] sm:min-w-[120px] h-9 sm:h-10"
          >
            Subscribe
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

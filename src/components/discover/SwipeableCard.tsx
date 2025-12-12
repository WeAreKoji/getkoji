import { useRef, useState, useCallback, useEffect } from "react";
import { useSpring, animated } from "@react-spring/web";
import { useDrag } from "@use-gesture/react";
import { Badge } from "@/components/ui/badge";
import { Heart, X, MapPin, Sparkles, BadgeCheck, ChevronLeft, ChevronRight, ChevronUp, User, Loader2 } from "lucide-react";
import { haptics } from "@/lib/native";
import { cn } from "@/lib/utils";
import { formatDistance } from "@/lib/native-location";

interface Profile {
  id: string;
  display_name: string;
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
  distance_km?: number | null;
}

interface SwipeableCardProps {
  profile: Profile;
  onSwipe: (isLike: boolean) => void;
  onProfileOpen?: () => void;
}

// Validate image URL - reject oversized base64 strings (>500KB)
const isValidImageUrl = (url: string | null | undefined): boolean => {
  if (!url) return false;
  if (url.startsWith('data:image') && url.length > 500000) return false;
  return true;
};

const SwipeableCard = ({ profile, onSwipe, onProfileOpen }: SwipeableCardProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  
  // Use a ref to track if we've already triggered a swipe
  const swipeTriggeredRef = useRef(false);
  const cardIdRef = useRef(profile.id);

  // Get all photos
  const allPhotos = profile.photos?.length > 0 
    ? profile.photos.filter(p => isValidImageUrl(p.photo_url))
    : isValidImageUrl(profile.avatar_url)
      ? [{ id: 'avatar', photo_url: profile.avatar_url!, order_index: 0 }]
      : [];

  const rawPhotoUrl = allPhotos[currentPhotoIndex]?.photo_url || profile.avatar_url;
  const currentPhotoUrl = isValidImageUrl(rawPhotoUrl) ? rawPhotoUrl : null;

  const [{ x, y, rotate, opacity }, api] = useSpring(() => ({
    x: 0,
    y: 0,
    rotate: 0,
    opacity: 1,
    config: { tension: 300, friction: 30 },
  }));

  // Reset when profile changes
  useEffect(() => {
    if (cardIdRef.current !== profile.id) {
      console.log('🔄 New profile loaded:', profile.id);
      cardIdRef.current = profile.id;
      swipeTriggeredRef.current = false;
      setIsProcessing(false);
      setCurrentPhotoIndex(0);
      setImageError(false);
      setImageLoading(true);
      api.set({ x: 0, y: 0, rotate: 0, opacity: 1 });
    }
  }, [profile.id, api]);

  // Safety reset - if stuck in processing for too long, reset
  useEffect(() => {
    if (isProcessing) {
      const timeout = setTimeout(() => {
        console.log('⚠️ Safety reset - processing took too long');
        setIsProcessing(false);
        swipeTriggeredRef.current = false;
        api.set({ x: 0, y: 0, rotate: 0, opacity: 1 });
      }, 3000);
      return () => clearTimeout(timeout);
    }
  }, [isProcessing, api]);

  // Execute swipe action - called immediately, not waiting for animation
  const executeSwipe = useCallback((isLike: boolean) => {
    if (swipeTriggeredRef.current) {
      console.log('🚫 Swipe already triggered, ignoring');
      return;
    }
    
    console.log('🎯 EXECUTING SWIPE:', isLike ? 'LIKE' : 'PASS');
    swipeTriggeredRef.current = true;
    setIsProcessing(true);
    
    haptics[isLike ? 'medium' : 'light']();
    
    // Animate card off screen
    const direction = isLike ? 1 : -1;
    const flyOutDistance = window.innerWidth + 200;
    
    api.start({
      x: flyOutDistance * direction,
      rotate: direction * 20,
      opacity: 0,
      config: { tension: 200, friction: 25, clamp: true },
    });
    
    // Call onSwipe IMMEDIATELY - don't wait for animation
    // Use a tiny delay just to ensure state is set
    setTimeout(() => {
      console.log('✅ Calling onSwipe(' + isLike + ')');
      onSwipe(isLike);
    }, 50);
  }, [api, onSwipe]);

  // Very low thresholds for mobile
  const SWIPE_THRESHOLD = 40;
  const VELOCITY_THRESHOLD = 0.15;

  const bind = useDrag(
    ({ active, movement: [mx, my], velocity: [vx], direction: [dx], first, tap }) => {
      // Ignore taps - let them bubble to buttons
      if (tap) return;
      
      if (isProcessing || swipeTriggeredRef.current) {
        return;
      }

      const absVelocity = Math.abs(vx);
      const absDistance = Math.abs(mx);
      
      const triggeredByVelocity = absVelocity > VELOCITY_THRESHOLD;
      const triggeredByDistance = absDistance > SWIPE_THRESHOLD;
      const shouldTrigger = triggeredByVelocity || triggeredByDistance;
      
      // Direction based on movement, not velocity direction
      const isLike = mx > 0;

      if (!active) {
        console.log('👆 Drag end:', { 
          mx: Math.round(mx), 
          vx: vx.toFixed(2),
          shouldTrigger,
          isLike 
        });
      }

      if (!active && shouldTrigger) {
        executeSwipe(isLike);
      } else if (active) {
        // During drag - follow finger
        const maxRotation = 12;
        const rotation = (mx / 100) * maxRotation;
        
        api.start({
          x: mx,
          y: my * 0.5, // Reduce vertical movement
          rotate: Math.max(-maxRotation, Math.min(maxRotation, rotation)),
          opacity: 1,
          immediate: true,
        });
      } else if (!active && !shouldTrigger) {
        // Return to center
        api.start({
          x: 0,
          y: 0,
          rotate: 0,
          opacity: 1,
          config: { tension: 400, friction: 20 },
        });
      }
    },
    { 
      filterTaps: true,
      pointer: { touch: true },
      threshold: 5,
      // Allow vertical scrolling, capture horizontal
      axis: 'x',
    }
  );

  const likeOpacity = x.to((val) => (val > 0 ? Math.min(val / 80, 1) : 0));
  const rejectOpacity = x.to((val) => (val < 0 ? Math.min(Math.abs(val) / 80, 1) : 0));

  const nextPhoto = (e?: React.MouseEvent | React.TouchEvent) => {
    e?.stopPropagation();
    e?.preventDefault();
    if (currentPhotoIndex < allPhotos.length - 1) {
      setCurrentPhotoIndex(prev => prev + 1);
      setImageError(false);
      haptics.light();
    }
  };

  const previousPhoto = (e?: React.MouseEvent | React.TouchEvent) => {
    e?.stopPropagation();
    e?.preventDefault();
    if (currentPhotoIndex > 0) {
      setCurrentPhotoIndex(prev => prev - 1);
      setImageError(false);
      haptics.light();
    }
  };

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
        return 'bg-white/20 backdrop-blur-sm border-white/30';
    }
  };

  // Button handlers - simple and direct
  const handleRejectClick = useCallback(() => {
    console.log('🔴 REJECT BUTTON CLICKED');
    executeSwipe(false);
  }, [executeSwipe]);

  const handleLikeClick = useCallback(() => {
    console.log('💚 LIKE BUTTON CLICKED');
    executeSwipe(true);
  }, [executeSwipe]);

  const handleProfileOpen = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (onProfileOpen) {
      onProfileOpen();
    }
  }, [onProfileOpen]);

  return (
    <div className="relative w-full max-w-sm mx-auto flex flex-col">
      {/* Swipeable Card */}
      <animated.div
        {...bind()}
        style={{ 
          x, 
          y, 
          rotate: rotate.to(r => `${r}deg`), 
          opacity,
          touchAction: 'pan-y',
        }}
        className={cn(
          "rounded-2xl overflow-hidden shadow-2xl bg-card select-none",
          isProcessing ? 'pointer-events-none' : 'cursor-grab active:cursor-grabbing'
        )}
      >
        <div 
          className="relative w-full"
          style={{ aspectRatio: '3/4', minHeight: '400px' }}
        >
          {/* Profile Image */}
          {currentPhotoUrl && !imageError ? (
            <>
              {imageLoading && (
                <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                  <Loader2 className="w-12 h-12 text-primary animate-spin" />
                </div>
              )}
              <img
                src={currentPhotoUrl}
                alt={profile.display_name}
                className={cn(
                  "absolute inset-0 w-full h-full object-cover transition-opacity duration-300",
                  imageLoading ? "opacity-0" : "opacity-100"
                )}
                draggable={false}
                onLoad={() => setImageLoading(false)}
                onError={() => {
                  setImageError(true);
                  setImageLoading(false);
                }}
              />
            </>
          ) : (
            <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
              <User className="w-24 h-24 text-muted-foreground/50" />
            </div>
          )}

          {/* Photo navigation tap zones */}
          {allPhotos.length > 1 && (
            <div className="absolute inset-0 flex z-30">
              <button 
                type="button"
                className="w-1/3 h-full bg-transparent" 
                onClick={previousPhoto}
                aria-label="Previous photo"
              />
              <div className="w-1/3 h-full" />
              <button 
                type="button"
                className="w-1/3 h-full bg-transparent" 
                onClick={nextPhoto}
                aria-label="Next photo"
              />
            </div>
          )}
          
          {/* Photo indicators */}
          {allPhotos.length > 1 && (
            <div className="absolute top-3 left-3 right-3 flex gap-1 z-10 pointer-events-none">
              {allPhotos.map((_, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "flex-1 h-1 rounded-full transition-all",
                    idx === currentPhotoIndex ? "bg-white" : "bg-white/40"
                  )}
                />
              ))}
            </div>
          )}

          {/* Desktop navigation arrows */}
          {allPhotos.length > 1 && (
            <>
              {currentPhotoIndex > 0 && (
                <button
                  type="button"
                  onClick={previousPhoto}
                  className="hidden md:flex absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 items-center justify-center bg-black/50 backdrop-blur-sm rounded-full text-white hover:bg-black/70 transition-colors z-40"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
              )}
              {currentPhotoIndex < allPhotos.length - 1 && (
                <button
                  type="button"
                  onClick={nextPhoto}
                  className="hidden md:flex absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 items-center justify-center bg-black/50 backdrop-blur-sm rounded-full text-white hover:bg-black/70 transition-colors z-40"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              )}
            </>
          )}

          {/* Creator Badge */}
          {profile.is_creator && (
            <div className="absolute top-12 left-3 flex items-center gap-1.5 bg-accent/90 backdrop-blur-sm px-2.5 py-1 rounded-full shadow-lg z-10 pointer-events-none">
              <Sparkles className="w-3.5 h-3.5 text-white" />
              <span className="text-white font-semibold text-xs">Creator</span>
              {profile.id_verified && <BadgeCheck className="w-3.5 h-3.5 text-white" />}
            </div>
          )}

          {/* Subscription Price */}
          {profile.is_creator && profile.creator_subscription_price && (
            <div className="absolute top-12 right-3 bg-black/70 backdrop-blur-sm px-2.5 py-1 rounded-full text-white text-xs font-semibold shadow-lg z-10 pointer-events-none">
              ${profile.creator_subscription_price}/mo
            </div>
          )}

          {/* Like Indicator */}
          <animated.div
            style={{ opacity: likeOpacity }}
            className="absolute top-20 left-4 bg-primary/90 backdrop-blur-sm px-4 py-2 rounded-xl rotate-[-20deg] border-2 border-white shadow-xl z-20 pointer-events-none"
          >
            <Heart className="w-8 h-8 text-white fill-white" />
          </animated.div>

          {/* Reject Indicator */}
          <animated.div
            style={{ opacity: rejectOpacity }}
            className="absolute top-20 right-4 bg-destructive/90 backdrop-blur-sm px-4 py-2 rounded-xl rotate-[20deg] border-2 border-white shadow-xl z-20 pointer-events-none"
          >
            <X className="w-8 h-8 text-white" />
          </animated.div>

          {/* Profile info overlay */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-4 text-white z-10">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-2xl font-bold truncate flex-1">
                {profile.display_name}, {profile.age}
              </h2>
              {onProfileOpen && (
                <button 
                  type="button"
                  onClick={handleProfileOpen}
                  className="ml-2 p-2 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-colors z-50"
                  aria-label="View full profile"
                >
                  <ChevronUp className="w-5 h-5" />
                </button>
              )}
            </div>
            
            {(profile.city || profile.distance_km) && (
              <div className="flex items-center gap-1.5 mb-2 text-sm text-white/90 pointer-events-none">
                <MapPin className="w-3.5 h-3.5" />
                <span>
                  {profile.city}
                  {profile.distance_km && (
                    <span className="text-white/70 ml-1">• {formatDistance(profile.distance_km)}</span>
                  )}
                </span>
              </div>
            )}
            
            {profile.bio && (
              <p className="text-white/80 text-sm mb-3 line-clamp-2 pointer-events-none">{profile.bio}</p>
            )}
            
            <div className="flex flex-wrap gap-1.5 pointer-events-none">
              <Badge variant="outline" className={cn("capitalize text-xs", getIntentColor(profile.intent))}>
                {profile.intent.replace("_", " ")}
              </Badge>
              {profile.id_verified && (
                <Badge variant="outline" className="bg-green-500/20 border-green-500 text-green-500 text-xs">
                  <BadgeCheck className="w-3 h-3 mr-1" />
                  Verified
                </Badge>
              )}
              {profile.interests?.slice(0, 2).map((interest) => (
                <Badge key={interest} variant="outline" className="bg-white/20 border-white/30 text-white text-xs">
                  {interest}
                </Badge>
              ))}
              {(profile.interests?.length || 0) > 2 && (
                <Badge variant="outline" className="bg-white/20 border-white/30 text-white text-xs">
                  +{(profile.interests?.length || 0) - 2} more
                </Badge>
              )}
            </div>
          </div>
        </div>
      </animated.div>

      {/* Action Buttons - Completely isolated from drag gestures */}
      <div 
        className="p-6 flex justify-center gap-8"
        style={{ touchAction: 'manipulation' }}
      >
        <button
          type="button"
          disabled={isProcessing}
          onClick={handleRejectClick}
          className={cn(
            "w-16 h-16 rounded-full border-2 border-destructive/30 bg-card flex items-center justify-center shadow-xl transition-all duration-200",
            "hover:border-destructive hover:bg-destructive/20",
            "active:scale-90 focus:outline-none focus:ring-2 focus:ring-destructive/50",
            isProcessing && "opacity-50 cursor-not-allowed"
          )}
          aria-label="Pass on this profile"
        >
          <X className="w-8 h-8 text-destructive" />
        </button>
        
        <button
          type="button"
          disabled={isProcessing}
          onClick={handleLikeClick}
          className={cn(
            "w-16 h-16 rounded-full border-2 border-primary/30 bg-card flex items-center justify-center shadow-xl transition-all duration-200",
            "hover:border-primary hover:bg-primary/20",
            "active:scale-90 focus:outline-none focus:ring-2 focus:ring-primary/50",
            isProcessing && "opacity-50 cursor-not-allowed"
          )}
          aria-label="Like this profile"
        >
          <Heart className="w-8 h-8 text-primary" />
        </button>
      </div>
    </div>
  );
};

export default SwipeableCard;

import { useRef, useState } from "react";
import { useSpring, animated } from "@react-spring/web";
import { useDrag } from "@use-gesture/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, X, MapPin, Sparkles, BadgeCheck, ChevronLeft, ChevronRight } from "lucide-react";
import { haptics } from "@/lib/native";
import { cn } from "@/lib/utils";

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
}

interface SwipeableCardProps {
  profile: Profile;
  onSwipe: (isLike: boolean) => void;
  onProfileOpen?: () => void;
}

const SwipeableCard = ({ profile, onSwipe, onProfileOpen }: SwipeableCardProps) => {
  const hasSwipedRef = useRef(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  // Get all photos - prefer photos array, fallback to avatar_url
  const allPhotos = profile.photos?.length > 0 
    ? profile.photos 
    : profile.avatar_url 
      ? [{ id: 'avatar', photo_url: profile.avatar_url, order_index: 0 }]
      : [];

  const [{ x, y, rotate, opacity }, api] = useSpring(() => ({
    x: 0,
    y: 0,
    rotate: 0,
    opacity: 1,
    config: { tension: 300, friction: 30 },
  }));

  const bind = useDrag(
    ({ active, movement: [mx, my], velocity: [vx], direction: [dx] }) => {
      if (isProcessing) return;

      const trigger = vx > 0.5 || Math.abs(mx) > 150; // Swipe threshold
      const isLike = dx > 0;

      if (!active && trigger && !hasSwipedRef.current) {
        console.log('🎯 Swipe gesture triggered:', { 
          isLike, 
          profileId: profile.id, 
          profileName: profile.display_name,
          velocity: vx,
          distance: mx
        });

        hasSwipedRef.current = true;
        setIsProcessing(true);
        
        // Haptic feedback on swipe complete
        if (isLike) {
          haptics.medium();
        } else {
          haptics.light();
        }

        // Animate out
        api.start({
          x: (200 + window.innerWidth) * dx,
          y: my,
          rotate: dx * 20,
          opacity: 0,
          config: { tension: 200, friction: 20 },
          onRest: () => {
            console.log('✅ Swipe animation complete, calling onSwipe');
            onSwipe(isLike);
            hasSwipedRef.current = false;
            setIsProcessing(false);
          },
        });
      } else {
        // During drag
        const rotation = mx / 20;
        api.start({
          x: active ? mx : 0,
          y: active ? my : 0,
          rotate: active ? rotation : 0,
          opacity: 1,
          immediate: active,
        });
      }
    },
    { filterTaps: true }
  );

  // Calculate opacity for like/reject indicators
  const likeOpacity = x.to((x) => (x > 0 ? Math.min(x / 100, 1) : 0));
  const rejectOpacity = x.to((x) => (x < 0 ? Math.min(Math.abs(x) / 100, 1) : 0));

  // Photo navigation handlers
  const nextPhoto = () => {
    if (currentPhotoIndex < allPhotos.length - 1) {
      setCurrentPhotoIndex(prev => prev + 1);
      haptics.light();
    }
  };

  const previousPhoto = () => {
    if (currentPhotoIndex > 0) {
      setCurrentPhotoIndex(prev => prev - 1);
      haptics.light();
    }
  };

  const handleImageClick = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const width = rect.width;

    if (x < width * 0.3 && currentPhotoIndex > 0) {
      previousPhoto();
    } else if (x > width * 0.7 && currentPhotoIndex < allPhotos.length - 1) {
      nextPhoto();
    } else if (x >= width * 0.3 && x <= width * 0.7 && onProfileOpen) {
      onProfileOpen();
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

  return (
    <div className="relative">
      <animated.div
        {...bind()}
        style={{ x, y, rotate, opacity, touchAction: "none" }}
        className={`card-gradient-border overflow-hidden shadow-2xl ${
          isProcessing ? 'pointer-events-none' : 'cursor-grab active:cursor-grabbing'
        }`}
      >
        <div className="relative aspect-[3/4] bg-gradient-to-br from-muted to-muted/50">
          {/* Photo Display */}
          {allPhotos.length > 0 ? (
            <div 
              className="w-full h-full relative cursor-pointer"
              onClick={handleImageClick}
            >
              <img
                src={allPhotos[currentPhotoIndex].photo_url}
                alt={`${profile.display_name} - Photo ${currentPhotoIndex + 1}`}
                className="w-full h-full object-cover"
                draggable={false}
              />
              
              {/* Photo indicators */}
              {allPhotos.length > 1 && (
                <div className="absolute top-2 left-0 right-0 flex gap-1 px-2">
                  {allPhotos.map((_, idx) => (
                    <div
                      key={idx}
                      className={cn(
                        "flex-1 h-1 rounded-full transition-all",
                        idx === currentPhotoIndex ? "bg-white" : "bg-white/30"
                      )}
                    />
                  ))}
                </div>
              )}

              {/* Navigation arrows (desktop) */}
              {allPhotos.length > 1 && (
                <>
                  {currentPhotoIndex > 0 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        previousPhoto();
                      }}
                      className="hidden md:flex absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 items-center justify-center bg-black/50 backdrop-blur-sm rounded-full text-white hover:bg-black/70 transition-colors"
                      aria-label="Previous photo"
                    >
                      <ChevronLeft className="w-6 h-6" />
                    </button>
                  )}
                  {currentPhotoIndex < allPhotos.length - 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        nextPhoto();
                      }}
                      className="hidden md:flex absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 items-center justify-center bg-black/50 backdrop-blur-sm rounded-full text-white hover:bg-black/70 transition-colors"
                      aria-label="Next photo"
                    >
                      <ChevronRight className="w-6 h-6" />
                    </button>
                  )}
                </>
              )}
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-8xl">👤</div>
            </div>
          )}

          {/* Creator Badge */}
          {profile.is_creator === true && (
            <div className="absolute top-6 left-4 flex items-center gap-2 bg-accent/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-lg">
              <Sparkles className="w-4 h-4 text-white" />
              <span className="text-white font-semibold text-sm">Creator</span>
              {profile.id_verified === true && (
                <BadgeCheck className="w-4 h-4 text-white" />
              )}
            </div>
          )}

          {/* Subscription Price */}
          {profile.is_creator === true && profile.creator_subscription_price && (
            <div className="absolute top-6 right-4 bg-black/70 backdrop-blur-sm px-3 py-1.5 rounded-full text-white text-sm font-semibold shadow-lg">
              ${profile.creator_subscription_price}/mo
            </div>
          )}

          {/* Like Indicator */}
          <animated.div
            style={{ opacity: likeOpacity }}
            className="absolute top-8 left-8 bg-primary/90 backdrop-blur-sm px-6 py-3 rounded-xl rotate-[-20deg] border-4 border-white shadow-xl"
          >
            <Heart className="w-10 h-10 text-white fill-white" />
          </animated.div>

          {/* Reject Indicator */}
          <animated.div
            style={{ opacity: rejectOpacity }}
            className="absolute top-8 right-8 bg-destructive/90 backdrop-blur-sm px-6 py-3 rounded-xl rotate-[20deg] border-4 border-white shadow-xl"
          >
            <X className="w-10 h-10 text-white" />
          </animated.div>

          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 text-white">
            <h2 className="text-3xl font-bold mb-2">
              {profile.display_name}, {profile.age}
            </h2>
            {profile.city && (
              <div className="flex items-center gap-2 mb-3">
                <MapPin className="w-4 h-4" />
                <span>{profile.city}</span>
              </div>
            )}
            {profile.bio && <p className="text-white/90 mb-3 line-clamp-2">{profile.bio}</p>}
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className={cn("capitalize", getIntentColor(profile.intent))}>
                {profile.intent.replace("_", " ")}
              </Badge>
              {profile.id_verified === true && (
                <Badge variant="outline" className="bg-green-500/20 border-green-500 text-green-500">
                  <BadgeCheck className="w-3 h-3 mr-1" />
                  Verified
                </Badge>
              )}
              {profile.interests?.slice(0, 2).map((interest) => (
                <Badge key={interest} variant="outline" className="bg-white/20 backdrop-blur-sm border-white/30 text-white">
                  {interest}
                </Badge>
              ))}
              {(profile.interests?.length || 0) > 2 && (
                <Badge variant="outline" className="bg-white/20 backdrop-blur-sm border-white/30 text-white">
                  +{(profile.interests?.length || 0) - 2} more
                </Badge>
              )}
            </div>
          </div>
        </div>

        <div className="p-6 flex justify-center gap-6">
          <Button
            size="icon"
            variant="swipe"
            className="w-16 h-16 rounded-full border-2 border-destructive/20 hover:border-destructive hover:bg-destructive/10"
            disabled={isProcessing}
            onClick={() => {
              if (isProcessing || hasSwipedRef.current) return;
              
              console.log('❌ Reject button clicked:', { 
                profileId: profile.id, 
                profileName: profile.display_name 
              });

              haptics.light();
              hasSwipedRef.current = true;
              setIsProcessing(true);
              
              api.start({
                x: -(200 + window.innerWidth),
                rotate: -20,
                opacity: 0,
                onRest: () => {
                  console.log('✅ Reject animation complete');
                  onSwipe(false);
                  hasSwipedRef.current = false;
                  setIsProcessing(false);
                },
              });
            }}
            aria-label="Reject profile"
          >
            <X className="w-8 h-8 text-destructive" />
          </Button>
          <Button
            size="icon"
            variant="swipe"
            className="w-16 h-16 rounded-full border-2 border-primary/20 hover:border-primary hover:bg-primary/10"
            disabled={isProcessing}
            onClick={() => {
              if (isProcessing || hasSwipedRef.current) return;
              
              console.log('💜 Like button clicked:', { 
                profileId: profile.id, 
                profileName: profile.display_name 
              });

              haptics.medium();
              hasSwipedRef.current = true;
              setIsProcessing(true);
              
              api.start({
                x: 200 + window.innerWidth,
                rotate: 20,
                opacity: 0,
                onRest: () => {
                  console.log('✅ Like animation complete');
                  onSwipe(true);
                  hasSwipedRef.current = false;
                  setIsProcessing(false);
                },
              });
            }}
            aria-label="Like profile"
          >
            <Heart className="w-8 h-8 text-primary" />
          </Button>
        </div>
      </animated.div>
    </div>
  );
};

export default SwipeableCard;

import { useRef } from "react";
import { useSpring, animated } from "@react-spring/web";
import { useDrag } from "@use-gesture/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, X, MapPin } from "lucide-react";
import { haptics } from "@/lib/native";

interface Profile {
  id: string;
  display_name: string;
  bio: string | null;
  age: number;
  city: string | null;
  avatar_url: string | null;
  intent: string;
}

interface SwipeableCardProps {
  profile: Profile;
  onSwipe: (isLike: boolean) => void;
}

const SwipeableCard = ({ profile, onSwipe }: SwipeableCardProps) => {
  const hasSwipedRef = useRef(false);

  const [{ x, y, rotate, opacity }, api] = useSpring(() => ({
    x: 0,
    y: 0,
    rotate: 0,
    opacity: 1,
    config: { tension: 300, friction: 30 },
  }));

  const bind = useDrag(
    ({ active, movement: [mx, my], velocity: [vx], direction: [dx] }) => {
      const trigger = vx > 0.5 || Math.abs(mx) > 150; // Swipe threshold
      const isLike = dx > 0;

      if (!active && trigger && !hasSwipedRef.current) {
        hasSwipedRef.current = true;
        
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
            onSwipe(isLike);
            hasSwipedRef.current = false;
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

  return (
    <div className="relative">
      <animated.div
        {...bind()}
        style={{ x, y, rotate, opacity, touchAction: "none" }}
        className="card-gradient-border overflow-hidden shadow-2xl cursor-grab active:cursor-grabbing"
      >
        <div className="relative aspect-[3/4] bg-gradient-to-br from-muted to-muted/50">
          {profile.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={profile.display_name}
              className="w-full h-full object-cover"
              draggable={false}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-8xl">👤</div>
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
            {profile.bio && <p className="text-white/90 mb-3">{profile.bio}</p>}
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="bg-white/20 backdrop-blur-sm border-white/30">
                {profile.intent.replace("_", " ")}
              </Badge>
            </div>
          </div>
        </div>

        <div className="p-6 flex justify-center gap-6">
          <Button
            size="icon"
            variant="swipe"
            className="w-16 h-16 rounded-full border-2 border-destructive/20 hover:border-destructive hover:bg-destructive/10"
            onClick={() => {
              haptics.light();
              hasSwipedRef.current = true;
              api.start({
                x: -(200 + window.innerWidth),
                rotate: -20,
                opacity: 0,
                onRest: () => {
                  onSwipe(false);
                  hasSwipedRef.current = false;
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
            onClick={() => {
              haptics.medium();
              hasSwipedRef.current = true;
              api.start({
                x: 200 + window.innerWidth,
                rotate: 20,
                opacity: 0,
                onRest: () => {
                  onSwipe(true);
                  hasSwipedRef.current = false;
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

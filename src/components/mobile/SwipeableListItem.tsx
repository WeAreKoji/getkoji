import { ReactNode, useState } from "react";
import { useDrag } from "@use-gesture/react";
import { useSpring, animated } from "@react-spring/web";
import { Trash2, Archive } from "lucide-react";
import { haptics } from "@/lib/native";
import { cn } from "@/lib/utils";

interface SwipeableListItemProps {
  children: ReactNode;
  onDelete?: () => void;
  onArchive?: () => void;
  threshold?: number;
  disabled?: boolean;
}

export const SwipeableListItem = ({
  children,
  onDelete,
  onArchive,
  threshold = 80,
  disabled = false,
}: SwipeableListItemProps) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const [{ x, opacity }, api] = useSpring(() => ({
    x: 0,
    opacity: 1,
    config: { tension: 300, friction: 30 },
  }));

  const bind = useDrag(
    async ({ last, movement: [mx], velocity: [vx], direction: [dx] }) => {
      if (disabled || isDeleting) return;

      const triggered = Math.abs(mx) > threshold;
      const swipeLeft = mx < 0;

      if (last && triggered) {
        const action = swipeLeft ? onDelete : onArchive;
        
        if (action) {
          setIsDeleting(true);
          haptics.medium();

          // Swipe out animation
          api.start({
            x: swipeLeft ? -window.innerWidth : window.innerWidth,
            opacity: 0,
            config: { tension: 200, friction: 20 },
          });

          // Wait for animation then execute action
          setTimeout(() => {
            action();
            haptics.success();
          }, 300);
        } else {
          // Snap back if no action defined
          api.start({ x: 0, opacity: 1 });
        }
      } else if (last) {
        // Snap back
        api.start({ x: 0, opacity: 1 });
      } else {
        // During drag
        const progress = Math.abs(mx) / threshold;
        
        if (progress >= 0.5 && !isDeleting) {
          haptics.light();
        }

        api.start({
          x: mx,
          opacity: 1 - Math.min(progress * 0.3, 0.3),
          immediate: true,
        });
      }
    },
    {
      axis: "x",
      filterTaps: true,
      rubberband: true,
    }
  );

  return (
    <div className="relative overflow-hidden">
      {/* Background actions */}
      <div className="absolute inset-0 flex items-center justify-between px-6">
        {onArchive && (
          <div className="flex items-center gap-2 text-blue-500">
            <Archive className="w-5 h-5" />
            <span className="font-medium">Archive</span>
          </div>
        )}
        {onDelete && (
          <div className="flex items-center gap-2 text-destructive ml-auto">
            <span className="font-medium">Delete</span>
            <Trash2 className="w-5 h-5" />
          </div>
        )}
      </div>

      {/* Content */}
      <animated.div
        {...bind()}
        style={{ x, opacity }}
        className={cn(
          "relative bg-card touch-pan-y",
          isDeleting && "pointer-events-none"
        )}
      >
        {children}
      </animated.div>
    </div>
  );
};

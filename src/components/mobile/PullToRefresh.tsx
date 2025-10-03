import { ReactNode, useState } from "react";
import { useDrag } from "@use-gesture/react";
import { useSpring, animated } from "@react-spring/web";
import { RefreshCw } from "lucide-react";
import { haptics } from "@/lib/native";
import { cn } from "@/lib/utils";

interface PullToRefreshProps {
  children: ReactNode;
  onRefresh: () => Promise<void>;
  threshold?: number;
  disabled?: boolean;
}

export const PullToRefresh = ({
  children,
  onRefresh,
  threshold = 80,
  disabled = false,
}: PullToRefreshProps) => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [{ y, rotation, opacity }, api] = useSpring(() => ({
    y: 0,
    rotation: 0,
    opacity: 0,
    config: { tension: 300, friction: 30 },
  }));

  const bind = useDrag(
    async ({ last, movement: [, my], velocity: [, vy], direction: [, dy] }) => {
      if (disabled || isRefreshing) return;

      // Only allow pull down from top of page
      if (window.scrollY > 0) return;

      const triggered = my > threshold && dy > 0;

      if (last && triggered) {
        setIsRefreshing(true);
        haptics.medium();

        api.start({
          y: threshold,
          rotation: 360,
          opacity: 1,
        });

        try {
          await onRefresh();
          haptics.success();
        } catch (error) {
          haptics.error();
        } finally {
          setIsRefreshing(false);
          api.start({
            y: 0,
            rotation: 0,
            opacity: 0,
          });
        }
      } else if (last) {
        api.start({
          y: 0,
          rotation: 0,
          opacity: 0,
        });
      } else {
        const pullProgress = Math.min(my / threshold, 1);
        api.start({
          y: my > 0 ? my * 0.5 : 0,
          rotation: pullProgress * 180,
          opacity: pullProgress,
          immediate: true,
        });

        if (pullProgress >= 1 && !isRefreshing) {
          haptics.light();
        }
      }
    },
    {
      axis: "y",
      filterTaps: true,
      bounds: { top: 0 },
      rubberband: true,
    }
  );

  return (
    <div className="relative w-full h-full overflow-hidden">
      <animated.div
        className="absolute left-1/2 -translate-x-1/2 z-50 flex items-center justify-center"
        style={{
          y,
          opacity,
          top: 0,
        }}
      >
        <animated.div
          className={cn(
            "w-10 h-10 rounded-full bg-primary/10 backdrop-blur-sm flex items-center justify-center",
            "border-2 border-primary/20"
          )}
          style={{ rotate: rotation }}
        >
          <RefreshCw className="w-5 h-5 text-primary" />
        </animated.div>
      </animated.div>

      <div {...bind()} className="w-full h-full" style={{ touchAction: "pan-y" }}>
        {children}
      </div>
    </div>
  );
};

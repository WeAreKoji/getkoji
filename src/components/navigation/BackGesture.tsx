import { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useSpring, animated } from "@react-spring/web";
import { useDrag } from "@use-gesture/react";
import { haptics } from "@/lib/native";

interface BackGestureProps {
  children: React.ReactNode;
  onBack?: () => void;
  disabled?: boolean;
}

/**
 * Wraps content with swipe-from-left-edge-to-go-back gesture
 * Similar to iOS/Android native back gesture
 */
export const BackGesture = ({ children, onBack, disabled = false }: BackGestureProps) => {
  const navigate = useNavigate();
  const hasNavigatedRef = useRef(false);

  const [{ x, opacity }, api] = useSpring(() => ({
    x: 0,
    opacity: 1,
    config: { tension: 300, friction: 30 },
  }));

  const bind = useDrag(
    ({ active, movement: [mx], velocity: [vx], direction: [dx], first, last }) => {
      // Only trigger if swipe starts from left edge (first 20% of screen)
      if (first && mx > window.innerWidth * 0.2) {
        return;
      }

      const trigger = (vx > 0.5 && dx > 0) || mx > window.innerWidth * 0.5;

      if (!active && trigger && !hasNavigatedRef.current && !disabled) {
        hasNavigatedRef.current = true;
        
        // Haptic feedback
        haptics.selection();

        // Animate out and navigate
        api.start({
          x: window.innerWidth,
          opacity: 0,
          config: { tension: 200, friction: 20 },
          onRest: () => {
            if (onBack) {
              onBack();
            } else {
              navigate(-1);
            }
            hasNavigatedRef.current = false;
          },
        });
      } else {
        // During drag
        api.start({
          x: active && dx > 0 ? mx : 0,
          opacity: active ? 1 - Math.min(mx / window.innerWidth, 0.3) : 1,
          immediate: active,
        });
      }
    },
    { 
      filterTaps: true,
      axis: "x",
    }
  );

  if (disabled) {
    return <>{children}</>;
  }

  return (
    <animated.div
      {...bind()}
      style={{ x, opacity, touchAction: "pan-y" }}
      className="w-full h-full"
    >
      {children}
    </animated.div>
  );
};

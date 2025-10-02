import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SafeAreaViewProps {
  children: ReactNode;
  className?: string;
  top?: boolean;
  bottom?: boolean;
  left?: boolean;
  right?: boolean;
}

/**
 * SafeAreaView component that respects device notches and home indicators
 * Use this to wrap page content that needs safe area insets
 */
export const SafeAreaView = ({ 
  children, 
  className,
  top = true,
  bottom = true,
  left = true,
  right = true
}: SafeAreaViewProps) => {
  return (
    <div 
      className={cn(
        "w-full h-full",
        top && "pt-[env(safe-area-inset-top)]",
        bottom && "pb-[env(safe-area-inset-bottom)]",
        left && "pl-[env(safe-area-inset-left)]",
        right && "pr-[env(safe-area-inset-right)]",
        className
      )}
    >
      {children}
    </div>
  );
};

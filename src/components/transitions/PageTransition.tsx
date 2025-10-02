import { ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "react-router-dom";

interface PageTransitionProps {
  children: ReactNode;
  type?: "slide" | "fade" | "scale";
}

const variants = {
  slide: {
    initial: { x: "100%", opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: "-100%", opacity: 0 },
  },
  slideRight: {
    initial: { x: "-100%", opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: "100%", opacity: 0 },
  },
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
  scale: {
    initial: { scale: 0.95, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: 0.95, opacity: 0 },
  },
};

export const PageTransition = ({ children, type = "slide" }: PageTransitionProps) => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial="initial"
        animate="animate"
        exit="exit"
        variants={variants[type]}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 30,
          duration: 0.3,
        }}
        className="w-full h-full"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

// Hook for programmatic navigation with animation hint
export const useNavigateWithTransition = () => {
  const location = useLocation();
  
  return {
    currentPath: location.pathname,
    isForwardNav: (targetPath: string) => {
      // Determine if navigation is forward (slide left) or back (slide right)
      const paths = ["/", "/auth", "/onboarding", "/discover", "/creators", "/matches", "/profile"];
      const currentIndex = paths.indexOf(location.pathname);
      const targetIndex = paths.indexOf(targetPath);
      return targetIndex > currentIndex;
    },
  };
};

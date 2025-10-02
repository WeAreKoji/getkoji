import { useOnlineStatus } from "@/lib/offline";
import { WifiOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export const OfflineIndicator = () => {
  const isOnline = useOnlineStatus();

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          className="fixed top-0 left-0 right-0 z-[100] bg-destructive text-destructive-foreground px-4 py-2 flex items-center justify-center gap-2 shadow-lg"
          style={{ paddingTop: "calc(0.5rem + env(safe-area-inset-top))" }}
        >
          <WifiOff className="w-4 h-4" />
          <span className="text-sm font-medium">You're offline</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

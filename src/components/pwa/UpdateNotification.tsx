import { useServiceWorker } from '@/hooks/useServiceWorker';
import { Button } from '@/components/ui/button';
import { RefreshCw, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export const UpdateNotification = () => {
  const { isUpdateAvailable, updateServiceWorker, dismissUpdate } = useServiceWorker();

  return (
    <AnimatePresence>
      {isUpdateAvailable && (
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className={cn(
            "fixed bottom-20 md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:w-auto z-50",
            "bg-card border border-border rounded-xl shadow-lg",
            "p-4 flex items-center gap-3"
          )}
        >
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <RefreshCw className="w-5 h-5 text-primary" />
          </div>
          
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground">
              Update available
            </p>
            <p className="text-xs text-muted-foreground">
              Tap to refresh and get the latest version
            </p>
          </div>
          
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              variant="ghost"
              size="icon"
              onClick={dismissUpdate}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              onClick={updateServiceWorker}
              className="h-8 px-3"
            >
              Update
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

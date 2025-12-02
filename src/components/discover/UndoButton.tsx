import { Button } from "@/components/ui/button";
import { Undo2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface UndoButtonProps {
  visible: boolean;
  onClick: () => void;
  loading?: boolean;
}

export const UndoButton = ({ visible, onClick, loading }: UndoButtonProps) => {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.9 }}
          transition={{ duration: 0.2 }}
          className="fixed bottom-28 left-1/2 -translate-x-1/2 z-50"
        >
          <Button
            onClick={onClick}
            disabled={loading}
            variant="secondary"
            className="shadow-lg border border-border/50 gap-2 px-6"
          >
            <Undo2 className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Undo
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
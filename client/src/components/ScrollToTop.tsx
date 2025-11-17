import { ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

interface ScrollToTopProps {
  show: boolean;
  onClick: () => void;
}

export default function ScrollToTop({ show, onClick }: ScrollToTopProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ type: "spring", stiffness: 200 }}
          className="fixed bottom-24 right-6 z-50"
        >
          <Button
            variant="default"
            size="icon"
            onClick={onClick}
            className="rounded-full shadow-lg hover-elevate active-elevate-2"
            data-testid="button-scroll-top"
          >
            <ArrowUp className="w-4 h-4" />
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

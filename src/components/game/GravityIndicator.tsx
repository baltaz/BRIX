import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "@/lib/store/gameStore";
import { Direction } from "@/lib/game/types";

const arrowRotation: Record<Direction, number> = {
  up: -90,
  down: 90,
  left: 180,
  right: 0,
};

export function GravityIndicator() {
  const direction = useGameStore((s) => s.currentDirection);

  return (
    <AnimatePresence>
      {direction && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.5 }}
          className="absolute inset-0 flex items-center justify-center pointer-events-none z-10"
        >
          <motion.div
            animate={{ rotate: arrowRotation[direction] }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="text-5xl text-white/20"
          >
            →
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

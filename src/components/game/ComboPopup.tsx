import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "@/lib/store/gameStore";

export function ComboPopup() {
  const comboEvents = useGameStore((s) => s.comboEvents);
  const latest = comboEvents.length > 0 ? comboEvents[comboEvents.length - 1] : null;

  return (
    <AnimatePresence mode="wait">
      {latest && latest.chain > 1 && (
        <motion.div
          key={`combo-${latest.chain}-${comboEvents.length}`}
          initial={{ opacity: 0, scale: 0.3, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 1.5, y: -40 }}
          transition={{ type: "spring", stiffness: 500, damping: 20 }}
          className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none"
        >
          <div className="text-center">
            <motion.div
              animate={{ scale: [1, 1.15, 1] }}
              transition={{ duration: 0.3, repeat: 1 }}
              className="text-5xl font-black drop-shadow-lg"
              style={{
                background: "linear-gradient(to bottom, #fbbf24, #f97316)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                textShadow: "none",
                filter: "drop-shadow(0 2px 8px rgba(249,115,22,0.5))",
              }}
            >
              x{latest.chain} COMBO
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="text-xl font-bold text-amber-300 mt-1"
            >
              +{latest.points.toLocaleString()}
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

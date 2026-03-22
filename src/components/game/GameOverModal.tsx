import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { useGameStore } from "@/lib/store/gameStore";

export function GameOverModal() {
  const phase = useGameStore((s) => s.phase);
  const livesLeft = useGameStore((s) => s.livesLeft);
  const score = useGameStore((s) => s.score);
  const retry = useGameStore((s) => s.retry);

  // Solo se muestra cuando quedan vidas (sin vidas lo maneja RunEndModal)
  if (phase !== "lost" || livesLeft <= 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 flex items-center justify-center z-50"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="mx-4 w-full max-w-xs rounded-2xl p-6 text-center"
          style={{
            background: "#fef8f8",
            boxShadow: "0 8px 32px rgba(240,66,91,0.35), 0 0 0 1px rgba(255,255,255,0.6)",
          }}
        >
          <h2 className="text-2xl font-black mb-2" style={{ color: "#f0425b" }}>
            Sin Movimientos
          </h2>
          <p className="text-sm mb-1" style={{ color: "#d26a61" }}>
            Puntaje: <span className="font-black">{score.toLocaleString()}</span>
          </p>
          <p className="text-xs mb-6" style={{ color: "#d26a61", opacity: 0.7 }}>
            Te quedan {livesLeft} {livesLeft === 1 ? "vida" : "vidas"} para continuar
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={retry}
              className="py-3 px-6 rounded-xl font-black text-white transition-all active:scale-95"
              style={{
                background: "#f0425b",
                boxShadow: "0px 5px 0px #b82f43",
              }}
            >
              Reintentar ({livesLeft} {livesLeft === 1 ? "vida" : "vidas"})
            </button>
            <Link
              to="/"
              className="py-3 px-6 rounded-xl font-bold transition-all active:scale-95"
              style={{
                background: "rgba(240,66,91,0.10)",
                color: "#d26a61",
              }}
            >
              Volver al menú
            </Link>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

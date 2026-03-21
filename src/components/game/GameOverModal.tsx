import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useGameStore } from "@/lib/store/gameStore";

export function GameOverModal() {
  const { user } = useAuth();
  const phase = useGameStore((s) => s.phase);
  const livesLeft = useGameStore((s) => s.livesLeft);
  const score = useGameStore((s) => s.score);
  const retry = useGameStore((s) => s.retry);
  const shouldPromptLogin = livesLeft <= 0 && (!user || user.isAnonymous);

  if (phase !== "lost") return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 bg-black/70 flex items-center justify-center z-50 rounded-xl"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="bg-gray-900 border border-white/10 rounded-2xl p-6 text-center max-w-xs mx-4"
        >
          <h2 className="text-2xl font-bold text-red-400 mb-2">Sin Movimientos</h2>
          <p className="text-white/60 mb-1">Puntaje: {score.toLocaleString()}</p>
          <p className="text-white/40 text-sm mb-6">
            {livesLeft > 0
              ? `Te quedan ${livesLeft} vidas para continuar la run`
              : "Perdiste las 3 vidas. Si continúas, reinicias el puntaje."}
          </p>
          {shouldPromptLogin && (
            <p className="text-emerald-300/80 text-sm mb-4">
              Inicia sesión desde el menú para guardar tus próximas runs en el ranking global.
            </p>
          )}
          <div className="flex flex-col gap-3">
            <button
              onClick={retry}
              className="py-3 px-6 rounded-xl bg-purple-600 hover:bg-purple-500 active:bg-purple-700 font-bold transition-colors"
            >
              {livesLeft > 0 ? `Reintentar (${livesLeft} vidas)` : "Reiniciar"}
            </button>
            {shouldPromptLogin && (
              <Link to="/" className="py-3 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-semibold transition-colors">
                Iniciar sesión
              </Link>
            )}
            <Link to="/levels" className="py-3 px-6 rounded-xl bg-white/10 hover:bg-white/15 font-semibold transition-colors">
              Volver a Niveles
            </Link>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

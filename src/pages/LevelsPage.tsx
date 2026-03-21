import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { loadPublicLevels } from "@/lib/game/catalog";
import {
  LevelData,
  PIECE_COLORS,
  PieceType,
  isMatchableType,
} from "@/lib/game/types";

export default function LevelsPage() {
  const [levels, setLevels] = useState<LevelData[]>([]);

  useEffect(() => {
    void loadPublicLevels().then(setLevels);
  }, []);

  return (
    <main className="min-h-dvh max-w-md mx-auto px-4 py-6">
      <div className="flex items-center gap-4 mb-6">
        <Link
          to="/"
          className="text-sm text-white/40 hover:text-white/70 transition-colors"
        >
          ← Menú
        </Link>
        <h1 className="text-2xl font-bold">Niveles</h1>
      </div>

      {levels.length === 0 && (
        <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-white/50">
          Todavía no hay niveles publicados.
        </div>
      )}

      <div className="flex flex-col gap-3">
        {levels.map((level, index) => {
          const pieceTypes = new Set<PieceType>();
          for (const row of level.grid) {
            for (const cell of row) {
              if (cell !== 0 && isMatchableType(cell)) {
                pieceTypes.add(cell as PieceType);
              }
            }
          }

          return (
            <motion.div
              key={level.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Link
                to={`/game/${level.id}`}
                className="block p-4 rounded-xl bg-white/5 hover:bg-white/10 active:bg-white/5 border border-white/5 hover:border-white/10 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-purple-600/30 flex items-center justify-center font-bold text-lg">
                      {level.order}
                    </div>
                    <div>
                      <h3 className="font-semibold">Nivel {level.order}</h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-white/30">
                          {level.maxMoves} movs
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-1">
                    {Array.from(pieceTypes).map((type) => (
                      <div
                        key={type}
                        className="w-4 h-4 rounded-sm"
                        style={{ backgroundColor: PIECE_COLORS[type] }}
                      />
                    ))}
                  </div>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </main>
  );
}

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { loadPublicLevels } from "@/lib/game/catalog";
import { isLevelUnlocked } from "@/lib/progress";
import { LevelData, PieceType, isMatchableType } from "@/lib/game/types";
import { PIECE_STYLE } from "@/lib/game/pieceStyles";

export default function LevelsPage() {
  const [levels, setLevels] = useState<LevelData[]>([]);

  useEffect(() => {
    loadPublicLevels().then((all) => {
      setLevels(all.filter((l) => isLevelUnlocked(l.order)));
    });
  }, []);

  return (
    <main className="min-h-dvh max-w-md mx-auto px-4 py-6">
      <div className="flex items-center gap-4 mb-6">
        <Link
          to="/"
          className="text-sm font-bold text-white/60 hover:text-white transition-colors"
        >
          ← Menú
        </Link>
        <h1 className="text-2xl font-black text-white">Niveles</h1>
      </div>

      {levels.length === 0 && (
        <div
          className="rounded-xl p-4 text-sm font-bold text-white/70"
          style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.20)" }}
        >
          Todavía no tenés niveles desbloqueados.
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
                className="block p-4 rounded-xl transition-all active:scale-[0.98]"
                style={{
                  background: "rgba(255,255,255,0.15)",
                  border: "1px solid rgba(255,255,255,0.20)",
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center font-black text-lg"
                      style={{
                        background: "#fef8f8",
                        color: "#f0425b",
                        boxShadow: "0px 4px 0px rgba(0,0,0,0.15)",
                      }}
                    >
                      {level.order}
                    </div>
                    <div>
                      <h3 className="font-black text-white">Nivel {level.order}</h3>
                      <span className="text-xs text-white/60 font-bold">
                        {level.maxMoves} movs
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-1.5">
                    {Array.from(pieceTypes).map((type) => (
                      <div
                        key={type}
                        className="w-5 h-5 rounded flex items-center justify-center"
                        style={{
                          background: PIECE_STYLE[type].background,
                          boxShadow: `0px 3px 0px ${PIECE_STYLE[type].shadowColor}`,
                        }}
                      >
                        <span
                          className="text-[9px] font-black"
                          style={{ color: PIECE_STYLE[type].color }}
                        >
                          {type}
                        </span>
                      </div>
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

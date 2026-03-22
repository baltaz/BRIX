import { useGameStore } from "@/lib/store/gameStore";

export function HUD() {
  const score = useGameStore((s) => s.score);
  const movesLeft = useGameStore((s) => s.movesLeft);
  const livesLeft = useGameStore((s) => s.livesLeft);
  const level = useGameStore((s) => s.level);
  const comboChain = useGameStore((s) => s.comboChain);

  return (
    <div className="flex items-center justify-between w-full px-3 py-2 rounded-xl bg-black/15 mb-2">
      <div className="flex flex-col items-center min-w-[52px]">
        <span className="text-[9px] uppercase tracking-widest text-white/50">
          Nivel
        </span>
        <span className="text-lg font-black text-white">
          {level?.order ?? "-"}
        </span>
      </div>

      <div className="flex flex-col items-center min-w-[80px]">
        <span className="text-[9px] uppercase tracking-widest text-white/50">
          Puntaje
        </span>
        <span className="text-2xl font-black tabular-nums text-white">
          {score.toLocaleString()}
        </span>
        {comboChain > 1 && (
          <span className="text-xs font-black text-yellow-200 animate-pulse">
            x{comboChain} COMBO
          </span>
        )}
      </div>

      <div className="flex gap-4">
        <div className="flex flex-col items-center min-w-[44px]">
          <span className="text-[9px] uppercase tracking-widest text-white/50">
            Movs
          </span>
          <span
            className={`text-lg font-black tabular-nums ${
              movesLeft <= 2 ? "text-yellow-200" : "text-white"
            }`}
          >
            {movesLeft}
          </span>
        </div>

        <div className="flex flex-col items-center min-w-[44px]">
          <span className="text-[9px] uppercase tracking-widest text-white/50">
            Vidas
          </span>
          <span className="text-lg font-black tabular-nums text-white">
            {livesLeft}
          </span>
        </div>
      </div>
    </div>
  );
}

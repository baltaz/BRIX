import { useGameStore } from "@/lib/store/gameStore";

export function HUD() {
  const score = useGameStore((s) => s.score);
  const movesLeft = useGameStore((s) => s.movesLeft);
  const livesLeft = useGameStore((s) => s.livesLeft);
  const level = useGameStore((s) => s.level);
  const comboChain = useGameStore((s) => s.comboChain);

  return (
    <div className="flex items-center justify-between w-full px-2 py-3">
      <div className="flex flex-col items-center min-w-[60px]">
        <span className="text-[10px] uppercase tracking-wider text-purple-300/60">
          Nivel
        </span>
        <span className="text-lg font-bold">
          {level?.order ?? "-"}
        </span>
      </div>

      <div className="flex flex-col items-center min-w-[80px]">
        <span className="text-[10px] uppercase tracking-wider text-purple-300/60">
          Puntaje
        </span>
        <span className="text-2xl font-black tabular-nums text-amber-400">
          {score.toLocaleString()}
        </span>
        {comboChain > 1 && (
          <span className="text-xs font-bold text-orange-400 animate-pulse">
            x{comboChain} COMBO
          </span>
        )}
      </div>

      <div className="flex gap-4">
        <div className="flex flex-col items-center min-w-[50px]">
          <span className="text-[10px] uppercase tracking-wider text-purple-300/60">
            Movs
          </span>
          <span
            className={`text-lg font-bold tabular-nums ${
              movesLeft <= 2 ? "text-red-400" : ""
            }`}
          >
            {movesLeft}
          </span>
        </div>

        <div className="flex flex-col items-center min-w-[50px]">
          <span className="text-[10px] uppercase tracking-wider text-purple-300/60">
            Vidas
          </span>
          <span className="text-lg font-bold tabular-nums">
            {livesLeft}
          </span>
        </div>
      </div>
    </div>
  );
}

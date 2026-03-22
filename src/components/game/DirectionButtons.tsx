import { useGameStore } from "@/lib/store/gameStore";
import { Direction } from "@/lib/game/types";

const buttons: { dir: Direction; label: string; className: string }[] = [
  { dir: "up", label: "▲", className: "col-start-2 row-start-1" },
  { dir: "left", label: "◄", className: "col-start-1 row-start-2" },
  { dir: "right", label: "►", className: "col-start-3 row-start-2" },
  { dir: "down", label: "▼", className: "col-start-2 row-start-3" },
];

export function DirectionButtons() {
  const move = useGameStore((s) => s.move);
  const phase = useGameStore((s) => s.phase);
  const disabled = phase !== "idle";

  return (
    <div className="hidden md:grid grid-cols-3 grid-rows-3 gap-1 w-fit mx-auto">
      {buttons.map(({ dir, label, className }) => (
        <button
          key={dir}
          onClick={() => move(dir)}
          disabled={disabled}
          className={`${className} w-14 h-14 rounded-xl bg-white/25 hover:bg-white/35 active:bg-white/40 disabled:opacity-30 disabled:cursor-not-allowed text-xl font-bold transition-all active:scale-95`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

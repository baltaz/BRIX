import { useEffect } from "react";
import { useGameStore } from "@/lib/store/gameStore";
import { Direction } from "@/lib/game/types";

const keyMap: Record<string, Direction> = {
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
  w: "up",
  s: "down",
  a: "left",
  d: "right",
  W: "up",
  S: "down",
  A: "left",
  D: "right",
};

export function useKeyboard() {
  const move = useGameStore((s) => s.move);
  const phase = useGameStore((s) => s.phase);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (phase !== "idle") return;

      const direction = keyMap[e.key];
      if (direction) {
        e.preventDefault();
        move(direction);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [move, phase]);
}

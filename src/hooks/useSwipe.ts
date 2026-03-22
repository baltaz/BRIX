import { useEffect, useRef } from "react";
import { useGameStore } from "@/lib/store/gameStore";
import { Direction } from "@/lib/game/types";

const MIN_SWIPE_DISTANCE = 30;

export function useSwipe(elementRef: React.RefObject<HTMLElement | null>) {
  const move = useGameStore((s) => s.move);
  const phase = useGameStore((s) => s.phase);
  const startPos = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const el = elementRef.current;
    if (!el) return;

    function handleTouchStart(e: TouchEvent) {
      const touch = e.touches[0];
      startPos.current = { x: touch.clientX, y: touch.clientY };
    }

    function handleTouchEnd(e: TouchEvent) {
      if (!startPos.current || phase !== "idle") {
        startPos.current = null;
        return;
      }

      const touch = e.changedTouches[0];
      const dx = touch.clientX - startPos.current.x;
      const dy = touch.clientY - startPos.current.y;
      startPos.current = null;

      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);

      if (Math.max(absDx, absDy) < MIN_SWIPE_DISTANCE) return;

      let direction: Direction;
      if (absDx > absDy) {
        direction = dx > 0 ? "right" : "left";
      } else {
        direction = dy > 0 ? "down" : "up";
      }

      move(direction);
    }

    el.addEventListener("touchstart", handleTouchStart, { passive: true });
    el.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      el.removeEventListener("touchstart", handleTouchStart);
      el.removeEventListener("touchend", handleTouchEnd);
    };
  }, [elementRef, move, phase]);
}

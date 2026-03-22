import { useEffect, useRef } from "react";
import { useGameStore } from "@/lib/store/gameStore";
import { Direction } from "@/lib/game/types";

const MIN_SWIPE_DISTANCE = 30;

export function useSwipe(elementRef: React.RefObject<HTMLElement | null>) {
  const moveRef = useRef(useGameStore.getState().move);
  const phaseRef = useRef(useGameStore.getState().phase);
  const startPos = useRef<{ x: number; y: number } | null>(null);

  // Mantenemos refs actualizadas sin re-crear los listeners en cada cambio de phase
  useEffect(() => {
    return useGameStore.subscribe((state) => {
      moveRef.current = state.move;
      phaseRef.current = state.phase;
    });
  }, []);

  useEffect(() => {
    const el = elementRef.current;
    if (!el) return;

    function handleTouchStart(e: TouchEvent) {
      // Previene scroll del navegador — crítico en iOS Safari
      e.preventDefault();
      const touch = e.touches[0];
      startPos.current = { x: touch.clientX, y: touch.clientY };
    }

    function handleTouchMove(e: TouchEvent) {
      // Bloquea el scroll durante el gesto
      e.preventDefault();
    }

    function handleTouchEnd(e: TouchEvent) {
      if (!startPos.current || phaseRef.current !== "idle") {
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

      moveRef.current(direction);
    }

    // passive: false es obligatorio para poder llamar preventDefault
    el.addEventListener("touchstart", handleTouchStart, { passive: false });
    el.addEventListener("touchmove", handleTouchMove, { passive: false });
    el.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      el.removeEventListener("touchstart", handleTouchStart);
      el.removeEventListener("touchmove", handleTouchMove);
      el.removeEventListener("touchend", handleTouchEnd);
    };
  }, [elementRef]);
}

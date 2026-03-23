import { useEffect, useRef } from "react";
import { useGameStore } from "@/lib/store/gameStore";
import { Direction } from "@/lib/game/types";

const MIN_SWIPE_DISTANCE = 30;

/**
 * Detecta swipes en window (no en un ref) para garantizar que los listeners
 * estén activos desde el primer render, incluso cuando el nivel todavía
 * está cargando y el contenedor del juego no existe aún.
 * move y phase se leen desde refs para evitar closures stale sin recrear listeners.
 */
export function useSwipe() {
  const moveRef  = useRef(useGameStore.getState().move);
  const phaseRef = useRef(useGameStore.getState().phase);
  const startPos = useRef<{ x: number; y: number } | null>(null);

  // Mantiene las refs actualizadas ante cambios de estado sin re-crear listeners
  useEffect(() =>
    useGameStore.subscribe((s) => {
      moveRef.current  = s.move;
      phaseRef.current = s.phase;
    }),
  []);

  useEffect(() => {
    function handleTouchStart(e: TouchEvent) {
      const touch = e.touches[0];
      startPos.current = { x: touch.clientX, y: touch.clientY };
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

      const direction: Direction =
        absDx > absDy
          ? dx > 0 ? "right" : "left"
          : dy > 0 ? "down"  : "up";

      moveRef.current(direction);
    }

    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchend",   handleTouchEnd,   { passive: true });

    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchend",   handleTouchEnd);
    };
  }, []); // ← vacío: se registra una vez al montar, funciona siempre
}

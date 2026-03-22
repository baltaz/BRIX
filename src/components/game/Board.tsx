import { useGameStore } from "@/lib/store/gameStore";
import { GRID_ROWS, GRID_COLS } from "@/lib/game/types";
import { Piece } from "./Piece";
import { useRef, useState, useEffect } from "react";

export function Board() {
  const pieces = useGameStore((s) => s.pieces);
  const containerRef = useRef<HTMLDivElement>(null);
  const [cellSize, setCellSize] = useState(32);
  const gap = 2;

  useEffect(() => {
    function recalc() {
      if (!containerRef.current) return;
      const parent = containerRef.current.parentElement;
      if (!parent) return;

      const availableWidth = parent.clientWidth - 8;
      const availableHeight = parent.clientHeight - 8;

      const cellFromWidth = (availableWidth - (GRID_COLS - 1) * gap) / GRID_COLS;
      const cellFromHeight = (availableHeight - (GRID_ROWS - 1) * gap) / GRID_ROWS;

      setCellSize(Math.floor(Math.min(cellFromWidth, cellFromHeight, 64)));
    }

    recalc();
    window.addEventListener("resize", recalc);
    return () => window.removeEventListener("resize", recalc);
  }, []);

  const boardWidth = GRID_COLS * (cellSize + gap) - gap;
  const boardHeight = GRID_ROWS * (cellSize + gap) - gap;
  const padding = 6;

  return (
    <div ref={containerRef} className="flex items-center justify-center w-full flex-1">
      <div
        className="relative"
        style={{
          width: boardWidth + padding * 2,
          height: boardHeight + padding * 2,
          padding,
        }}
      >
        <div className="absolute" style={{ left: padding, top: padding }}>
          {pieces.map((piece) => (
            <Piece key={piece.id} piece={piece} cellSize={cellSize} />
          ))}
        </div>
      </div>
    </div>
  );
}


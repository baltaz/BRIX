import { useGameStore } from "@/lib/store/gameStore";
import { GRID_ROWS, GRID_COLS, GRID_ROWS as ROWS, GRID_COLS as COLS, GridTemplate, WALL_TYPE } from "@/lib/game/types";
import { Piece } from "./Piece";
import { useRef, useState, useEffect } from "react";

export function Board() {
  const pieces = useGameStore((s) => s.pieces);
  const level = useGameStore((s) => s.level);
  const containerRef = useRef<HTMLDivElement>(null);
  const [cellSize, setCellSize] = useState(32);
  const gap = 2;

  useEffect(() => {
    function recalc() {
      if (!containerRef.current) return;
      const parent = containerRef.current.parentElement;
      if (!parent) return;

      const availableWidth = parent.clientWidth - 24;
      const availableHeight = parent.clientHeight - 24;

      const cellFromWidth = (availableWidth - (GRID_COLS - 1) * gap) / GRID_COLS;
      const cellFromHeight = (availableHeight - (GRID_ROWS - 1) * gap) / GRID_ROWS;

      setCellSize(Math.floor(Math.min(cellFromWidth, cellFromHeight, 48)));
    }

    recalc();
    window.addEventListener("resize", recalc);
    return () => window.removeEventListener("resize", recalc);
  }, []);

  const boardWidth = GRID_COLS * (cellSize + gap) - gap;
  const boardHeight = GRID_ROWS * (cellSize + gap) - gap;
  const padding = 6;
  const visibleMask = level ? getVisibleMask(level.grid) : createFilledMask(true);

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
        {Array.from({ length: GRID_ROWS }).map((_, row) =>
          Array.from({ length: GRID_COLS }).map((_, col) => (
            visibleMask[row][col] ? (
              <div
                key={`cell-${row}-${col}`}
                className="absolute rounded-md grid-cell"
                style={{
                  width: cellSize,
                  height: cellSize,
                  left: padding + col * (cellSize + gap),
                  top: padding + row * (cellSize + gap),
                }}
              />
            ) : null
          ))
        )}

        <div className="absolute" style={{ left: padding, top: padding }}>
          {pieces.map((piece) => (
            <Piece key={piece.id} piece={piece} cellSize={cellSize} />
          ))}
        </div>
      </div>
    </div>
  );
}

function createFilledMask(value: boolean): boolean[][] {
  return Array.from({ length: ROWS }, () =>
    Array.from({ length: COLS }, () => value)
  );
}

function getVisibleMask(grid: GridTemplate): boolean[][] {
  const hasWalls = grid.some((row) => row.some((cell) => cell === WALL_TYPE));
  if (!hasWalls) {
    return createFilledMask(true);
  }

  const outsideMask = createFilledMask(false);
  const queue: Array<[number, number]> = [];

  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const isBorder = row === 0 || row === ROWS - 1 || col === 0 || col === COLS - 1;
      if (isBorder && grid[row][col] !== WALL_TYPE) {
        queue.push([row, col]);
      }
    }
  }

  while (queue.length > 0) {
    const [row, col] = queue.shift()!;
    if (
      row < 0 ||
      row >= ROWS ||
      col < 0 ||
      col >= COLS ||
      outsideMask[row][col] ||
      grid[row][col] === WALL_TYPE
    ) {
      continue;
    }

    outsideMask[row][col] = true;
    queue.push([row - 1, col], [row + 1, col], [row, col - 1], [row, col + 1]);
  }

  return Array.from({ length: ROWS }, (_, row) =>
    Array.from({ length: COLS }, (_, col) => grid[row][col] === WALL_TYPE || !outsideMask[row][col])
  );
}

import { useEffect, useState } from "react";

import {
  GRID_ROWS,
  GRID_COLS,
  PIECE_COLORS,
  PieceType,
  WALL_TYPE,
  MOBILE_WALL_TYPE,
  DYNAMIC_HORIZONTAL_TYPE,
  DYNAMIC_VERTICAL_TYPE,
} from "@/lib/game/types";

interface GridEditorProps {
  grid: number[][];
  onChange: (grid: number[][]) => void;
}

const PALETTE_VALUES = [
  0,
  1,
  2,
  3,
  4,
  5,
  6,
  7,
  8,
  WALL_TYPE,
  MOBILE_WALL_TYPE,
  DYNAMIC_HORIZONTAL_TYPE,
  DYNAMIC_VERTICAL_TYPE,
] as const;

function getCellStyle(value: number): React.CSSProperties {
  if (value === WALL_TYPE) {
    return {
      background:
        "repeating-linear-gradient(45deg, #71717a 0px, #71717a 2px, #a1a1aa 2px, #a1a1aa 6px)",
      border: "1px solid #52525b",
    };
  }
  if (value === MOBILE_WALL_TYPE) {
    return {
      background: "linear-gradient(135deg, #64748b 0%, #475569 45%, #334155 100%)",
      border: "1px solid #1e293b",
    };
  }
  if (value === DYNAMIC_HORIZONTAL_TYPE || value === DYNAMIC_VERTICAL_TYPE) {
    return {
      background: "linear-gradient(135deg, #0f766e 0%, #14b8a6 45%, #67e8f9 100%)",
      border: "1px solid rgba(8,145,178,0.9)",
    };
  }
  if (value > 0) {
    return { backgroundColor: PIECE_COLORS[value as PieceType] };
  }
  return { backgroundColor: "rgba(255,255,255,0.05)" };
}

export function GridEditor({ grid, onChange }: GridEditorProps) {
  const [selectedValue, setSelectedValue] = useState<number>(1);
  const [paintMode, setPaintMode] = useState<"paint" | "erase" | null>(null);

  useEffect(() => {
    function stopPainting() {
      setPaintMode(null);
    }

    window.addEventListener("pointerup", stopPainting);
    return () => window.removeEventListener("pointerup", stopPainting);
  }, []);

  function updateCell(row: number, col: number, value: number) {
    if (grid[row]?.[col] === value) return;
    const newGrid = grid.map((r) => [...r]);
    newGrid[row][col] = value;
    onChange(newGrid);
  }

  function handleCellPointerDown(
    row: number,
    col: number,
    event: React.PointerEvent<HTMLButtonElement>
  ) {
    if (event.button === 2) {
      setPaintMode("erase");
      updateCell(row, col, 0);
      return;
    }

    setPaintMode("paint");
    updateCell(row, col, selectedValue);
  }

  function handleCellPointerEnter(row: number, col: number) {
    if (paintMode === "paint") {
      updateCell(row, col, selectedValue);
    }

    if (paintMode === "erase") {
      updateCell(row, col, 0);
    }
  }

  function handleCellRightClick(row: number, col: number, e: React.MouseEvent) {
    e.preventDefault();
    updateCell(row, col, 0);
  }

  function clearGrid() {
    onChange(createEmptyGrid());
  }

  const cellSize = 32;
  const gap = 2;

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-white/40">
          <span>Click: colocar</span>
          <span>|</span>
          <span>Arrastrar: pintar</span>
          <span>|</span>
          <span>Click derecho: borrar</span>
          <span>|</span>
          <span className="text-white/60">La paleta define la pieza</span>
        </div>
        <button
          type="button"
          onClick={clearGrid}
          className="text-xs px-3 py-1 rounded-lg bg-red-600/20 text-red-400 hover:bg-red-600/30 transition-colors"
        >
          Limpiar
        </button>
      </div>

      <div className="flex flex-col gap-4 xl:flex-row xl:items-start">
        <div
          className="inline-grid rounded-lg border border-white/10 p-1"
          style={{
            gridTemplateColumns: `repeat(${GRID_COLS}, ${cellSize}px)`,
            gap: `${gap}px`,
            background: "var(--board-bg)",
          }}
        >
          {Array.from({ length: GRID_ROWS }).map((_, row) =>
            Array.from({ length: GRID_COLS }).map((_, col) => {
              const value = grid[row]?.[col] ?? 0;
              return (
                <button
                  key={`${row}-${col}`}
                  type="button"
                  onPointerDown={(event) =>
                    handleCellPointerDown(row, col, event)
                  }
                  onPointerEnter={() => handleCellPointerEnter(row, col)}
                  onContextMenu={(e) => handleCellRightClick(row, col, e)}
                  onDragStart={(e) => e.preventDefault()}
                  className="rounded-sm transition-all hover:ring-1 hover:ring-white/30 active:scale-90"
                  style={{
                    width: cellSize,
                    height: cellSize,
                    ...getCellStyle(value),
                  }}
                />
              );
            })
          )}
        </div>

        <div className="w-full rounded-xl border border-white/10 bg-white/5 p-3 xl:max-w-[220px]">
          <p className="mb-3 text-sm font-semibold text-white/80">Paleta</p>
          <div className="grid grid-cols-3 gap-2 xl:grid-cols-2">
            {PALETTE_VALUES.map((value) => {
              const isSelected = selectedValue === value;
              const label =
                value === 0
                  ? "Vacío"
                  : value === WALL_TYPE
                    ? "Muro"
                    : value === MOBILE_WALL_TYPE
                      ? "Muro móvil"
                      : value === DYNAMIC_HORIZONTAL_TYPE
                        ? "Ascensor H"
                        : value === DYNAMIC_VERTICAL_TYPE
                          ? "Ascensor V"
                    : `Pieza ${value}`;

              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setSelectedValue(value)}
                  className={`rounded-lg border p-2 text-xs transition-all ${
                    isSelected
                      ? "border-purple-400 bg-purple-500/20 text-white"
                      : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10"
                  }`}
                >
                  <div className="mb-2 flex justify-center">
                    <div className="h-8 w-8 rounded-sm" style={getCellStyle(value)} />
                  </div>
                  <span>{label}</span>
                </button>
              );
            })}
          </div>

          <p className="mt-4 text-xs text-white/40">
            Seleccionado:{" "}
            <span className="font-medium text-white/70">
              {selectedValue === 0
                ? "Vacío"
                : selectedValue === WALL_TYPE
                  ? "Muro"
                  : selectedValue === MOBILE_WALL_TYPE
                    ? "Muro móvil"
                    : selectedValue === DYNAMIC_HORIZONTAL_TYPE
                      ? "Ascensor horizontal"
                      : selectedValue === DYNAMIC_VERTICAL_TYPE
                        ? "Ascensor vertical"
                  : `Pieza ${selectedValue}`}
            </span>
          </p>
          <p className="mt-2 text-xs text-white/35">
            `Ascensor H` arranca hacia la derecha. `Ascensor V` arranca hacia
            abajo.
          </p>
        </div>
      </div>
    </div>
  );
}

export function createEmptyGrid(): number[][] {
  return Array.from({ length: GRID_ROWS }, () =>
    Array.from({ length: GRID_COLS }, () => 0)
  );
}

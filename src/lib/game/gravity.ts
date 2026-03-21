import {
  Direction,
  Piece,
  GRID_ROWS,
  GRID_COLS,
  blocksGravity,
} from "./types";

/**
 * Apply gravity: move all non-wall pieces in the given direction until they
 * hit a wall tile, the grid boundary, or another piece.
 * Wall tiles are static and always block movement.
 */
export function applyGravity(
  pieces: Piece[],
  direction: Direction
): { pieces: Piece[]; moved: boolean } {
  let anyMoved = false;

  const sortedPieces = getSortedPieces(pieces, direction);
  const newPieces: Piece[] = [];

  // Pre-populate occupied set with wall positions — they never move
  const newOccupied = new Set<string>();
  for (const piece of pieces) {
    if (blocksGravity(piece.type)) {
      newOccupied.add(`${piece.row},${piece.col}`);
    }
  }

  for (const piece of sortedPieces) {
    // Walls and already-matched pieces stay in place
    if (piece.matched || blocksGravity(piece.type)) {
      newPieces.push(piece);
      continue;
    }

    let { row, col } = piece;
    const [dr, dc] = getDirectionDelta(direction);

    while (true) {
      const nextRow = row + dr;
      const nextCol = col + dc;

      if (!isInBounds(nextRow, nextCol)) break;

      const key = `${nextRow},${nextCol}`;
      if (newOccupied.has(key)) break;

      row = nextRow;
      col = nextCol;
    }

    if (row !== piece.row || col !== piece.col) {
      anyMoved = true;
    }

    newOccupied.add(`${row},${col}`);
    newPieces.push({ ...piece, row, col });
  }

  return { pieces: newPieces, moved: anyMoved };
}

function getDirectionDelta(dir: Direction): [number, number] {
  switch (dir) {
    case "up":
      return [-1, 0];
    case "down":
      return [1, 0];
    case "left":
      return [0, -1];
    case "right":
      return [0, 1];
  }
}

/**
 * Sort pieces so those closest to the target wall are processed first,
 * preventing pieces from stacking incorrectly. Wall pieces always sort
 * stably — their pre-populated positions handle blocking.
 */
function getSortedPieces(pieces: Piece[], direction: Direction): Piece[] {
  const sorted = [...pieces];
  switch (direction) {
    case "up":
      sorted.sort((a, b) => a.row - b.row);
      break;
    case "down":
      sorted.sort((a, b) => b.row - a.row);
      break;
    case "left":
      sorted.sort((a, b) => a.col - b.col);
      break;
    case "right":
      sorted.sort((a, b) => b.col - a.col);
      break;
  }
  return sorted;
}

function isInBounds(row: number, col: number): boolean {
  return row >= 0 && row < GRID_ROWS && col >= 0 && col < GRID_COLS;
}

import { Piece, isMatchableType } from "./types";

interface MatchGroup {
  type: number;
  pieceIds: string[];
  positions: { row: number; col: number }[];
}

/**
 * Find all groups of 2+ adjacent same-color pieces.
 * Adjacency is horizontal or vertical (not diagonal).
 * Wall tiles are excluded — they never match.
 */
export function findMatches(pieces: Piece[]): MatchGroup[] {
  // Only colored pieces participate in matches.
  const activePieces = pieces.filter(
    (p) => !p.matched && isMatchableType(p.type)
  );
  if (activePieces.length === 0) return [];

  const posMap = new Map<string, Piece>();
  for (const p of activePieces) {
    posMap.set(`${p.row},${p.col}`, p);
  }

  const visited = new Set<string>();
  const groups: MatchGroup[] = [];

  for (const piece of activePieces) {
    if (visited.has(piece.id)) continue;

    const group: Piece[] = [];
    const queue: Piece[] = [piece];

    while (queue.length > 0) {
      const current = queue.pop()!;
      if (visited.has(current.id)) continue;
      visited.add(current.id);
      group.push(current);

      const neighbors = getNeighbors(current.row, current.col);
      for (const [nr, nc] of neighbors) {
        const neighbor = posMap.get(`${nr},${nc}`);
        if (
          neighbor &&
          !visited.has(neighbor.id) &&
          neighbor.type === current.type
        ) {
          queue.push(neighbor);
        }
      }
    }

    if (group.length >= 2) {
      groups.push({
        type: group[0].type,
        pieceIds: group.map((p) => p.id),
        positions: group.map((p) => ({ row: p.row, col: p.col })),
      });
    }
  }

  return groups;
}

/**
 * Mark matched pieces. Returns updated pieces array and the match groups found.
 */
export function applyMatches(pieces: Piece[]): {
  pieces: Piece[];
  matchGroups: MatchGroup[];
} {
  const matchGroups = findMatches(pieces);
  if (matchGroups.length === 0) {
    return { pieces, matchGroups: [] };
  }

  const matchedIds = new Set<string>();
  for (const group of matchGroups) {
    for (const id of group.pieceIds) {
      matchedIds.add(id);
    }
  }

  const updatedPieces = pieces.map((p) =>
    matchedIds.has(p.id) ? { ...p, matched: true } : p
  );

  return { pieces: updatedPieces, matchGroups };
}

/**
 * Remove all pieces that have been marked as matched.
 * Wall tiles are never matched so they are always preserved.
 */
export function removeMatchedPieces(pieces: Piece[]): Piece[] {
  return pieces.filter((p) => !p.matched);
}

function getNeighbors(row: number, col: number): [number, number][] {
  return [
    [row - 1, col],
    [row + 1, col],
    [row, col - 1],
    [row, col + 1],
  ];
}

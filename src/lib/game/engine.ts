import {
  Piece,
  Direction,
  LevelData,
  GridTemplate,
  AnyPieceType,
  GamePhase,
  ComboEvent,
  DYNAMIC_HORIZONTAL_TYPE,
  DYNAMIC_VERTICAL_TYPE,
  countsForCompletion,
} from "./types";
import { applyGravity } from "./gravity";
import { applyMatches, removeMatchedPieces } from "./matching";
import { calculatePoints } from "./scoring";

let pieceIdCounter = 0;

export function resetPieceIdCounter() {
  pieceIdCounter = 0;
}

/**
 * Convert a level's grid template into an array of Piece objects.
 * Value 0 = empty (skipped), 1-8 = colored piece, 9 = wall tile.
 */
export function createPiecesFromGrid(grid: GridTemplate): Piece[] {
  pieceIdCounter = 0;
  const pieces: Piece[] = [];

  for (let row = 0; row < grid.length; row++) {
    for (let col = 0; col < grid[row].length; col++) {
      const value = grid[row][col];
      if (value > 0) {
        const isDynamicHorizontal = value === DYNAMIC_HORIZONTAL_TYPE;
        const isDynamicVertical = value === DYNAMIC_VERTICAL_TYPE;
        pieces.push({
          id: `p${pieceIdCounter++}`,
          type: value as AnyPieceType,
          row,
          col,
          matched: false,
          autoAxis: isDynamicHorizontal
            ? "horizontal"
            : isDynamicVertical
              ? "vertical"
              : undefined,
          autoStep: isDynamicHorizontal || isDynamicVertical ? 1 : undefined,
        });
      }
    }
  }

  return pieces;
}

/** Returns only the mobile (non-wall, non-matched) pieces */
export function getMobilePieces(pieces: Piece[]): Piece[] {
  return pieces.filter((p) => !p.matched && countsForCompletion(p.type));
}

export interface MoveResult {
  pieces: Piece[];
  score: number;
  comboEvents: ComboEvent[];
  totalCleared: number;
  phase: GamePhase;
}

/**
 * Execute a full move: apply gravity, then resolve all matches/combos
 * in a loop until no more matches are found.
 */
export function executeMove(
  pieces: Piece[],
  direction: Direction,
  currentScore: number
): MoveResult {
  let currentPieces = pieces.map((p) => ({ ...p }));
  let score = currentScore;
  let comboChain = 0;
  const comboEvents: ComboEvent[] = [];
  let totalCleared = 0;

  const gravityResult = applyGravity(currentPieces, direction);
  currentPieces = gravityResult.pieces;

  let hasMatches = true;
  while (hasMatches) {
    const matchResult = applyMatches(currentPieces);

    if (matchResult.matchGroups.length === 0) {
      hasMatches = false;
      break;
    }

    comboChain++;
    const points = calculatePoints(matchResult.matchGroups, comboChain);
    score += points;

    const positions = matchResult.matchGroups.flatMap((g) => g.positions);
    const clearedCount = matchResult.matchGroups.reduce(
      (sum, g) => sum + g.pieceIds.length,
      0
    );
    totalCleared += clearedCount;

    comboEvents.push({ chain: comboChain, points, positions });

    currentPieces = removeMatchedPieces(matchResult.pieces);

    if (currentPieces.length > 0) {
      const afterGravity = applyGravity(currentPieces, direction);
      currentPieces = afterGravity.pieces;
    }
  }

  // Victory = no mobile pieces remain (walls don't count)
  const mobilePieces = getMobilePieces(currentPieces);
  const phase: GamePhase = mobilePieces.length === 0 ? "won" : "idle";

  return {
    pieces: currentPieces,
    score,
    comboEvents,
    totalCleared,
    phase,
  };
}

/**
 * Build animation steps for a move so the UI can animate them sequentially.
 */
export interface AnimationStep {
  type: "gravity" | "match" | "remove" | "cascade";
  pieces: Piece[];
  comboEvent?: ComboEvent;
}

export function buildAnimationSteps(
  pieces: Piece[],
  direction: Direction
): AnimationStep[] {
  const steps: AnimationStep[] = [];
  let currentPieces = pieces.map((p) => ({ ...p }));
  let comboChain = 0;

  const gravityResult = applyGravity(currentPieces, direction);
  currentPieces = gravityResult.pieces;
  steps.push({ type: "gravity", pieces: currentPieces.map((p) => ({ ...p })) });

  let hasMatches = true;
  while (hasMatches) {
    const matchResult = applyMatches(currentPieces);

    if (matchResult.matchGroups.length === 0) {
      hasMatches = false;
      break;
    }

    comboChain++;
    const points = calculatePoints(matchResult.matchGroups, comboChain);
    const positions = matchResult.matchGroups.flatMap((g) => g.positions);
    const comboEvent: ComboEvent = { chain: comboChain, points, positions };

    steps.push({
      type: "match",
      pieces: matchResult.pieces.map((p) => ({ ...p })),
      comboEvent,
    });

    currentPieces = removeMatchedPieces(matchResult.pieces);
    steps.push({ type: "remove", pieces: currentPieces.map((p) => ({ ...p })) });

    if (currentPieces.length > 0) {
      const afterGravity = applyGravity(currentPieces, direction);
      currentPieces = afterGravity.pieces;
      steps.push({
        type: "cascade",
        pieces: currentPieces.map((p) => ({ ...p })),
      });
    }
  }

  return steps;
}

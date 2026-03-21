import { create } from "zustand";
import {
  GameState,
  Direction,
  LevelData,
  GamePhase,
  Piece,
  ComboEvent,
  WinBreakdown,
  countsForCompletion,
  isDynamicType,
} from "@/lib/game/types";
import { createPiecesFromGrid, buildAnimationSteps, AnimationStep } from "@/lib/game/engine";

interface GameActions {
  loadLevel: (level: LevelData, options?: { preserveRun?: boolean }) => void;
  move: (direction: Direction) => void;
  retry: () => void;
  reset: () => void;
  tickDynamicBlocks: () => void;
  applyWinBonus: () => void;
}

type GameStore = GameState & GameActions;

const INITIAL_LIVES = 3;

const initialState: GameState = {
  level: null,
  pieces: [],
  phase: "idle",
  score: 0,
  levelsCompletedInRun: 0,
  livesLeft: INITIAL_LIVES,
  movesLeft: 0,
  currentDirection: null,
  comboChain: 0,
  comboEvents: [],
  totalPiecesCleared: 0,
  winBreakdown: null,
};

export const useGameStore = create<GameStore>((set, get) => ({
  ...initialState,

  loadLevel: (level: LevelData, options) => {
    const pieces = createPiecesFromGrid(level.grid);
    const previousState = get();
    const preserveRun = options?.preserveRun && previousState.level !== null;

    set({
      level,
      pieces,
      phase: "idle",
      score: preserveRun ? previousState.score : 0,
      levelsCompletedInRun: preserveRun ? previousState.levelsCompletedInRun : 0,
      livesLeft: preserveRun ? previousState.livesLeft : INITIAL_LIVES,
      movesLeft: level.maxMoves,
      currentDirection: null,
      comboChain: 0,
      comboEvents: [],
      totalPiecesCleared: 0,
      winBreakdown: null,
    });
  },

  move: (direction: Direction) => {
    const state = get();
    if (state.phase !== "idle" || state.movesLeft <= 0) return;

    set({ phase: "moving", currentDirection: direction });

    const steps = buildAnimationSteps(state.pieces, direction);

    animateSteps(steps, state.pieces, direction, set, get);
  },

  retry: () => {
    const state = get();
    if (!state.level) return;

    const pieces = createPiecesFromGrid(state.level.grid);
    const restartingRun = state.phase === "lost" && state.livesLeft <= 0;

    set({
      pieces,
      phase: "idle",
      score: restartingRun ? 0 : state.score,
      levelsCompletedInRun: restartingRun ? 0 : state.levelsCompletedInRun,
      livesLeft: restartingRun ? INITIAL_LIVES : state.livesLeft,
      movesLeft: state.level.maxMoves,
      currentDirection: null,
      comboChain: 0,
      comboEvents: [],
      totalPiecesCleared: 0,
      winBreakdown: null,
    });
  },

  reset: () => {
    set(initialState);
  },

  applyWinBonus: () => {
    const state = get();
    const winBreakdown = state.winBreakdown;
    if (!winBreakdown || winBreakdown.applied) return;

    set({
      score: state.score + winBreakdown.totalBonus,
      levelsCompletedInRun: state.levelsCompletedInRun + 1,
      winBreakdown: {
        ...winBreakdown,
        applied: true,
      },
    });
  },

  tickDynamicBlocks: () => {
    const state = get();
    if (!state.level || state.phase !== "idle") return;

    const occupied = new Set(state.pieces.map((piece) => `${piece.row},${piece.col}`));
    let changed = false;

    const nextPieces = state.pieces.map((piece) => {
      if (!isDynamicType(piece.type) || !piece.autoAxis || !piece.autoStep) {
        return piece;
      }

      const nextRow = piece.row + (piece.autoAxis === "vertical" ? piece.autoStep : 0);
      const nextCol = piece.col + (piece.autoAxis === "horizontal" ? piece.autoStep : 0);
      const inBounds =
        nextRow >= 0 &&
        nextRow < state.level!.grid.length &&
        nextCol >= 0 &&
        nextCol < state.level!.grid[0].length;

      const targetKey = `${nextRow},${nextCol}`;
      const blocked =
        !inBounds ||
        occupied.has(targetKey);

      if (blocked) {
        changed = true;
        return { ...piece, autoStep: (piece.autoStep * -1) as -1 | 1 };
      }

      occupied.delete(`${piece.row},${piece.col}`);
      occupied.add(targetKey);
      changed = true;
      return { ...piece, row: nextRow, col: nextCol };
    });

    if (changed) {
      set({ pieces: nextPieces });
    }
  },
}));

async function animateSteps(
  steps: AnimationStep[],
  originalPieces: Piece[],
  direction: Direction,
  set: (partial: Partial<GameStore>) => void,
  get: () => GameStore
) {
  const GRAVITY_DELAY = 300;
  const MATCH_DELAY = 400;
  const REMOVE_DELAY = 200;

  let score = get().score;
  let totalCleared = get().totalPiecesCleared;
  const comboEvents: ComboEvent[] = [];

  for (const step of steps) {
    switch (step.type) {
      case "gravity":
      case "cascade":
        set({ pieces: step.pieces, phase: "moving" });
        await delay(GRAVITY_DELAY);
        break;

      case "match":
        if (step.comboEvent) {
          score += step.comboEvent.points;
          totalCleared += step.comboEvent.positions.length;
          comboEvents.push(step.comboEvent);
        }
        set({
          pieces: step.pieces,
          phase: "matching",
          score,
          comboChain: step.comboEvent?.chain ?? 0,
          comboEvents: [...comboEvents],
          totalPiecesCleared: totalCleared,
        });
        await delay(MATCH_DELAY);
        break;

      case "remove":
        set({ pieces: step.pieces });
        await delay(REMOVE_DELAY);
        break;
    }
  }

  const finalPieces = steps.length > 0
    ? steps[steps.length - 1].pieces.filter((p) => !p.matched)
    : get().pieces;

  const piecesAfterInput = steps.length > 0 ? steps[0].pieces : originalPieces;
  const consumedMove = didPiecesMove(originalPieces, piecesAfterInput);
  const movesLeft = Math.max(get().movesLeft - (consumedMove ? 1 : 0), 0);
  // Victory only when no mobile (non-wall) pieces remain
  const won = finalPieces.filter((p) => countsForCompletion(p.type)).length === 0;
  const impossibleBoard = hasUnmatchedSingleton(finalPieces);
  const lost = !won && (impossibleBoard || movesLeft <= 0);
  const livesLeft = lost ? Math.max(get().livesLeft - 1, 0) : get().livesLeft;
  const winBreakdown: WinBreakdown | null = won
    ? {
        levelId: get().level?.id ?? "unknown",
        baseScore: score,
        clearBonus: 1000,
        movesBonus: movesLeft * 500,
        livesBonus: livesLeft * 500,
        totalBonus: 1000 + movesLeft * 500 + livesLeft * 500,
        applied: false,
      }
    : null;

  set({
    pieces: finalPieces,
    score,
    livesLeft,
    movesLeft,
    phase: won ? "won" : lost ? "lost" : "idle",
    comboEvents,
    currentDirection: null,
    winBreakdown,
  });
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function didPiecesMove(previousPieces: Piece[], nextPieces: Piece[]) {
  const previousById = new Map(
    previousPieces.map((piece) => [piece.id, `${piece.row},${piece.col}`])
  );

  for (const piece of nextPieces) {
    const previousPosition = previousById.get(piece.id);
    if (previousPosition && previousPosition !== `${piece.row},${piece.col}`) {
      return true;
    }
  }

  return false;
}

function hasUnmatchedSingleton(pieces: Piece[]) {
  const countsByType = new Map<number, number>();

  for (const piece of pieces) {
    if (!countsForCompletion(piece.type)) continue;
    countsByType.set(piece.type, (countsByType.get(piece.type) ?? 0) + 1);
  }

  return Array.from(countsByType.values()).some((count) => count === 1);
}

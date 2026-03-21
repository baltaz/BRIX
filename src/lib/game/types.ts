export type Direction = "up" | "down" | "left" | "right";
export type DynamicAxis = "horizontal" | "vertical";

export type PieceType = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

/** Wall tile — impassable, never moves, never matches */
export const WALL_TYPE = 9 as const;
export const MOBILE_WALL_TYPE = 10 as const;
export const DYNAMIC_HORIZONTAL_TYPE = 11 as const;
export const DYNAMIC_VERTICAL_TYPE = 12 as const;

export type AnyPieceType =
  | PieceType
  | typeof WALL_TYPE
  | typeof MOBILE_WALL_TYPE
  | typeof DYNAMIC_HORIZONTAL_TYPE
  | typeof DYNAMIC_VERTICAL_TYPE;

export interface Piece {
  id: string;
  type: AnyPieceType;
  row: number;
  col: number;
  matched: boolean;
  autoAxis?: DynamicAxis;
  autoStep?: -1 | 1;
}

/** 0 = empty, 1-8 = matchable colors, 9 = wall, 10 = mobile wall, 11-12 = dynamic walls */
export type CellValue = 0 | AnyPieceType;

/** 13 rows x 10 columns */
export type GridTemplate = CellValue[][];

export const GRID_ROWS = 13;
export const GRID_COLS = 10;

export const PIECE_COLORS: Record<PieceType, string> = {
  1: "var(--color-piece-1)",
  2: "var(--color-piece-2)",
  3: "var(--color-piece-3)",
  4: "var(--color-piece-4)",
  5: "var(--color-piece-5)",
  6: "var(--color-piece-6)",
  7: "var(--color-piece-7)",
  8: "var(--color-piece-8)",
};

export const PIECE_LABELS: Record<PieceType, string> = {
  1: "Rojo",
  2: "Azul",
  3: "Verde",
  4: "Amarillo",
  5: "Morado",
  6: "Naranja",
  7: "Cyan",
  8: "Rosa",
};

export interface LevelData {
  id: string;
  order: number;
  maxMoves: number;
  grid: GridTemplate;
  isPublished?: boolean;
}

export type GamePhase =
  | "idle"
  | "moving"
  | "matching"
  | "combo"
  | "won"
  | "lost";

export interface ComboEvent {
  chain: number;
  points: number;
  positions: { row: number; col: number }[];
}

export interface WinBreakdown {
  levelId: string;
  baseScore: number;
  clearBonus: number;
  movesBonus: number;
  livesBonus: number;
  totalBonus: number;
  applied: boolean;
}

export interface GameState {
  level: LevelData | null;
  pieces: Piece[];
  phase: GamePhase;
  score: number;
  levelsCompletedInRun: number;
  livesLeft: number;
  movesLeft: number;
  currentDirection: Direction | null;
  comboChain: number;
  comboEvents: ComboEvent[];
  totalPiecesCleared: number;
  winBreakdown: WinBreakdown | null;
}

export function isMatchableType(type: number): type is PieceType {
  return type >= 1 && type <= 8;
}

export function isStaticWallType(type: AnyPieceType) {
  return type === WALL_TYPE;
}

export function isMobileWallType(type: AnyPieceType) {
  return type === MOBILE_WALL_TYPE;
}

export function isDynamicType(type: AnyPieceType) {
  return type === DYNAMIC_HORIZONTAL_TYPE || type === DYNAMIC_VERTICAL_TYPE;
}

export function countsForCompletion(type: AnyPieceType) {
  return isMatchableType(type);
}

export function blocksGravity(type: AnyPieceType) {
  return isStaticWallType(type) || isDynamicType(type);
}

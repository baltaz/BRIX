import { PieceType } from "./types";

export interface PieceStyle {
  /** Color de fondo del bloque */
  background: string;
  /** Color del número / texto */
  color: string;
  /** Color puro de la sombra (sin offsets) — útil para indicadores pequeños */
  shadowColor: string;
  /** Sombra inferior completa (efecto 3D) */
  shadow: string;
}

/**
 * Estilos visuales por tipo de pieza.
 * Cada tipo puede tener fondo y texto propios (no todos usan el esquema crema).
 */
export const PIECE_STYLE: Record<PieceType, PieceStyle> = {
  1: {
    background: "rgb(174, 222, 135)",
    color: "white",
    shadowColor: "rgb(160, 187, 136)",
    shadow: "0px 5px 0px rgb(160, 187, 136)",
  },
  2: {
    background: "#21debe",
    color: "white",
    shadowColor: "#00b4b2",
    shadow: "0px 5px 0px #00b4b2",
  },
  3: {
    background: "#fef8f8",
    color: "#c09090",
    shadowColor: "#e0bfbf",
    shadow: "0px 5px 0px #e0bfbf",
  },
  4: {
    background: "#6580d9",
    color: "white",
    shadowColor: "#4560b8",
    shadow: "0px 5px 0px #4560b8",
  },
  5: {
    background: "#e6a5e6",
    color: "white",
    shadowColor: "#cd8ccd",
    shadow: "0px 5px 0px #cd8ccd",
  },
  6: {
    background: "#fef8f8",
    color: "#c09090",
    shadowColor: "#e0bfbf",
    shadow: "0px 5px 0px #e0bfbf",
  },
  7: {
    background: "#fef8f8",
    color: "#c09090",
    shadowColor: "#e0bfbf",
    shadow: "0px 5px 0px #e0bfbf",
  },
  8: {
    background: "#f3c381",
    color: "white",
    shadowColor: "#dea083",
    shadow: "0px 5px 0px #dea083",
  },
};

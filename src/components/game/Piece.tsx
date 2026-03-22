import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Piece as PieceData,
  PieceType,
  WALL_TYPE,
  MOBILE_WALL_TYPE,
  isDynamicType,
} from "@/lib/game/types";
import { useGameStore } from "@/lib/store/gameStore";
import { PIECE_STYLE } from "@/lib/game/pieceStyles";

interface PieceProps {
  piece: PieceData;
  cellSize: number;
}

/**
 * Per-type Framer Motion spring config — subtle differences create
 * the illusion of different weights. Purely visual, no gameplay impact.
 */
const SPRING_BY_TYPE: Record<number, { stiffness: number; damping: number; mass: number }> = {
  1: { stiffness: 420, damping: 24, mass: 0.55 }, // muy rápido
  2: { stiffness: 280, damping: 32, mass: 1.10 }, // lento / pesado
  3: { stiffness: 460, damping: 22, mass: 0.50 }, // rapidísimo
  4: { stiffness: 250, damping: 34, mass: 1.20 }, // el más lento
  5: { stiffness: 380, damping: 26, mass: 0.70 }, // medio-rápido
  6: { stiffness: 340, damping: 28, mass: 0.85 }, // medio
  7: { stiffness: 430, damping: 23, mass: 0.58 }, // rápido
  8: { stiffness: 300, damping: 30, mass: 1.00 }, // medio-lento
};

const DEFAULT_SPRING = { stiffness: 350, damping: 28, mass: 0.8 };

/**
 * Static wall tile con fusión visual y esquinas internas cóncavas redondeadas.
 *
 * Técnica:
 * - Cada tile calcula su rectángulo extendido hacia sus vecinos de pared
 * - La sombra inferior se omite cuando hay vecino abajo (evita bandas oscuras)
 * - Las esquinas INTERNAS (donde el muro dobla hacia dentro) se recortan con
 *   `clip-path: path()` usando arcos SVG para crear la curva cóncava real
 */
function WallTile({ piece, cellSize, gap }: { piece: PieceData; cellSize: number; gap: number }) {
  const pieces = useGameStore((s) => s.pieces);

  const wallSet = useMemo(() => {
    const set = new Set<string>();
    for (const p of pieces) {
      if (p.type === WALL_TYPE) set.add(`${p.row},${p.col}`);
    }
    return set;
  }, [pieces]);

  const hasTop    = wallSet.has(`${piece.row - 1},${piece.col}`);
  const hasBottom = wallSet.has(`${piece.row + 1},${piece.col}`);
  const hasLeft   = wallSet.has(`${piece.row},${piece.col - 1}`);
  const hasRight  = wallSet.has(`${piece.row},${piece.col + 1}`);

  // Diagonales — necesarias para detectar esquinas internas
  const hasDiagTL = wallSet.has(`${piece.row - 1},${piece.col - 1}`);
  const hasDiagTR = wallSet.has(`${piece.row - 1},${piece.col + 1}`);
  const hasDiagBR = wallSet.has(`${piece.row + 1},${piece.col + 1}`);
  const hasDiagBL = wallSet.has(`${piece.row + 1},${piece.col - 1}`);

  // Esquina interna: dos vecinos ortogonales presentes pero sin diagonal
  const innerTL = hasTop && hasLeft  && !hasDiagTL;
  const innerTR = hasTop && hasRight && !hasDiagTR;
  const innerBR = hasBottom && hasRight && !hasDiagBR;
  const innerBL = hasBottom && hasLeft  && !hasDiagBL;

  const inset = 3;
  const br    = 8; // border-radius en esquinas exteriores

  const cellX = piece.col * (cellSize + gap);
  const cellY = piece.row * (cellSize + gap);

  const x1 = hasLeft   ? cellX - gap            : cellX + inset;
  const y1 = hasTop    ? cellY - gap            : cellY + inset;
  const x2 = hasRight  ? cellX + cellSize + gap : cellX + cellSize - inset;
  const y2 = hasBottom ? cellY + cellSize + gap : cellY + cellSize - inset;

  const W = x2 - x1;
  const H = y2 - y1;

  const tlR = hasTop || hasLeft   ? 0 : br;
  const trR = hasTop || hasRight  ? 0 : br;
  const brR = hasBottom || hasRight ? 0 : br;
  const blR = hasBottom || hasLeft  ? 0 : br;

  // Radio del arco cóncavo en esquinas internas: tamaño de la protuberancia
  const n = inset + gap; // 3 + 2 = 5px

  // Construye un clip-path: path() con arcos SVG cóncavos en cada esquina interna.
  // Arco: A n,n 0 0 0 (sweep=0=CCW en SVG coords Y-down) → curva hacia el interior.
  const clipPath = (innerTL || innerTR || innerBR || innerBL)
    ? buildConcaveClipPath(W, H, n, innerTL, innerTR, innerBR, innerBL)
    : undefined;

  return (
    <div
      className="absolute"
      style={{
        left:   x1,
        top:    y1,
        width:  W,
        height: H,
        background: "#ddd4cf",
        borderRadius: `${tlR}px ${trR}px ${brR}px ${blR}px`,
        boxShadow: hasBottom ? "none" : "0px 5px 0px rgba(90,55,45,0.55)",
        clipPath,
      }}
    />
  );
}

/**
 * Genera un `clip-path: path()` con arcos SVG cóncavos (sweep=0) en cada
 * esquina interna indicada. El resultado es una forma con "mordidas" redondeadas
 * en las esquinas que conectan dos tramos de pared sin diagonal.
 *
 * Geometría: para la esquina BR, el arco va de (W, H-n) a (W-n, H) con radio n
 * y sweep=0 (CCW en SVG/Y-down), lo que produce una curva que se mete hacia
 * el interior del tile — efecto cóncavo real.
 */
function buildConcaveClipPath(
  W: number, H: number, n: number,
  tl: boolean, tr: boolean, br: boolean, bl: boolean,
): string {
  const a = `A ${n},${n} 0 0 0`; // arco cóncavo reutilizable
  const parts: string[] = [];

  // Punto de inicio (esquina superior-izquierda)
  parts.push(tl ? `M 0,${n}` : `M 0,0`);
  if (tl) parts.push(`${a} ${n},0`);

  // Borde superior → esquina superior-derecha
  if (tr) {
    parts.push(`L ${W - n},0`);
    parts.push(`${a} ${W},${n}`);
  } else {
    parts.push(`L ${W},0`);
  }

  // Borde derecho → esquina inferior-derecha
  if (br) {
    parts.push(`L ${W},${H - n}`);
    parts.push(`${a} ${W - n},${H}`);
  } else {
    parts.push(`L ${W},${H}`);
  }

  // Borde inferior → esquina inferior-izquierda
  if (bl) {
    parts.push(`L ${n},${H}`);
    parts.push(`${a} 0,${H - n}`);
  } else {
    parts.push(`L 0,${H}`);
  }

  // Borde izquierdo de vuelta al inicio
  parts.push("Z");

  return `path('${parts.join(" ")}')`;
}

/** Animated mobile wall tile — crema más oscura + sombra 3D, se mueve con gravedad */
function MobileWallTile({
  piece,
  cellSize,
  gap,
}: {
  piece: PieceData;
  cellSize: number;
  gap: number;
}) {
  const inset = 2;
  const innerSize = cellSize - inset * 2;
  return (
    <motion.div
      layout
      initial={false}
      animate={{
        x: piece.col * (cellSize + gap),
        y: piece.row * (cellSize + gap),
      }}
      transition={{ type: "spring", ...DEFAULT_SPRING }}
      className="absolute"
      style={{ width: cellSize, height: cellSize, padding: inset }}
    >
      <div
        style={{
          width: innerSize,
          height: innerSize,
          background: "#c8bdb8",
          borderRadius: 8,
          boxShadow: "0px 5px 0px rgba(70,40,30,0.55)",
        }}
      />
    </motion.div>
  );
}

/** Dynamic block tile — amber/orange gradient, visually distinct */
function DynamicBlockTile({
  piece,
  cellSize,
  gap,
}: {
  piece: PieceData;
  cellSize: number;
  gap: number;
}) {
  const isHorizontal = piece.autoAxis === "horizontal";

  return (
    <motion.div
      layout
      initial={false}
      animate={{
        x: piece.col * (cellSize + gap),
        y: piece.row * (cellSize + gap),
      }}
      transition={{ type: "spring", stiffness: 260, damping: 24, mass: 0.9 }}
      className="absolute"
      style={{
        width: cellSize,
        height: cellSize,
        borderRadius: 6,
        background:
          "linear-gradient(135deg, #92400e 0%, #d97706 45%, #fde68a 100%)",
        border: "1px solid rgba(180, 100, 0, 0.8)",
        boxShadow:
          "inset 0 1px 0 rgba(255,255,255,0.28), inset 0 -1px 0 rgba(0,0,0,0.30), 0 0 16px rgba(217,119,6,0.35)",
      }}
    >
      <div className="absolute inset-[5px] rounded-sm bg-black/10" />
      <div
        className="absolute left-1/2 top-1/2 bg-white/70 rounded-full"
        style={{
          width: isHorizontal ? cellSize * 0.55 : 4,
          height: isHorizontal ? 4 : cellSize * 0.55,
          transform: "translate(-50%, -50%)",
        }}
      />
      <div
        className="absolute text-[10px] font-black text-white/80"
        style={{
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)",
        }}
      >
        {isHorizontal ? "H" : "V"}
      </div>
    </motion.div>
  );
}

export function Piece({ piece, cellSize }: PieceProps) {
  const gap = 2;

  if (piece.type === WALL_TYPE) {
    return <WallTile piece={piece} cellSize={cellSize} gap={gap} />;
  }

  if (piece.type === MOBILE_WALL_TYPE) {
    return <MobileWallTile piece={piece} cellSize={cellSize} gap={gap} />;
  }

  if (isDynamicType(piece.type)) {
    return <DynamicBlockTile piece={piece} cellSize={cellSize} gap={gap} />;
  }

  const type = piece.type as PieceType;
  const style = PIECE_STYLE[type];
  const spring = SPRING_BY_TYPE[type] ?? DEFAULT_SPRING;
  const inset = 2;
  const innerSize = cellSize - inset * 2;

  return (
    <AnimatePresence>
      {!piece.matched ? (
        <motion.div
          key={piece.id}
          layout
          initial={false}
          animate={{
            x: piece.col * (cellSize + gap),
            y: piece.row * (cellSize + gap),
            scale: 1,
            opacity: 1,
          }}
          exit={{
            scale: [1.25, 0],
            opacity: [1, 0],
            transition: { duration: 0.32, ease: "easeIn" },
          }}
          transition={{ type: "spring", ...spring }}
          className="absolute"
          style={{ width: cellSize, height: cellSize, padding: inset }}
        >
          <div
            style={{
              width: innerSize,
              height: innerSize,
              background: style.background,
              borderRadius: 8,
              boxShadow: style.shadow,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span
              style={{
                fontFamily: "Nunito, sans-serif",
                fontWeight: 800,
                fontSize: cellSize * 0.42,
                color: style.color,
                lineHeight: 1,
                userSelect: "none",
              }}
            >
              {type}
            </span>
          </div>
        </motion.div>
      ) : (
        <motion.div
          key={`${piece.id}-match`}
          initial={{
            x: piece.col * (cellSize + gap),
            y: piece.row * (cellSize + gap),
            scale: 1,
            opacity: 1,
          }}
          animate={{
            scale: [1, 1.35, 0],
            opacity: [1, 0.9, 0],
          }}
          transition={{ duration: 0.38, ease: "easeOut" }}
          className="absolute pointer-events-none"
          style={{ width: cellSize, height: cellSize }}
        >
          <div
            style={{
              width: "100%",
              height: "100%",
              borderRadius: 8,
              background: style.background,
              boxShadow: `0 0 18px ${style.color}, 0 0 36px ${style.color}88`,
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

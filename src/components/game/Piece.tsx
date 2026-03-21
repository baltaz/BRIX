import { motion, AnimatePresence } from "framer-motion";
import {
  Piece as PieceData,
  PIECE_COLORS,
  PieceType,
  WALL_TYPE,
  MOBILE_WALL_TYPE,
  isDynamicType,
} from "@/lib/game/types";

interface PieceProps {
  piece: PieceData;
  cellSize: number;
}

type MonsterFaceConfig = {
  eyeY: string;
  eyeSize: string;
  eyeGap: string;
  eyeTilt?: number;
  mouthWidth: string;
  mouthHeight: string;
  mouthRadius: string;
  mouthTop: string;
  mouthColor: string;
  toothCount: number;
  toothColor: string;
  cheekColor?: string;
  hornColor?: string;
  brow?: boolean;
};

const MONSTER_FACES: Record<PieceType, MonsterFaceConfig> = {
  1: {
    eyeY: "33%",
    eyeSize: "11%",
    eyeGap: "16%",
    mouthWidth: "38%",
    mouthHeight: "18%",
    mouthRadius: "999px",
    mouthTop: "63%",
    mouthColor: "#4a0404",
    toothCount: 4,
    toothColor: "#fee2e2",
    hornColor: "#7f1d1d",
    brow: true,
  },
  2: {
    eyeY: "40%",
    eyeSize: "10%",
    eyeGap: "18%",
    mouthWidth: "24%",
    mouthHeight: "18%",
    mouthRadius: "50%",
    mouthTop: "61%",
    mouthColor: "#082f49",
    toothCount: 1,
    toothColor: "#dbeafe",
    cheekColor: "#93c5fd",
  },
  3: {
    eyeY: "29%",
    eyeSize: "30%",
    eyeGap: "0%",
    mouthWidth: "34%",
    mouthHeight: "15%",
    mouthRadius: "999px",
    mouthTop: "66%",
    mouthColor: "#14532d",
    toothCount: 2,
    toothColor: "#fef9c3",
    hornColor: "#14532d",
  },
  4: {
    eyeY: "42%",
    eyeSize: "10%",
    eyeGap: "20%",
    mouthWidth: "34%",
    mouthHeight: "16%",
    mouthRadius: "999px",
    mouthTop: "60%",
    mouthColor: "#78350f",
    toothCount: 5,
    toothColor: "#fff7ed",
    brow: true,
  },
  5: {
    eyeY: "38%",
    eyeSize: "17%",
    eyeGap: "18%",
    eyeTilt: -6,
    mouthWidth: "42%",
    mouthHeight: "14%",
    mouthRadius: "999px",
    mouthTop: "63%",
    mouthColor: "#3b0764",
    toothCount: 2,
    toothColor: "#ede9fe",
    hornColor: "#581c87",
  },
  6: {
    eyeY: "36%",
    eyeSize: "11%",
    eyeGap: "18%",
    mouthWidth: "40%",
    mouthHeight: "16%",
    mouthRadius: "999px",
    mouthTop: "61%",
    mouthColor: "#7c2d12",
    toothCount: 4,
    toothColor: "#fff7ed",
    hornColor: "#9a3412",
  },
  7: {
    eyeY: "42%",
    eyeSize: "12%",
    eyeGap: "16%",
    mouthWidth: "16%",
    mouthHeight: "18%",
    mouthRadius: "999px",
    mouthTop: "58%",
    mouthColor: "#164e63",
    toothCount: 1,
    toothColor: "#ecfeff",
    cheekColor: "#f9a8d4",
  },
  8: {
    eyeY: "35%",
    eyeSize: "12%",
    eyeGap: "18%",
    mouthWidth: "18%",
    mouthHeight: "8%",
    mouthRadius: "999px",
    mouthTop: "60%",
    mouthColor: "#9f1239",
    toothCount: 0,
    toothColor: "#ffe4e6",
    cheekColor: "#fde68a",
  },
};

/** Static wall tile — matches the diagonal-stripe style of the original Puzznic */
function WallTile({ piece, cellSize, gap }: { piece: PieceData; cellSize: number; gap: number }) {
  return (
    <div
      className="absolute"
      style={{
        width: cellSize,
        height: cellSize,
        left: piece.col * (cellSize + gap),
        top: piece.row * (cellSize + gap),
        // Diagonal stripe pattern resembling the original NES wall tiles
        background:
          "repeating-linear-gradient(45deg, #71717a 0px, #71717a 3px, #a1a1aa 3px, #a1a1aa 9px)",
        boxShadow:
          "inset 0 1px 0 rgba(255,255,255,0.25), inset 0 -1px 0 rgba(0,0,0,0.35)",
        border: "1px solid #52525b",
        borderRadius: 3,
      }}
    >
      {/* Top-left corner highlight for 3D look */}
      <div
        className="absolute inset-0 rounded-sm"
        style={{
          background:
            "linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 50%)",
        }}
      />
    </div>
  );
}

function MobileWallTile({
  piece,
  cellSize,
  gap,
}: {
  piece: PieceData;
  cellSize: number;
  gap: number;
}) {
  return (
    <motion.div
      layout
      initial={false}
      animate={{
        x: piece.col * (cellSize + gap),
        y: piece.row * (cellSize + gap),
      }}
      transition={{ type: "spring", stiffness: 350, damping: 28, mass: 0.8 }}
      className="absolute"
      style={{
        width: cellSize,
        height: cellSize,
        borderRadius: 4,
        background:
          "repeating-linear-gradient(45deg, #3f3f46 0px, #3f3f46 3px, #52525b 3px, #52525b 9px)",
        border: "1px solid #27272a",
        boxShadow:
          "inset 0 1px 0 rgba(255,255,255,0.12), inset 0 -1px 0 rgba(0,0,0,0.45), 0 4px 10px rgba(0,0,0,0.35)",
      }}
    >
      <div
        className="absolute inset-[5px] rounded-sm border border-white/10"
        style={{
          background:
            "linear-gradient(135deg, rgba(255,255,255,0.05), rgba(0,0,0,0.14))",
        }}
      />
    </motion.div>
  );
}

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
        borderRadius: 5,
        background:
          "linear-gradient(135deg, #0f766e 0%, #14b8a6 45%, #67e8f9 100%)",
        border: "1px solid rgba(8,145,178,0.9)",
        boxShadow:
          "inset 0 1px 0 rgba(255,255,255,0.28), inset 0 -1px 0 rgba(0,0,0,0.35), 0 0 18px rgba(45,212,191,0.28)",
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

  // Wall tiles render statically — no animation, no matching
  if (piece.type === WALL_TYPE) {
    return <WallTile piece={piece} cellSize={cellSize} gap={gap} />;
  }

  if (piece.type === MOBILE_WALL_TYPE) {
    return <MobileWallTile piece={piece} cellSize={cellSize} gap={gap} />;
  }

  if (isDynamicType(piece.type)) {
    return <DynamicBlockTile piece={piece} cellSize={cellSize} gap={gap} />;
  }

  const color = PIECE_COLORS[piece.type as PieceType];
  const inset = 2;
  const innerSize = cellSize - inset * 2;
  const face = MONSTER_FACES[piece.type as PieceType];

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
            scale: [1.2, 0],
            opacity: [1, 0],
            transition: { duration: 0.35, ease: "easeIn" },
          }}
          transition={{
            type: "spring",
            stiffness: 350,
            damping: 28,
            mass: 0.8,
          }}
          className="absolute"
          style={{
            width: cellSize,
            height: cellSize,
            padding: inset,
          }}
        >
          {/* Outer glow */}
          <div
            className="absolute inset-0 rounded-lg opacity-40 blur-sm"
            style={{ backgroundColor: color }}
          />

          {/* Main piece body */}
          <div
            className="relative w-full h-full rounded-lg overflow-hidden"
            style={{
              width: innerSize,
              height: innerSize,
              backgroundColor: color,
              boxShadow: `0 2px 10px ${color}66, inset 0 1px 0 rgba(255,255,255,0.35), inset 0 -2px 4px rgba(0,0,0,0.25)`,
            }}
          >
            <div
              className="absolute inset-x-0 top-0 h-[40%] rounded-t-lg"
              style={{
                background:
                  "linear-gradient(to bottom, rgba(255,255,255,0.35), transparent)",
              }}
            />
            <div
              className="absolute inset-[7%] rounded-[18px]"
              style={{
                background:
                  "radial-gradient(circle at 30% 25%, rgba(255,255,255,0.22), transparent 32%), linear-gradient(180deg, rgba(255,255,255,0.05), rgba(0,0,0,0.12))",
              }}
            />
            <div
              className="absolute inset-x-0 bottom-0 h-[30%]"
              style={{
                background:
                  "linear-gradient(to top, rgba(0,0,0,0.3), transparent)",
              }}
            />
            <MonsterFace face={face} />
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
            scale: [1, 1.4, 0],
            opacity: [1, 0.8, 0],
          }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="absolute pointer-events-none"
          style={{
            width: cellSize,
            height: cellSize,
          }}
        >
          <div
            className="w-full h-full rounded-lg"
            style={{
              backgroundColor: color,
              boxShadow: `0 0 20px ${color}, 0 0 40px ${color}88`,
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function MonsterFace({ face }: { face: MonsterFaceConfig }) {
  return (
    <>
      {face.hornColor && (
        <>
          <div
            className="absolute rounded-full"
            style={{
              width: "18%",
              height: "18%",
              left: "18%",
              top: "8%",
              background: face.hornColor,
              clipPath: "polygon(50% 0%, 100% 100%, 0% 100%)",
              transform: "rotate(-18deg)",
              opacity: 0.9,
            }}
          />
          <div
            className="absolute rounded-full"
            style={{
              width: "18%",
              height: "18%",
              right: "18%",
              top: "8%",
              background: face.hornColor,
              clipPath: "polygon(50% 0%, 100% 100%, 0% 100%)",
              transform: "rotate(18deg)",
              opacity: 0.9,
            }}
          />
        </>
      )}

      <div
        className="absolute rounded-full bg-black/80"
        style={{
          width: face.eyeSize,
          height: face.eyeSize,
          left: `calc(50% - ${face.eyeGap})`,
          top: face.eyeY,
          transform: `translateX(-50%) rotate(${face.eyeTilt ?? 0}deg)`,
        }}
      />
      <div
        className="absolute rounded-full bg-black/80"
        style={{
          width: face.eyeSize,
          height: face.eyeSize,
          left: `calc(50% + ${face.eyeGap})`,
          top: face.eyeY,
          transform: `translateX(-50%) rotate(${(face.eyeTilt ?? 0) * -1}deg)`,
        }}
      />

      {face.brow && (
        <>
          <div
            className="absolute bg-black/35 rounded-full"
            style={{
              width: "18%",
              height: "4%",
              left: "22%",
              top: "28%",
              transform: "rotate(-14deg)",
            }}
          />
          <div
            className="absolute bg-black/35 rounded-full"
            style={{
              width: "18%",
              height: "4%",
              right: "22%",
              top: "28%",
              transform: "rotate(14deg)",
            }}
          />
        </>
      )}

      {face.cheekColor && (
        <>
          <div
            className="absolute rounded-full"
            style={{
              width: "16%",
              height: "10%",
              left: "18%",
              top: "54%",
              background: face.cheekColor,
              opacity: 0.9,
            }}
          />
          <div
            className="absolute rounded-full"
            style={{
              width: "16%",
              height: "10%",
              right: "18%",
              top: "54%",
              background: face.cheekColor,
              opacity: 0.9,
            }}
          />
        </>
      )}

      <div
        className="absolute left-1/2 -translate-x-1/2 overflow-hidden"
        style={{
          width: face.mouthWidth,
          height: face.mouthHeight,
          top: face.mouthTop,
          borderRadius: face.mouthRadius,
          background: face.mouthColor,
          boxShadow: "inset 0 2px 0 rgba(255,255,255,0.08)",
        }}
      >
        {face.toothCount > 0 && (
          <div
            className="absolute inset-x-[10%] top-0 flex justify-between"
            style={{ height: "42%" }}
          >
            {Array.from({ length: face.toothCount }).map((_, index) => (
              <div
                key={index}
                style={{
                  width: `${Math.max(8, 55 / face.toothCount)}%`,
                  height: "100%",
                  background: face.toothColor,
                  clipPath: "polygon(50% 100%, 0 0, 100% 0)",
                }}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}

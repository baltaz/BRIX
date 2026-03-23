import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGameStore } from "@/lib/store/gameStore";
import { getNextLevel, loadPublicLevels } from "@/lib/game/catalog";
import { LevelData } from "@/lib/game/types";

export function LevelCompleteModal() {
  const phase = useGameStore((s) => s.phase);
  const score = useGameStore((s) => s.score);
  const level = useGameStore((s) => s.level);
  const movesLeft = useGameStore((s) => s.movesLeft);
  const livesLeft = useGameStore((s) => s.livesLeft);
  const winBreakdown = useGameStore((s) => s.winBreakdown);
  const applyWinBonus = useGameStore((s) => s.applyWinBonus);
  const [nextLevel, setNextLevel] = useState<LevelData | null>(null);
  const [isResolvingNextLevel, setIsResolvingNextLevel] = useState(false);
  const [clearDisplay, setClearDisplay] = useState(0);
  const [movesDisplay, setMovesDisplay] = useState(0);
  const [livesDisplay, setLivesDisplay] = useState(0);
  const [bonusTotalDisplay, setBonusTotalDisplay] = useState(0);
  const [activeRow, setActiveRow] = useState<BreakdownRowKey | null>(null);
  const [completedRows, setCompletedRows] = useState<BreakdownRowKey[]>([]);
  const animatedLevelRef = useRef<string | null>(null);
  const nextLevelRef = useRef<LevelData | null>(null);
  const nextLevelResolvedRef = useRef(false);

  const displayedScore = score + (winBreakdown?.applied ? 0 : bonusTotalDisplay);

  useEffect(() => {
    if (phase !== "won" || !level?.id) {
      setNextLevel(null);
      setIsResolvingNextLevel(false);
      setActiveRow(null);
      setCompletedRows([]);
      nextLevelRef.current = null;
      nextLevelResolvedRef.current = false;
      return;
    }

    let cancelled = false;
    setIsResolvingNextLevel(true);
    nextLevelResolvedRef.current = false;
    const currentLevel = level;

    async function resolveNextLevel() {
      const levels = await loadPublicLevels();
      if (!cancelled) {
        const resolvedNextLevel = resolveNextLevelFromCatalog(levels, currentLevel);
        nextLevelRef.current = resolvedNextLevel;
        nextLevelResolvedRef.current = true;
        setNextLevel(resolvedNextLevel);
        setIsResolvingNextLevel(false);
      }
    }

    void resolveNextLevel();
    return () => { cancelled = true; };
  }, [phase, level?.id]);

  useEffect(() => {
    if (phase !== "won" || !winBreakdown || !level?.id) {
      animatedLevelRef.current = null;
      setClearDisplay(0);
      setMovesDisplay(0);
      setLivesDisplay(0);
      setBonusTotalDisplay(0);
      setActiveRow(null);
      setCompletedRows([]);
      return;
    }

    if (animatedLevelRef.current === winBreakdown.levelId) return;

    animatedLevelRef.current = winBreakdown.levelId;
    let cancelled = false;
    const currentWinBreakdown = winBreakdown;

    async function runSequence() {
      setClearDisplay(0);
      setMovesDisplay(0);
      setLivesDisplay(0);
      setBonusTotalDisplay(0);
      setCompletedRows([]);

      await animateBreakdownStep("clear", currentWinBreakdown.clearBonus, 300, setClearDisplay, setActiveRow, setCompletedRows, () => cancelled);
      await animateBreakdownStep("moves", currentWinBreakdown.movesBonus, 300, setMovesDisplay, setActiveRow, setCompletedRows, () => cancelled);
      await animateBreakdownStep("lives", currentWinBreakdown.livesBonus, 300, setLivesDisplay, setActiveRow, setCompletedRows, () => cancelled);
      await animateBreakdownStep("total", currentWinBreakdown.totalBonus, 240, setBonusTotalDisplay, setActiveRow, setCompletedRows, () => cancelled);

      if (cancelled) return;
      applyWinBonus();
      setActiveRow(null);
    }

    void runSequence();
    return () => { cancelled = true; };
  }, [phase, winBreakdown, level?.id, applyWinBonus]);

  if (phase !== "won") return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 z-50 flex items-center justify-center"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="mx-4 w-full max-w-sm rounded-2xl p-6 text-center"
          style={{
            background: "#fef8f8",
            boxShadow: "0 8px 32px rgba(240,66,91,0.35), 0 0 0 1px rgba(255,255,255,0.6)",
          }}
        >
          <motion.div
            initial={{ rotate: -10 }}
            animate={{ rotate: [0, -5, 5, 0] }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mb-3 text-5xl"
            style={{ color: "#f3c381", textShadow: "0px 4px 0px #dea083" }}
          >
            ★
          </motion.div>
          <h2 className="mb-2 text-2xl font-black" style={{ color: "#f0425b" }}>Nivel Completado</h2>
          <p className="mb-1 text-3xl font-black" style={{ color: "#f0425b" }}>{displayedScore.toLocaleString()}</p>
          <p className="mb-4 text-sm" style={{ color: "#d26a61", opacity: 0.7 }}>Contabilizando bonus del nivel...</p>

          <div
            className="mb-4 space-y-2 rounded-xl p-4 text-left"
            style={{ background: "rgba(240,66,91,0.06)", border: "1px solid rgba(240,66,91,0.15)" }}
          >
            <BreakdownRow label="Clear" formula="1000 x 1" value={clearDisplay} isActive={activeRow === "clear"} isDone={completedRows.includes("clear")} />
            <BreakdownRow label="Moves" formula={`500 x ${movesLeft}`} value={movesDisplay} isActive={activeRow === "moves"} isDone={completedRows.includes("moves")} />
            <BreakdownRow label="Vidas" formula={`500 x ${livesLeft}`} value={livesDisplay} isActive={activeRow === "lives"} isDone={completedRows.includes("lives")} />
            <div className="h-px" style={{ background: "rgba(240,66,91,0.15)" }} />
            <div className={`flex items-center justify-between text-base font-black transition-all duration-150`}
              style={{ color: activeRow === "total" ? "#f0425b" : "#c9960a", transform: activeRow === "total" ? "scale(1.03)" : undefined }}
            >
              <span>Total Bonus</span>
              <span>{bonusTotalDisplay.toLocaleString()}</span>
            </div>
          </div>

          <p className="text-xs" style={{ color: "#d26a61", opacity: 0.6 }}>
            {isResolvingNextLevel
              ? "Preparando siguiente stage..."
              : nextLevel
                ? "Siguiente stage en 1 segundo..."
                : "¡Run completada!"}
          </p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function BreakdownRow({ label, formula, value, isActive, isDone }: {
  label: string; formula: string; value: number; isActive: boolean; isDone: boolean;
}) {
  const color = isActive ? "#f0425b" : isDone ? "#4ab870" : "#d26a61";
  return (
    <div
      className="flex items-center justify-between gap-4 rounded-lg px-2 py-1 text-sm transition-all duration-150"
      style={{
        color,
        transform: isActive ? "scale(1.02)" : undefined,
        background: isActive ? "rgba(240,66,91,0.08)" : isDone ? "rgba(74,184,112,0.08)" : undefined,
      }}
    >
      <span>{label} {formula} :</span>
      <span className="font-black tabular-nums">{value.toLocaleString()}</span>
    </div>
  );
}

type BreakdownRowKey = "clear" | "moves" | "lives" | "total";

async function animateBreakdownStep(
  key: BreakdownRowKey, target: number, durationMs: number,
  onUpdate: (value: number) => void,
  setActiveRow: (value: BreakdownRowKey | null) => void,
  setCompletedRows: React.Dispatch<React.SetStateAction<BreakdownRowKey[]>>,
  isCancelled: () => boolean
) {
  setActiveRow(key);
  await animateCounter(target, durationMs, onUpdate, isCancelled);
  if (isCancelled()) return;
  setCompletedRows((current) => (current.includes(key) ? current : [...current, key]));
  await delay(120);
}

function animateCounter(target: number, durationMs: number, onUpdate: (value: number) => void, isCancelled: () => boolean): Promise<void> {
  return new Promise((resolve) => {
    if (target <= 0) { onUpdate(0); resolve(); return; }
    const start = performance.now();
    function tick(now: number) {
      if (isCancelled()) { resolve(); return; }
      const progress = Math.min((now - start) / durationMs, 1);
      onUpdate(Math.round(target * easeOutCubic(progress)));
      if (progress < 1) { requestAnimationFrame(tick); return; }
      onUpdate(target);
      resolve();
    }
    requestAnimationFrame(tick);
  });
}

function easeOutCubic(value: number) { return 1 - Math.pow(1 - value, 3); }
function delay(ms: number): Promise<void> { return new Promise((resolve) => setTimeout(resolve, ms)); }

function resolveNextLevelFromCatalog(levels: LevelData[], currentLevel: LevelData): LevelData | null {
  const byOrder = levels.find((candidate) => candidate.order === currentLevel.order + 1);
  if (byOrder) return byOrder;
  return getNextLevel(levels, currentLevel.id);
}

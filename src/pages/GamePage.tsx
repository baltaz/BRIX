import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate, useSearchParams, Link } from "react-router-dom";
import { useGameStore } from "@/lib/store/gameStore";
import { getNextLevel, loadPublicLevelByRouteId, loadPublicLevels } from "@/lib/game/catalog";
import { LevelData } from "@/lib/game/types";
import { markLevelReached } from "@/lib/progress";
import { Board } from "@/components/game/Board";
import { HUD } from "@/components/game/HUD";
import { GravityIndicator } from "@/components/game/GravityIndicator";
import { ComboPopup } from "@/components/game/ComboPopup";
import { GameOverModal } from "@/components/game/GameOverModal";
import { LevelCompleteModal } from "@/components/game/LevelCompleteModal";
import { RunEndModal } from "@/components/game/RunEndModal";
import { useKeyboard } from "@/hooks/useKeyboard";
import { useSwipe } from "@/hooks/useSwipe";

export default function GamePage() {
  const { levelId } = useParams<{ levelId: string }>();
  const [searchParams] = useSearchParams();
  const continueRun = searchParams.get("continue") === "1";
  const navigate = useNavigate();
  const loadLevel = useGameStore((s) => s.loadLevel);
  const tickDynamicBlocks = useGameStore((s) => s.tickDynamicBlocks);
  const level = useGameStore((s) => s.level);
  const phase = useGameStore((s) => s.phase);
  const score = useGameStore((s) => s.score);
  const livesLeft = useGameStore((s) => s.livesLeft);
  const levelsCompletedInRun = useGameStore((s) => s.levelsCompletedInRun);
  const winBreakdown = useGameStore((s) => s.winBreakdown);
  const gameRef = useRef<HTMLDivElement>(null);
  const autoAdvanceLevelRef = useRef<string | null>(null);
  const [showRunEnd, setShowRunEnd] = useState(false);

  useKeyboard();
  useSwipe(gameRef);

  // Reset showRunEnd cuando cambia el nivel (nueva carga)
  useEffect(() => {
    setShowRunEnd(false);
    autoAdvanceLevelRef.current = null;
  }, [level?.id]);

  useEffect(() => {
    let cancelled = false;

    async function loadCurrentLevel() {
      if (!levelId) {
        navigate("/", { replace: true });
        return;
      }

      try {
        // Caso especial: 'first' carga el primer nivel publicado
        if (levelId === "first") {
          const all = await loadPublicLevels();
          if (cancelled) return;
          if (all.length === 0) { navigate("/", { replace: true }); return; }
          navigate(`/game/${all[0].id}`, { replace: true });
          return;
        }

        const levelData = await loadPublicLevelByRouteId(levelId);
        if (!levelData) {
          navigate("/", { replace: true });
          return;
        }

        if (!cancelled) {
          loadLevel(levelData, { preserveRun: continueRun });
          markLevelReached(levelData.order, levelData.id);
        }
      } catch {
        navigate("/", { replace: true });
      }
    }

    void loadCurrentLevel();

    return () => {
      cancelled = true;
    };
  }, [levelId, continueRun, loadLevel, navigate]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      tickDynamicBlocks();
    }, 500);

    return () => window.clearInterval(interval);
  }, [tickDynamicBlocks]);

  // Auto-avance al siguiente nivel, o RunEndModal en el último
  useEffect(() => {
    if (phase !== "won" || !level || !winBreakdown?.applied) {
      return;
    }

    if (autoAdvanceLevelRef.current === level.id) {
      return;
    }

    autoAdvanceLevelRef.current = level.id;
    let cancelled = false;
    const currentLevel = level;

    async function advanceToNextLevel() {
      const levels = await loadPublicLevels();
      if (cancelled) return;

      const nextLevel = resolveNextLevelFromCatalog(levels, currentLevel);

      await delay(1000);
      if (cancelled) return;

      if (nextLevel) {
        loadLevel(nextLevel, { preserveRun: true });
        navigate(`/game/${nextLevel.id}?continue=1`, { replace: true });
        return;
      }

      // Último nivel completado → fin de run
      setShowRunEnd(true);
    }

    void advanceToNextLevel();

    return () => {
      cancelled = true;
    };
  }, [phase, level, winBreakdown?.applied, loadLevel, navigate]);

  // Sin vidas → fin de run
  useEffect(() => {
    if (phase !== "lost" || !level || livesLeft > 0) return;
    setShowRunEnd(true);
  }, [phase, level, livesLeft]);

  if (!level) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <p className="text-white/40">Cargando...</p>
      </div>
    );
  }

  return (
    <div
      ref={gameRef}
      className="min-h-dvh flex flex-col items-center max-w-md mx-auto py-2 select-none"
    >
      <div className="w-full flex items-center justify-between mb-1 px-3">
        <Link
          to="/levels"
          className="text-sm text-white/40 hover:text-white/70 transition-colors px-2 py-1"
        >
          ← Niveles
        </Link>
        <h2 className="text-sm font-semibold text-white/60 truncate">
          Nivel {level.order}
        </h2>
        <div className="w-16" />
      </div>

      <div className="w-full px-3">
        <HUD />
      </div>

      <div className="relative flex-1 w-full flex items-center justify-center min-h-0">
        <Board />
        <GravityIndicator />
        <ComboPopup />
        <GameOverModal />
        <LevelCompleteModal />
        {showRunEnd && (
          <RunEndModal
            score={score}
            levelsCompleted={levelsCompletedInRun}
            lastLevelOrder={level.order}
          />
        )}
      </div>

      {/* Leyenda de controles */}
      <p className="hidden md:block text-center text-xs font-bold text-white/50 py-3 tracking-wide">
        ← ↑ → ↓ &nbsp; Usá las flechas del teclado para mover
      </p>
      <p className="md:hidden text-center text-xs font-bold text-white/50 py-3 tracking-wide">
        Deslizá para mover las piezas
      </p>
    </div>
  );
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function resolveNextLevelFromCatalog(levels: LevelData[], currentLevel: LevelData): LevelData | null {
  const byOrder = levels.find((candidate) => candidate.order === currentLevel.order + 1);
  if (byOrder) return byOrder;
  return getNextLevel(levels, currentLevel.id);
}

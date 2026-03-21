import { useEffect, useRef } from "react";
import { useParams, useNavigate, useSearchParams, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useGameStore } from "@/lib/store/gameStore";
import { getNextLevel, loadPublicLevelByRouteId, loadPublicLevels } from "@/lib/game/catalog";
import { saveGameRun } from "@/lib/supabase/queries";
import { LevelData } from "@/lib/game/types";
import { Board } from "@/components/game/Board";
import { HUD } from "@/components/game/HUD";
import { DirectionButtons } from "@/components/game/DirectionButtons";
import { GravityIndicator } from "@/components/game/GravityIndicator";
import { ComboPopup } from "@/components/game/ComboPopup";
import { GameOverModal } from "@/components/game/GameOverModal";
import { LevelCompleteModal } from "@/components/game/LevelCompleteModal";
import { useKeyboard } from "@/hooks/useKeyboard";
import { useSwipe } from "@/hooks/useSwipe";

export default function GamePage() {
  const { levelId } = useParams<{ levelId: string }>();
  const [searchParams] = useSearchParams();
  const continueRun = searchParams.get("continue") === "1";
  const navigate = useNavigate();
  const { user } = useAuth();
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
  const submittedRunRef = useRef<string | null>(null);

  useKeyboard();
  useSwipe(gameRef);

  useEffect(() => {
    let cancelled = false;

    async function loadCurrentLevel() {
      if (!levelId) {
        navigate("/levels", { replace: true });
        return;
      }

      try {
        const levelData = await loadPublicLevelByRouteId(levelId);
        if (!levelData) {
          navigate("/levels", { replace: true });
          return;
        }

        if (!cancelled) {
          loadLevel(levelData, { preserveRun: continueRun });
        }
      } catch {
        navigate("/levels", { replace: true });
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

  useEffect(() => {
    if (phase === "idle") {
      submittedRunRef.current = null;
    }
  }, [phase, level?.id]);

  useEffect(() => {
    if (phase !== "won" || !level || !winBreakdown?.applied) {
      autoAdvanceLevelRef.current = null;
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

      if (!nextLevel) {
        await saveRunIfNeeded({
          outcomeKey: `won:${currentLevel.id}:${score}:${levelsCompletedInRun}`,
          submittedRunRef,
          userId: user?.isAnonymous ? null : user?.id ?? null,
          finalScore: score,
          levelsCompleted: levelsCompletedInRun,
          lastLevelOrder: currentLevel.order,
        });
      }

      await delay(1000);
      if (cancelled) return;

      if (nextLevel) {
        loadLevel(nextLevel, { preserveRun: true });
        navigate(`/game/${nextLevel.id}?continue=1`, { replace: true });
        return;
      }

      navigate("/levels", { replace: true });
    }

    void advanceToNextLevel();

    return () => {
      cancelled = true;
    };
  }, [phase, level, winBreakdown?.applied, loadLevel, navigate, score, levelsCompletedInRun, user]);

  useEffect(() => {
    if (phase !== "lost" || !level || livesLeft > 0) {
      return;
    }

    void saveRunIfNeeded({
      outcomeKey: `lost:${level.id}:${score}:${levelsCompletedInRun}`,
      submittedRunRef,
      userId: user?.isAnonymous ? null : user?.id ?? null,
      finalScore: score,
      levelsCompleted: levelsCompletedInRun,
      lastLevelOrder: level.order,
    });
  }, [phase, level, livesLeft, score, levelsCompletedInRun, user]);

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
      className="min-h-dvh flex flex-col items-center max-w-md mx-auto px-2 py-2 select-none"
    >
      <div className="w-full flex items-center justify-between mb-1">
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

      <HUD />

      <div className="relative flex-1 w-full flex items-center justify-center min-h-0">
        <Board />
        <GravityIndicator />
        <ComboPopup />
        <GameOverModal />
        <LevelCompleteModal />
      </div>

      <div className="py-4">
        <DirectionButtons />
      </div>

      <p className="text-[10px] text-white/20 pb-2">
        Swipe o flechas del teclado para cambiar la gravedad
      </p>
    </div>
  );
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function saveRunIfNeeded(params: {
  outcomeKey: string;
  submittedRunRef: React.MutableRefObject<string | null>;
  userId: string | null;
  finalScore: number;
  levelsCompleted: number;
  lastLevelOrder: number;
}) {
  if (!params.userId) return;
  if (params.submittedRunRef.current === params.outcomeKey) return;

  params.submittedRunRef.current = params.outcomeKey;

  try {
    await saveGameRun({
      userId: params.userId,
      finalScore: params.finalScore,
      levelsCompleted: params.levelsCompleted,
      lastLevelOrder: params.lastLevelOrder,
    });
  } catch (error) {
    console.error("[game_runs] save:error", error);
  }
}

function resolveNextLevelFromCatalog(levels: LevelData[], currentLevel: LevelData): LevelData | null {
  const byOrder = levels.find((candidate) => candidate.order === currentLevel.order + 1);
  if (byOrder) return byOrder;
  return getNextLevel(levels, currentLevel.id);
}

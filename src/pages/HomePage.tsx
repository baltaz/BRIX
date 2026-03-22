import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { getProgress, resetProgress } from "@/lib/progress";

export default function HomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showPlayChoice, setShowPlayChoice] = useState(false);

  const progress = useMemo(getProgress, []);

  function handleJugar() {
    if (!progress.hasPlayedOnce) {
      navigate("/game/first");
      return;
    }
    setShowPlayChoice(true);
  }

  function handleContinue() {
    if (progress.lastLevelId) {
      navigate(`/game/${progress.lastLevelId}`);
    } else {
      navigate("/game/first");
    }
  }

  function handleNewGame() {
    resetProgress();
    navigate("/game/first");
  }

  return (
    <main className="min-h-dvh flex flex-col items-center justify-center gap-8 p-6">
      <div className="text-center">
        <h1
          className="text-8xl font-black tracking-tight"
          style={{ color: "#fef8f8", textShadow: "0px 6px 0px rgba(0,0,0,0.18)" }}
        >
          BRIX
        </h1>
        <p className="text-white/70 mt-3 text-sm tracking-[0.3em] uppercase font-bold">
          Puzzle de Gravedad
        </p>
      </div>

      <div className="flex flex-col gap-4 w-full max-w-xs">
        {showPlayChoice ? (
          <>
            <button
              type="button"
              onClick={handleContinue}
              className="w-full py-4 px-8 rounded-xl font-black text-lg text-white transition-all active:scale-95"
              style={{
                background: "#fef8f8",
                color: "#f0425b",
                boxShadow: "0px 6px 0px rgba(0,0,0,0.20)",
              }}
            >
              Continuar (Nivel {progress.maxLevelOrder})
            </button>
            <button
              type="button"
              onClick={handleNewGame}
              className="w-full py-3 px-8 rounded-xl font-bold transition-all active:scale-95 text-white"
              style={{
                background: "rgba(255,255,255,0.20)",
                boxShadow: "0px 4px 0px rgba(0,0,0,0.12)",
              }}
            >
              Nueva partida
            </button>
            <button
              type="button"
              onClick={() => setShowPlayChoice(false)}
              className="text-sm text-white/50 hover:text-white/80 transition-colors py-1 font-bold"
            >
              Cancelar
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={handleJugar}
              className="w-full py-4 px-8 rounded-xl font-black text-lg transition-all active:scale-95"
              style={{
                background: "#fef8f8",
                color: "#f0425b",
                boxShadow: "0px 6px 0px rgba(0,0,0,0.20)",
              }}
            >
              Jugar
            </button>

            {progress.hasPlayedOnce && (
              <Link
                to="/levels"
                className="block text-center w-full py-3 px-8 rounded-xl font-bold transition-all active:scale-95 text-white"
                style={{
                  background: "rgba(255,255,255,0.20)",
                  boxShadow: "0px 4px 0px rgba(0,0,0,0.12)",
                }}
              >
                Niveles
              </Link>
            )}

            <Link
              to="/ranking"
              className="block text-center w-full py-3 px-8 rounded-xl font-bold transition-all active:scale-95 text-white"
              style={{
                background: "rgba(255,255,255,0.20)",
                boxShadow: "0px 4px 0px rgba(0,0,0,0.12)",
              }}
            >
              Ranking
            </Link>

            {user?.isAdmin && (
              <Link
                to="/admin"
                className="block text-center w-full py-2 px-8 rounded-xl font-bold text-sm transition-all active:scale-95"
                style={{
                  background: "rgba(255,255,255,0.10)",
                  color: "rgba(255,255,255,0.60)",
                  border: "1px solid rgba(255,255,255,0.20)",
                }}
              >
                Editor de niveles
              </Link>
            )}
          </>
        )}
      </div>

      <p className="text-white/40 text-xs font-bold tracking-widest uppercase">
        Cambia la gravedad · Combina los bloques
      </p>
    </main>
  );
}

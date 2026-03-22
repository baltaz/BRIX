import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { fetchRankings } from "@/lib/supabase/queries";
import { UserAvatar } from "@/components/auth/UserAvatar";

interface RankingEntry {
  rank_position: number;
  user_id: string | null;
  display_name: string;
  avatar_url: string | null;
  total_score: number;
  levels_completed: number;
}

const MEDAL_STYLES: Record<number, { shadow: string; color: string }> = {
  1: { shadow: "0px 3px 0px #c9960a", color: "#c9960a" },
  2: { shadow: "0px 3px 0px #8888a0", color: "#8888a0" },
  3: { shadow: "0px 3px 0px #e06030", color: "#e06030" },
};

export default function RankingPage() {
  const [searchParams] = useSearchParams();
  const isNewRun = searchParams.get("new") === "true";

  const [rankings, setRankings] = useState<RankingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setError("El servidor tarda en responder. Intentá de nuevo en unos segundos.");
      setLoading(false);
    }, 15000);

    fetchRankings()
      .then((data) => {
        setRankings(data as RankingEntry[]);
      })
      .catch((err) => {
        const message =
          err instanceof Error ? err.message : "Ranking no disponible.";
        if (message.includes("schema cache") || message.includes("rankings")) {
          setError(
            "Supabase está conectado, pero faltan ejecutar las migraciones del proyecto."
          );
        } else {
          setError("Ranking no disponible. Revisá la configuración de Supabase.");
        }
      })
      .finally(() => {
        clearTimeout(timeoutId);
        setLoading(false);
      });
  }, []);

  return (
    <main className="min-h-dvh max-w-md mx-auto px-4 py-6">
      <div className="flex items-center gap-4 mb-6">
        <Link
          to="/"
          className="text-sm font-bold text-white/60 hover:text-white transition-colors"
        >
          ← Menú
        </Link>
        <h1 className="text-2xl font-black text-white">Ranking Global</h1>
      </div>

      {isNewRun && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 rounded-2xl px-4 py-4 text-center"
          style={{
            background: "#fef8f8",
            boxShadow: "0px 5px 0px rgba(0,0,0,0.12)",
          }}
        >
          <p className="text-2xl mb-1">🏆</p>
          <p className="font-black text-sm" style={{ color: "#f0425b" }}>
            ¡Tu score fue guardado en el ranking!
          </p>
        </motion.div>
      )}

      {loading && (
        <div className="flex justify-center py-20">
          <div
            className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
            style={{ borderColor: "rgba(255,255,255,0.4)", borderTopColor: "transparent" }}
          />
        </div>
      )}

      {error && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-white/60 font-bold mb-2">{error}</p>
          <p className="text-white/40 text-sm">
            Asegurate de haber ejecutado la migración SQL en Supabase.
          </p>
        </div>
      )}

      {!loading && !error && rankings.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="text-4xl mb-4 opacity-40">🏆</div>
          <p className="text-white/60 font-bold">
            Aún no hay puntajes. ¡Sé el primero en jugar!
          </p>
        </div>
      )}

      {!loading && !error && rankings.length > 0 && (
        <div className="flex flex-col gap-2">
          {rankings.map((entry) => {
            const medal = MEDAL_STYLES[entry.rank_position];
            return (
              <motion.div
                key={entry.rank_position}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: (entry.rank_position - 1) * 0.03 }}
                className="flex items-center gap-3 p-3 rounded-xl"
                style={{
                  background: "rgba(255,255,255,0.15)",
                  border: "1px solid rgba(255,255,255,0.20)",
                }}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm shrink-0"
                  style={
                    medal
                      ? { background: "#fef8f8", color: medal.color, boxShadow: medal.shadow }
                      : { background: "rgba(255,255,255,0.20)", color: "white" }
                  }
                >
                  {entry.rank_position}
                </div>
                <UserAvatar
                  name={entry.display_name}
                  avatarUrl={entry.avatar_url}
                  size={42}
                />
                <div className="flex-1 min-w-0">
                  <p className="font-black text-white truncate">
                    {entry.display_name}
                  </p>
                  <p className="text-xs text-white/60 font-bold">
                    {entry.levels_completed}{" "}
                    {entry.levels_completed === 1 ? "nivel completado" : "niveles completados"}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-black tabular-nums" style={{ color: "#fef8f8" }}>
                    {entry.total_score.toLocaleString()}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </main>
  );
}

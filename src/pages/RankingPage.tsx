import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { fetchRankings } from "@/lib/supabase/queries";
import { PublicAccountCard } from "@/components/auth/PublicAccountCard";
import { UserAvatar } from "@/components/auth/UserAvatar";

interface RankingEntry {
  rank_position: number;
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  total_score: number;
  levels_completed: number;
}

export default function RankingPage() {
  const [rankings, setRankings] = useState<RankingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRankings()
      .then((data) => setRankings(data as RankingEntry[]))
      .catch((err) => {
        const message =
          err instanceof Error ? err.message : "Ranking no disponible.";
        if (message.includes("schema cache") || message.includes("rankings")) {
          setError(
            "Supabase está conectado, pero faltan crear las tablas/vistas del proyecto."
          );
        } else {
          setError("Ranking no disponible. Revisa la configuración de Supabase.");
        }
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="min-h-dvh max-w-md mx-auto px-4 py-6">
      <div className="flex items-center gap-4 mb-6">
        <Link
          to="/"
          className="text-sm text-white/40 hover:text-white/70 transition-colors"
        >
          ← Menú
        </Link>
        <h1 className="text-2xl font-bold">Ranking Global</h1>
      </div>

      <div className="mb-6">
        <PublicAccountCard />
      </div>

      {loading && (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {error && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-white/40 mb-2">{error}</p>
          <p className="text-white/20 text-sm">
            Asegúrate de tener las variables de entorno y de haber ejecutado la
            migración SQL en Supabase.
          </p>
        </div>
      )}

      {!loading && !error && rankings.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="text-4xl mb-4 opacity-30">🏆</div>
          <p className="text-white/40">
            Aún no hay puntajes. ¡Sé el primero en jugar!
          </p>
        </div>
      )}

      {!loading && !error && rankings.length > 0 && (
        <div className="flex flex-col gap-2">
          {rankings.map((entry, index) => (
            <motion.div
              key={entry.user_id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.03 }}
              className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5"
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                  entry.rank_position === 1
                    ? "bg-amber-500/30 text-amber-400"
                    : entry.rank_position === 2
                      ? "bg-gray-400/30 text-gray-300"
                      : entry.rank_position === 3
                        ? "bg-orange-600/30 text-orange-400"
                        : "bg-white/10 text-white/40"
                }`}
              >
                {entry.rank_position}
              </div>
              <UserAvatar
                name={entry.display_name}
                avatarUrl={entry.avatar_url}
                size={42}
              />
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">
                  {entry.display_name}
                </p>
                <p className="text-xs text-white/40">
                  {entry.levels_completed} niveles completados
                </p>
              </div>
              <div className="text-right">
                <p className="font-bold text-amber-400 tabular-nums">
                  {entry.total_score.toLocaleString()}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </main>
  );
}

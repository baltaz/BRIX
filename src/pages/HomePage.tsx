import { Link } from "react-router-dom";
import { PublicAccountCard } from "@/components/auth/PublicAccountCard";
import { useAuth } from "@/hooks/useAuth";

export default function HomePage() {
  const { user } = useAuth();

  return (
    <main className="min-h-dvh flex flex-col items-center justify-center gap-8 p-6">
      <div className="text-center">
        <h1 className="text-7xl font-black tracking-tight bg-gradient-to-b from-white to-purple-300 bg-clip-text text-transparent">
          BRIX
        </h1>
        <p className="text-purple-300/70 mt-2 text-sm tracking-widest uppercase">
          Puzzle de Gravedad
        </p>
      </div>

      <div className="flex flex-col gap-4 w-full max-w-xs">
        <Link
          to="/levels"
          className="block text-center py-4 px-8 rounded-xl bg-purple-600 hover:bg-purple-500 active:bg-purple-700 font-bold text-lg transition-colors shadow-lg shadow-purple-600/30"
        >
          Jugar
        </Link>
        <Link
          to="/ranking"
          className="block text-center py-3 px-8 rounded-xl bg-white/10 hover:bg-white/15 active:bg-white/5 font-semibold transition-colors"
        >
          Ranking
        </Link>
        {user?.isAdmin && (
          <Link
            to="/admin"
            className="block text-center py-3 px-8 rounded-xl bg-white/5 hover:bg-white/10 active:bg-white/5 font-semibold text-sm text-purple-300 border border-purple-500/30 transition-colors"
          >
            Editor de niveles
          </Link>
        )}
      </div>

      <div className="w-full max-w-xs">
        <PublicAccountCard />
      </div>

      <p className="text-purple-400/40 text-xs mt-8">
        Cambia la gravedad. Combina los bloques. Limpia el tablero.
      </p>
    </main>
  );
}

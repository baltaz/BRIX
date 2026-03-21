import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { LevelEditor, LevelFormData } from "@/components/admin/LevelEditor";
import { PIECE_COLORS, PieceType, isMatchableType } from "@/lib/game/types";
import { useAuth } from "@/hooks/useAuth";
import { signInWithEmail, signInWithMagicLink, signOut } from "@/lib/supabase/auth";
import { fetchAllLevelsAdmin, supabaseUpsertLevel, supabaseUpdateLevel, supabaseReorderLevels, supabaseDeleteLevel } from "@/lib/supabase/queries";

interface AdminLevelRow {
  id: string;
  dbId?: string;
  order: number;
  maxMoves: number;
  grid: number[][];
  isPublished?: boolean;
}

export function AdminLevelsPage() {
  const { user } = useAuth();
  const [levels, setLevels] = useState<AdminLevelRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<LevelFormData | null>(null);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loginMode, setLoginMode] = useState<"magic" | "password">("magic");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [magicSent, setMagicSent] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);
  const [draggedLevelId, setDraggedLevelId] = useState<string | null>(null);
  const [reordering, setReordering] = useState(false);

  const loadLevels = useCallback(async () => {
    try {
      const data = await fetchAllLevelsAdmin();
      setLevels(
        data.map((row) => ({
          id: row.id,
          dbId: row.id,
          order: row.order,
          maxMoves: row.max_moves,
          grid: row.grid,
          isPublished: row.is_published,
        }))
      );
      setError(null);
    } catch (loadError) {
      const message =
        loadError instanceof Error
          ? loadError.message
          : "No se pudo cargar el backoffice.";
      if (message.includes("schema cache") || message.includes("levels")) {
        setError("Supabase está conectado, pero falta ejecutar las migraciones.");
      } else {
        setError("No tienes acceso al backoffice. Inicia sesión con un usuario admin.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user?.isAdmin) {
      setLoading(true);
      void loadLevels();
      return;
    }
    setLevels([]);
    setLoading(false);
  }, [loadLevels, user]);

  async function handleSave(data: LevelFormData) {
    setSaving(true);
    try {
      const savedLevel = await supabaseUpsertLevel({
        id: data.dbId,
        order: data.order,
        max_moves: data.max_moves,
        grid: data.grid,
        is_published: data.is_published,
      });

      const nextLevel: AdminLevelRow = {
        id: savedLevel.id,
        dbId: savedLevel.id,
        order: savedLevel.order,
        maxMoves: savedLevel.max_moves,
        grid: savedLevel.grid,
        isPublished: savedLevel.is_published,
      };

      setLevels((prev) => upsertAdminLevel(prev, nextLevel));
      setCreating(false);
      setEditing(null);
    } catch (saveError) {
      alert("Error al guardar: " + (saveError as Error).message);
    } finally {
      setSaving(false);
    }
  }

  const orderedLevels = useMemo(
    () => [...levels].sort((a, b) => a.order - b.order),
    [levels]
  );

  function buildNewLevelDraft(): LevelFormData {
    const nextOrder =
      orderedLevels.reduce((maxOrder, level) => Math.max(maxOrder, level.order), 0) + 1;
    return {
      order: nextOrder,
      max_moves: 10,
      grid: Array.from({ length: 13 }, () => Array.from({ length: 10 }, () => 0)),
      is_published: true,
    };
  }

  function reorderLevels(sourceId: string, targetId: string) {
    if (sourceId === targetId) return levels;
    const nextLevels = [...orderedLevels];
    const sourceIndex = nextLevels.findIndex((l) => l.dbId === sourceId);
    const targetIndex = nextLevels.findIndex((l) => l.dbId === targetId);
    if (sourceIndex < 0 || targetIndex < 0) return levels;
    const [moved] = nextLevels.splice(sourceIndex, 1);
    nextLevels.splice(targetIndex, 0, moved);
    return nextLevels.map((level, index) => ({ ...level, order: index + 1 }));
  }

  async function persistOrder(nextLevels: AdminLevelRow[]) {
    setLevels(nextLevels);
    setReordering(true);
    try {
      await supabaseReorderLevels(
        nextLevels
          .filter((l) => l.dbId)
          .map((l) => ({ id: l.dbId!, order: l.order }))
      );
    } catch (orderError) {
      alert("Error al guardar el orden: " + (orderError as Error).message);
      await loadLevels();
    } finally {
      setDraggedLevelId(null);
      setReordering(false);
    }
  }

  async function handleDelete(level: AdminLevelRow) {
    if (!level.dbId) return;
    if (!confirm("¿Eliminar este nivel permanentemente?")) return;
    try {
      await supabaseDeleteLevel(level.dbId);
      setLevels((prev) => prev.filter((l) => l.dbId !== level.dbId));
    } catch (deleteError) {
      alert("Error al eliminar: " + (deleteError as Error).message);
    }
  }

  async function withLoginTimeout<T>(fn: () => Promise<T>, ms = 30000): Promise<T> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("timeout"));
      }, ms);
      fn().then(
        (result) => { clearTimeout(timeout); resolve(result); },
        (err: unknown) => { clearTimeout(timeout); reject(err); }
      );
    });
  }

  function formatLoginError(err: unknown): string {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg === "timeout") {
      return "Tiempo agotado (30s). Tu proyecto Supabase puede estar pausado — revisá supabase.com/dashboard para reactivarlo, o esperá un momento y volvé a intentar.";
    }
    if (msg.toLowerCase().includes("email") && msg.toLowerCase().includes("not confirmed")) {
      return "Email no confirmado. Revisá tu bandeja de entrada.";
    }
    if (msg.toLowerCase().includes("invalid login")) {
      return "Email o contraseña incorrectos.";
    }
    if (msg.toLowerCase().includes("rate limit")) {
      return "Demasiados intentos. Esperá unos minutos.";
    }
    return msg || "Error desconocido.";
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError(null);
    try {
      // Redirect al origin para evitar problemas de URL allowlist en Supabase
      await withLoginTimeout(() =>
        signInWithMagicLink(email, window.location.origin)
      );
      setMagicSent(true);
    } catch (err) {
      setLoginError(formatLoginError(err));
    } finally {
      setLoginLoading(false);
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError(null);
    try {
      await withLoginTimeout(() => signInWithEmail(email, password));
    } catch (loginErr) {
      setLoginError(formatLoginError(loginErr));
    } finally {
      setLoginLoading(false);
    }
  }

  // No mostramos spinner de auth: si no hay usuario, mostramos login directamente
  if (!user || user.isAnonymous) {
    return (
      <main className="min-h-dvh max-w-sm mx-auto px-4 py-12 flex flex-col justify-center">
        <div className="mb-8">
          <p className="text-sm uppercase tracking-[0.3em] text-purple-300/60">Backoffice</p>
          <h1 className="text-3xl font-bold mt-1">Gestión de niveles</h1>
        </div>

        <div className="rounded-2xl bg-white/5 border border-white/10 p-6">
          {/* Mode switcher */}
          <div className="flex rounded-xl bg-white/5 p-1 mb-6 gap-1">
            <button
              type="button"
              onClick={() => { setLoginMode("magic"); setLoginError(null); setMagicSent(false); }}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${loginMode === "magic" ? "bg-purple-600 text-white" : "text-white/50 hover:text-white"}`}
            >
              Magic link
            </button>
            <button
              type="button"
              onClick={() => { setLoginMode("password"); setLoginError(null); }}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${loginMode === "password" ? "bg-purple-600 text-white" : "text-white/50 hover:text-white"}`}
            >
              Contraseña
            </button>
          </div>

          {loginMode === "magic" && (
            magicSent ? (
              <div className="text-center py-4">
                <p className="text-2xl mb-3">📬</p>
                <p className="font-bold mb-1">Revisá tu email</p>
                <p className="text-sm text-white/50 mb-4">
                  Te enviamos un link a <span className="text-white/80">{email}</span>.
                  Hacé clic en él para entrar al admin.
                </p>
                <button
                  type="button"
                  onClick={() => { setMagicSent(false); setLoginError(null); }}
                  className="text-sm text-purple-400 hover:text-purple-300 underline"
                >
                  Usar otro email
                </button>
              </div>
            ) : (
              <form onSubmit={(e) => void handleMagicLink(e)} className="space-y-3">
                <input
                  type="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-3 rounded-xl bg-white/10 border border-white/10 focus:border-purple-500 focus:outline-none"
                  required
                />
                {loginError && <p className="text-sm text-red-400">{loginError}</p>}
                <button
                  type="submit"
                  disabled={loginLoading}
                  className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 font-bold transition-colors"
                >
                  {loginLoading ? "Conectando... (puede tardar ~15s)" : "Enviar magic link"}
                </button>
              </form>
            )
          )}

          {loginMode === "password" && (
            <form onSubmit={(e) => void handleLogin(e)} className="space-y-3">
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-3 rounded-xl bg-white/10 border border-white/10 focus:border-purple-500 focus:outline-none"
                required
              />
              <input
                type="password"
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-3 rounded-xl bg-white/10 border border-white/10 focus:border-purple-500 focus:outline-none"
                required
              />
              {loginError && <p className="text-sm text-red-400">{loginError}</p>}
              <button
                type="submit"
                disabled={loginLoading}
                className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 font-bold transition-colors"
              >
                {loginLoading ? "Conectando... (puede tardar ~15s)" : "Entrar"}
              </button>
            </form>
          )}
        </div>
      </main>
    );
  }

  if (!user.isAdmin) {
    return (
      <main className="min-h-dvh max-w-md mx-auto px-4 py-6 flex items-center">
        <div className="w-full rounded-2xl bg-red-600/10 border border-red-600/20 p-6">
          <h1 className="text-2xl font-bold text-red-300 mb-2">Acceso denegado</h1>
          <p className="text-sm text-red-200/80 mb-1">
            Tu cuenta (<span className="text-red-100">{user.email ?? user.displayName}</span>) no tiene permisos de administrador.
          </p>
          <p className="text-xs text-red-200/50 mb-4">
            Si sos el admin, asegurate de tener <code className="bg-white/10 px-1 rounded">is_admin = true</code> en la tabla <code className="bg-white/10 px-1 rounded">profiles</code> de Supabase.
          </p>
          <button
            type="button"
            onClick={() => { void signOut(); }}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-sm font-semibold transition-colors"
          >
            Cerrar sesión
          </button>
        </div>
      </main>
    );
  }

  if (creating || editing) {
    return (
      <main className="min-h-dvh max-w-2xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-6">
          {editing?.dbId ? "Editar nivel" : "Nuevo nivel"}
        </h1>
        <LevelEditor
          initialData={editing ?? buildNewLevelDraft()}
          onSave={handleSave}
          onCancel={() => { setCreating(false); setEditing(null); }}
          saving={saving}
        />
      </main>
    );
  }

  return (
    <main className="min-h-dvh max-w-3xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Link to="/" className="text-sm text-white/40 hover:text-white/70 transition-colors">← Juego</Link>
            <p className="text-sm uppercase tracking-[0.3em] text-purple-300/60">Backoffice</p>
          </div>
          <h1 className="text-3xl font-bold">Gestión de niveles</h1>
          <p className="text-sm text-white/50 mt-2">Arrastrá los niveles para cambiar su posición.</p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => void signOut()} className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-sm transition-colors">Salir</button>
          <button type="button" onClick={() => { setEditing(buildNewLevelDraft()); setCreating(true); }} className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 font-semibold text-sm transition-colors">+ Nuevo nivel</button>
        </div>
      </div>

      {loading && (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-red-600/10 border border-red-600/20 text-red-400 text-sm">{error}</div>
      )}

      {!loading && !error && levels.length === 0 && (
        <div className="text-center py-20 text-white/40">No hay niveles cargados todavía.</div>
      )}

      {!loading && !error && levels.length > 0 && (
        <div className="flex flex-col gap-3">
          {orderedLevels.map((level) => {
            const dragId = level.dbId ?? level.id;
            const pieceCount = level.grid.flat().filter((v) => v !== 0 && isMatchableType(v)).length;
            const pieceTypes = new Set(level.grid.flat().filter((v) => v !== 0 && isMatchableType(v)));

            return (
              <div
                key={dragId}
                draggable={!reordering}
                onDragStart={() => setDraggedLevelId(dragId)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => { if (draggedLevelId && draggedLevelId !== dragId) void persistOrder(reorderLevels(draggedLevelId, dragId)); }}
                onDragEnd={() => setDraggedLevelId(null)}
                className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${
                  draggedLevelId === dragId ? "bg-purple-500/10 border-purple-400/40 opacity-60" : "bg-white/5 border-white/5"
                }`}
              >
                <div className="w-10 h-10 rounded-lg bg-purple-600/30 flex items-center justify-center font-bold">{level.order}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold truncate">Nivel {level.order}</h3>
                    {!level.isPublished && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-600/20 text-yellow-400">Borrador</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 text-xs text-white/40">
                    <span>{level.maxMoves} movs</span>
                    <span>{pieceCount} piezas</span>
                    <div className="flex gap-0.5">
                      {Array.from(pieceTypes).map((type) => (
                        <div key={type} className="w-3 h-3 rounded-sm" style={{ backgroundColor: PIECE_COLORS[type as PieceType] }} />
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Link
                    to={`/game/${level.dbId ?? level.id}`}
                    className="text-xs px-3 py-1.5 rounded-lg bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30 transition-colors"
                  >
                    Probar
                  </Link>
                  <button
                    type="button"
                    onClick={() =>
                      setEditing({
                        id: level.id,
                        dbId: level.dbId,
                        order: level.order,
                        max_moves: level.maxMoves,
                        grid: level.grid,
                        is_published: level.isPublished ?? true,
                      })
                    }
                    className="text-xs px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 transition-colors"
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(level)}
                    className="text-xs px-3 py-1.5 rounded-lg bg-red-600/20 text-red-400 hover:bg-red-600/30 transition-colors"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}

function upsertAdminLevel(levels: AdminLevelRow[], nextLevel: AdminLevelRow): AdminLevelRow[] {
  const exists = levels.some((l) => l.dbId === nextLevel.dbId);
  const nextLevels = exists
    ? levels.map((l) => (l.dbId === nextLevel.dbId ? nextLevel : l))
    : [...levels, nextLevel];
  return nextLevels.sort((a, b) => a.order - b.order);
}

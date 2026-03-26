import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { LevelEditor, LevelFormData } from "@/components/admin/LevelEditor";
import { PIECE_COLORS, PieceType, isMatchableType } from "@/lib/game/types";
import { fetchAllLevelsAdmin, supabaseUpsertLevel, supabaseReorderLevels, supabaseDeleteLevel } from "@/lib/supabase/queries";
import { invalidatePublicLevelsCache } from "@/lib/game/catalog";

const ADMIN_SESSION_KEY = "brix_admin_auth";

interface AdminLevelRow {
  id: string;
  dbId?: string;
  order: number;
  maxMoves: number;
  grid: number[][];
  isPublished?: boolean;
}

export function AdminLevelsPage() {
  const [authenticated, setAuthenticated] = useState(
    () => sessionStorage.getItem(ADMIN_SESSION_KEY) === "1"
  );
  const [pwdInput, setPwdInput] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);

  const [levels, setLevels] = useState<AdminLevelRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<LevelFormData | null>(null);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draggedLevelId, setDraggedLevelId] = useState<string | null>(null);
  const [reordering, setReordering] = useState(false);

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    const expected = import.meta.env.VITE_ADMIN_PWD as string | undefined;
    if (pwdInput === expected) {
      sessionStorage.setItem(ADMIN_SESSION_KEY, "1");
      setAuthenticated(true);
      setLoginError(null);
    } else {
      setLoginError("Contraseña incorrecta.");
    }
  }

  function handleLogout() {
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
    setAuthenticated(false);
    setPwdInput("");
  }

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
          : String(loadError);
      setError(`Error: ${message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authenticated) {
      setLoading(true);
      void loadLevels();
      return;
    }
    setLevels([]);
    setLoading(false);
  }, [loadLevels, authenticated]);

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
      invalidatePublicLevelsCache();
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

  if (!authenticated) {
    return (
      <main className="min-h-dvh max-w-sm mx-auto px-4 py-12 flex flex-col justify-center">
        <div className="mb-8">
          <p className="text-sm uppercase tracking-[0.3em] text-purple-300/60">Backoffice</p>
          <h1 className="text-3xl font-bold mt-1">Gestión de niveles</h1>
        </div>

        <div className="rounded-2xl bg-white/5 border border-white/10 p-6">
          <form onSubmit={handleLogin} className="space-y-3">
            <input
              type="password"
              placeholder="Contraseña"
              value={pwdInput}
              onChange={(e) => setPwdInput(e.target.value)}
              autoFocus
              className="w-full px-3 py-3 rounded-xl bg-white/10 border border-white/10 focus:border-purple-500 focus:outline-none"
              required
            />
            {loginError && <p className="text-sm text-red-400">{loginError}</p>}
            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 font-bold transition-colors"
            >
              Entrar
            </button>
          </form>
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
          <button type="button" onClick={handleLogout} className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-sm transition-colors">Salir</button>
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

import { useState } from "react";
import { GridEditor, createEmptyGrid } from "./GridEditor";

export interface LevelFormData {
  id?: string;
  dbId?: string;
  order: number;
  max_moves: number;
  grid: number[][];
  is_published: boolean;
}

interface LevelEditorProps {
  initialData?: LevelFormData;
  onSave: (data: LevelFormData) => Promise<void>;
  onCancel: () => void;
  saving?: boolean;
}

export function LevelEditor({
  initialData,
  onSave,
  onCancel,
  saving = false,
}: LevelEditorProps) {
  const [form, setForm] = useState<LevelFormData>(
    initialData ?? {
      order: 1,
      max_moves: 10,
      grid: createEmptyGrid(),
      is_published: true,
    }
  );

  const [testMode, setTestMode] = useState(false);

  function updateField<K extends keyof LevelFormData>(
    key: K,
    value: LevelFormData[K]
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await onSave(form);
  }

  const pieceCount = form.grid.flat().filter((v) => v > 0).length;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-white/60 mb-1">
            Máx. Movimientos
          </label>
          <input
            type="number"
            value={form.max_moves}
            onChange={(e) =>
              updateField("max_moves", parseInt(e.target.value) || 1)
            }
            min={1}
            className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/10 focus:border-purple-500 focus:outline-none text-sm"
          />
        </div>
        <div className="flex items-end">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.is_published}
              onChange={(e) => updateField("is_published", e.target.checked)}
              className="w-4 h-4 rounded"
            />
            <span className="text-sm">Publicado</span>
          </label>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold">
            Nivel {form.order}
            <span className="text-xs text-white/40 ml-2 font-normal">
              {pieceCount} piezas
            </span>
          </h3>
          <button
            type="button"
            onClick={() => setTestMode(!testMode)}
            className="text-xs px-3 py-1 rounded-lg bg-purple-600/20 text-purple-400 hover:bg-purple-600/30 transition-colors"
          >
            {testMode ? "Editar" : "Vista previa"}
          </button>
        </div>
        <GridEditor
          grid={form.grid}
          onChange={(grid) => updateField("grid", grid)}
        />
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={saving || pieceCount === 0}
          className="flex-1 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed font-bold transition-colors"
        >
          {saving ? "Guardando..." : initialData ? "Actualizar" : "Crear Nivel"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/15 font-semibold transition-colors"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}

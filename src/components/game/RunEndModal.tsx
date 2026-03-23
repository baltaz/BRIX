import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { saveGuestRun } from "@/lib/supabase/queries";
import { resetProgress } from "@/lib/progress";

interface RunEndModalProps {
  score: number;
  levelsCompleted: number;
  lastLevelOrder: number;
}

export function RunEndModal({ score, levelsCompleted, lastLevelOrder }: RunEndModalProps) {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    const trimmed = name.trim();
    if (!trimmed || saving) return;
    setSaving(true);
    setError(null);
    try {
      await saveGuestRun({
        guestName: trimmed.slice(0, 20),
        finalScore: score,
        levelsCompleted,
        lastLevelOrder,
      });
      resetProgress();
      navigate(`/ranking?new=true&name=${encodeURIComponent(trimmed.slice(0, 20))}`);
    } catch {
      setError("No se pudo guardar. Intentá de nuevo.");
      setSaving(false);
    }
  }

  function handleSkip() {
    resetProgress();
    navigate("/");
  }

  return (
    <div className="absolute inset-0 z-[100] flex items-center justify-center">
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="mx-4 w-full max-w-xs rounded-2xl p-6 text-center"
        style={{
          background: "#fef8f8",
          boxShadow: "0 8px 32px rgba(240,66,91,0.35), 0 0 0 1px rgba(255,255,255,0.6)",
        }}
      >
        <p className="mb-2 text-5xl">🏁</p>
        <h2 className="mb-1 text-2xl font-black" style={{ color: "#f0425b" }}>
          Run terminada
        </h2>

        <p className="mb-1 text-4xl font-black tabular-nums" style={{ color: "#c9960a" }}>
          {score.toLocaleString()}
        </p>
        <p className="mb-6 text-sm" style={{ color: "#d26a61", opacity: 0.7 }}>
          {levelsCompleted}{" "}
          {levelsCompleted === 1 ? "nivel completado" : "niveles completados"}
        </p>

        <div className="flex flex-col gap-3">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") void handleSave(); }}
            placeholder="Tu nombre para el ranking"
            maxLength={20}
            autoFocus
            className="w-full rounded-xl px-3 py-3 text-center focus:outline-none font-bold"
            style={{
              background: "rgba(240,66,91,0.08)",
              border: "2px solid rgba(240,66,91,0.20)",
              color: "#d26a61",
            }}
          />

          {error && <p className="text-sm" style={{ color: "#f0425b" }}>{error}</p>}

          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={!name.trim() || saving}
            className="w-full rounded-xl py-3 font-black text-white transition-all active:scale-95 disabled:opacity-40"
            style={{
              background: "#f0425b",
              boxShadow: "0px 5px 0px #b82f43",
            }}
          >
            {saving ? "Guardando..." : "Guardar y ver ranking"}
          </button>

          <button
            type="button"
            onClick={handleSkip}
            disabled={saving}
            className="py-2 text-sm transition-colors disabled:opacity-40"
            style={{ color: "#d26a61", opacity: 0.5 }}
          >
            Omitir
          </button>
        </div>
      </motion.div>
    </div>
  );
}

const STORAGE_KEY = "brix_progress";

interface BrixProgress {
  maxLevelOrder: number;    // 0 = nunca jugó
  hasPlayedOnce: boolean;   // determina si se muestra "Niveles" en el menú
  lastLevelId: string | null; // ID del último nivel alcanzado (para "Continuar")
}

const DEFAULT: BrixProgress = { maxLevelOrder: 0, hasPlayedOnce: false, lastLevelId: null };

export function getProgress(): BrixProgress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT };
    return { ...DEFAULT, ...(JSON.parse(raw) as Partial<BrixProgress>) };
  } catch {
    return { ...DEFAULT };
  }
}

/** Marca que el jugador llegó a un nivel. Guarda también su ID para poder navegar directo. */
export function markLevelReached(order: number, levelId: string): void {
  try {
    const current = getProgress();
    const updated: BrixProgress = {
      maxLevelOrder: Math.max(current.maxLevelOrder, order),
      hasPlayedOnce: true,
      lastLevelId: levelId,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // localStorage no disponible (modo privado muy restrictivo)
  }
}

/** Borra todo el progreso al terminar/reiniciar una run. */
export function resetProgress(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignorar
  }
}

/** True si el level con ese order está desbloqueado. */
export function isLevelUnlocked(order: number): boolean {
  const { maxLevelOrder } = getProgress();
  return order <= maxLevelOrder;
}

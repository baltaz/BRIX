import { LevelData } from "./types";
import { fetchLevelByRouteId, fetchPublishedLevels } from "@/lib/supabase/queries";

const LS_CACHE_KEY = "brix_levels_v1";
const LS_CACHE_TTL = 5 * 60 * 1000; // 5 minutos

interface LsCache {
  levels: LevelData[];
  savedAt: number;
}

function readLsCache(): LevelData[] | null {
  try {
    const raw = localStorage.getItem(LS_CACHE_KEY);
    if (!raw) return null;
    const parsed: LsCache = JSON.parse(raw);
    if (Date.now() - parsed.savedAt > LS_CACHE_TTL) return null;
    return parsed.levels;
  } catch {
    return null;
  }
}

function writeLsCache(levels: LevelData[]) {
  try {
    const entry: LsCache = { levels, savedAt: Date.now() };
    localStorage.setItem(LS_CACHE_KEY, JSON.stringify(entry));
  } catch {
    // localStorage puede estar deshabilitado (modo privado estricto, etc.)
  }
}

function clearLsCache() {
  try {
    localStorage.removeItem(LS_CACHE_KEY);
  } catch {
    // ignore
  }
}

let publishedLevelsCache: LevelData[] | null = null;
let inFlightPublishedLevels: Promise<LevelData[]> | null = null;

/**
 * Carga los niveles publicados con estrategia stale-while-revalidate:
 * 1. Si hay caché en memoria → devuelve inmediatamente.
 * 2. Si hay caché en localStorage no expirado → devuelve inmediatamente
 *    Y lanza fetch en background para mantener el caché fresco.
 * 3. Si no hay caché válido → fetch normal, bloquea hasta tener datos.
 */
export async function loadPublicLevels(): Promise<LevelData[]> {
  // 1. Caché en memoria (más rápido, dentro de la misma sesión de página)
  if (publishedLevelsCache) return publishedLevelsCache;

  // 2. Caché localStorage (persiste entre recargas)
  const lsCached = readLsCache();
  if (lsCached) {
    publishedLevelsCache = lsCached;
    // Revalida en background sin bloquear al caller
    void revalidateInBackground();
    return lsCached;
  }

  // 3. Sin caché → fetch bloqueante
  if (inFlightPublishedLevels) return inFlightPublishedLevels;

  try {
    inFlightPublishedLevels = fetchPublishedLevels().then((levels) => {
      publishedLevelsCache = levels;
      writeLsCache(levels);
      return levels;
    });
    return await inFlightPublishedLevels;
  } catch {
    return [];
  } finally {
    inFlightPublishedLevels = null;
  }
}

async function revalidateInBackground() {
  if (inFlightPublishedLevels) return;
  try {
    inFlightPublishedLevels = fetchPublishedLevels().then((levels) => {
      publishedLevelsCache = levels;
      writeLsCache(levels);
      return levels;
    });
    await inFlightPublishedLevels;
  } catch {
    // silencioso: ya tenemos datos del caché, no hace falta propagar el error
  } finally {
    inFlightPublishedLevels = null;
  }
}

export async function loadPublicLevelByRouteId(routeId: string): Promise<LevelData | null> {
  try {
    const cachedLevels = await loadPublicLevels();
    const cachedLevel = cachedLevels.find((level) => level.id === routeId);
    if (cachedLevel) return cachedLevel;

    const remoteLevel = await fetchLevelByRouteId(routeId);
    if (remoteLevel) {
      publishedLevelsCache = upsertCachedLevel(remoteLevel);
    }
    return remoteLevel;
  } catch {
    return null;
  }
}

export function getNextLevel(levels: LevelData[], currentLevelId?: string | null): LevelData | null {
  if (!currentLevelId) return null;
  const currentIndex = levels.findIndex((level) => level.id === currentLevelId);
  if (currentIndex < 0 || currentIndex >= levels.length - 1) return null;
  return levels[currentIndex + 1];
}

export function invalidatePublicLevelsCache() {
  publishedLevelsCache = null;
  inFlightPublishedLevels = null;
  clearLsCache();
}

function upsertCachedLevel(level: LevelData): LevelData[] {
  const currentLevels = publishedLevelsCache ?? [];
  const exists = currentLevels.some((current) => current.id === level.id);
  const nextLevels = exists
    ? currentLevels.map((current) => (current.id === level.id ? level : current))
    : [...currentLevels, level];
  return nextLevels.sort((a, b) => a.order - b.order);
}

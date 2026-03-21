import { LevelData } from "./types";
import { fetchLevelByRouteId, fetchPublishedLevels } from "@/lib/supabase/queries";

let publishedLevelsCache: LevelData[] | null = null;
let inFlightPublishedLevels: Promise<LevelData[]> | null = null;

export async function loadPublicLevels(): Promise<LevelData[]> {
  if (publishedLevelsCache) return publishedLevelsCache;
  if (inFlightPublishedLevels) return inFlightPublishedLevels;

  try {
    inFlightPublishedLevels = fetchPublishedLevels().then((levels) => {
      publishedLevelsCache = levels;
      return levels;
    });
    return await inFlightPublishedLevels;
  } catch {
    return [];
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
}

function upsertCachedLevel(level: LevelData): LevelData[] {
  const currentLevels = publishedLevelsCache ?? [];
  const exists = currentLevels.some((current) => current.id === level.id);
  const nextLevels = exists
    ? currentLevels.map((current) => (current.id === level.id ? level : current))
    : [...currentLevels, level];
  return nextLevels.sort((a, b) => a.order - b.order);
}

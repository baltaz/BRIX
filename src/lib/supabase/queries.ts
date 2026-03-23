import { supabase } from "./client";
import { adminSupabase } from "./adminClient";
import { LevelData, GridTemplate } from "@/lib/game/types";

interface LevelRow {
  id: string;
  order: number;
  max_moves: number;
  grid: number[][];
  is_published: boolean;
  created_at: string;
}

interface RankingRow {
  rank_position: number;
  user_id: string | null;  // null para guests sin cuenta
  display_name: string;
  avatar_url: string | null;
  total_score: number;
  levels_completed: number;
}

interface ProfileRow {
  id: string;
  display_name: string;
  avatar_url: string | null;
  is_admin: boolean;
}

function rowToLevel(row: LevelRow): LevelData {
  return {
    id: row.id,
    order: row.order,
    maxMoves: row.max_moves,
    grid: row.grid as GridTemplate,
    isPublished: row.is_published,
  };
}

export async function fetchPublishedLevels(): Promise<LevelData[]> {
  const { data, error } = await supabase
    .from("levels")
    .select("*")
    .eq("is_published", true)
    .order("order", { ascending: true });

  if (error) throw error;
  return ((data ?? []) as LevelRow[]).map(rowToLevel);
}

export async function fetchLevelByRouteId(routeId: string): Promise<LevelData | null> {
  const { data, error } = await supabase
    .from("levels")
    .select("*")
    .eq("id", routeId)
    .eq("is_published", true)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return rowToLevel(data as LevelRow);
}

export async function saveGuestRun(params: {
  guestName: string;
  finalScore: number;
  levelsCompleted: number;
  lastLevelOrder?: number | null;
}) {
  const { error } = await supabase.from("game_runs").insert({
    guest_name: params.guestName,
    final_score: params.finalScore,
    levels_completed: params.levelsCompleted,
    last_level_order: params.lastLevelOrder ?? null,
  });
  if (error) throw error;
}

export async function fetchRankings(limit = 50): Promise<RankingRow[]> {
  const { data, error } = await supabase
    .from("rankings")
    .select("*")
    .order("total_score", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []) as RankingRow[];
}

export async function upsertOwnProfile(params: {
  id: string;
  displayName: string;
  avatarUrl?: string | null;
}) {
  const { error } = await supabase.from("profiles").upsert(
    {
      id: params.id,
      display_name: params.displayName,
      avatar_url: params.avatarUrl ?? null,
    },
    { onConflict: "id" }
  );
  if (error) throw error;
}

export async function fetchOwnProfile(userId: string): Promise<ProfileRow | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url, is_admin")
    .eq("id", userId)
    .maybeSingle();

  if (error) throw error;
  return (data as ProfileRow | null) ?? null;
}

export async function fetchAllLevelsAdmin(): Promise<LevelRow[]> {
  const { data, error } = await adminSupabase
    .from("levels")
    .select("*")
    .order("order", { ascending: true });

  if (error) throw error;
  return (data ?? []) as LevelRow[];
}

export async function supabaseUpsertLevel(params: {
  id?: string;
  order: number;
  max_moves: number;
  grid: number[][];
  is_published: boolean;
}): Promise<LevelRow> {
  if (params.id) {
    const { data, error } = await adminSupabase
      .from("levels")
      .update({
        order: params.order,
        max_moves: params.max_moves,
        grid: params.grid,
        is_published: params.is_published,
      })
      .eq("id", params.id)
      .select()
      .single();

    if (error) throw error;
    return data as LevelRow;
  }

  const { data, error } = await adminSupabase
    .from("levels")
    .insert({
      order: params.order,
      max_moves: params.max_moves,
      grid: params.grid,
      is_published: params.is_published,
    })
    .select()
    .single();

  if (error) throw error;
  return data as LevelRow;
}

export async function supabaseUpdateLevel(id: string, updates: Record<string, unknown>) {
  const { error } = await adminSupabase
    .from("levels")
    .update(updates)
    .eq("id", id);

  if (error) throw error;
}

export async function supabaseReorderLevels(items: Array<{ id: string; order: number }>) {
  for (const item of items) {
    const { error } = await adminSupabase
      .from("levels")
      .update({ order: item.order })
      .eq("id", item.id);

    if (error) throw error;
  }
}

export async function supabaseDeleteLevel(id: string) {
  const { error } = await adminSupabase
    .from("levels")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

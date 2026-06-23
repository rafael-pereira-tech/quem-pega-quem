import { supabase } from "./client";
import type { OfficialResult } from "../lib/buildInput";
import type { MatchCards } from "../engine/types";

interface OfficialRow {
  match_id: string;
  phase: "group" | "knockout";
  home_goals: number | null;
  away_goals: number | null;
  home_pens: number | null;
  away_pens: number | null;
  cards: Partial<Record<string, MatchCards>> | null;
  locked: boolean;
}

function rowToOfficial(r: OfficialRow): OfficialResult {
  return {
    matchId: r.match_id,
    phase: r.phase,
    homeGoals: r.home_goals,
    awayGoals: r.away_goals,
    homePens: r.home_pens,
    awayPens: r.away_pens,
    cards: r.cards,
    locked: r.locked,
  };
}

/** Lê todos os resultados oficiais. */
export async function fetchOfficial(): Promise<Record<string, OfficialResult>> {
  if (!supabase) return {};
  const { data, error } = await supabase.from("official_results").select("*");
  if (error) {
    console.error("fetchOfficial", error.message);
    return {};
  }
  const map: Record<string, OfficialResult> = {};
  for (const r of (data ?? []) as OfficialRow[]) map[r.match_id] = rowToOfficial(r);
  return map;
}

export interface UpsertOfficialInput {
  matchId: string;
  phase: "group" | "knockout";
  homeGoals: number | null;
  awayGoals: number | null;
  homePens?: number | null;
  awayPens?: number | null;
  cards?: Partial<Record<string, MatchCards>> | null;
  locked: boolean;
  userId: string;
}

/** Grava/atualiza um resultado oficial (só admin passa pela RLS). */
export async function upsertOfficial(input: UpsertOfficialInput): Promise<{ error: string | null }> {
  if (!supabase) return { error: "Supabase não configurado" };
  const { error } = await supabase.from("official_results").upsert({
    match_id: input.matchId,
    phase: input.phase,
    home_goals: input.homeGoals,
    away_goals: input.awayGoals,
    home_pens: input.homePens ?? null,
    away_pens: input.awayPens ?? null,
    cards: input.cards ?? null,
    locked: input.locked,
    updated_by: input.userId,
    updated_at: new Date().toISOString(),
  });
  return { error: error?.message ?? null };
}

/** Remove um resultado oficial (admin desfaz um lançamento). */
export async function deleteOfficial(matchId: string): Promise<{ error: string | null }> {
  if (!supabase) return { error: "Supabase não configurado" };
  const { error } = await supabase.from("official_results").delete().eq("match_id", matchId);
  return { error: error?.message ?? null };
}

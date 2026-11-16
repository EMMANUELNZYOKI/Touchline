import { supabase } from "./supabase";

export type MobilePlayer = {
  id: string;
  first_name: string;
  last_name: string;
  position: string | null;
  team_category: string | null;
  season: string | null;
  jersey_number: number | null;
  coachName: string;
  hasEvaluation: boolean;
};

export type MobileEvaluation = {
  id: string;
  player_id: string;
  season: string;
  season_year: number;
  overall_rating: number | null;
  strengths: string | null;
  development_goals: string | null;
  created_at: string;
  playerName: string;
  coachName: string;
};

export async function fetchMobilePlayers(academyId: string): Promise<MobilePlayer[]> {
  const [playersResult, profilesResult, evaluatedResult] = await Promise.all([
    supabase.from("players").select("id, first_name, last_name, position, team_category, season, jersey_number, coach_id").eq("academy_id", academyId).order("created_at", { ascending: false }),
    supabase.from("profiles").select("id, full_name"),
    supabase.rpc("get_evaluated_player_ids"),
  ]);
  if (playersResult.error) throw playersResult.error;
  if (profilesResult.error) throw profilesResult.error;
  if (evaluatedResult.error) throw evaluatedResult.error;
  const profiles = new Map((profilesResult.data ?? []).map((profile) => [profile.id, profile.full_name]));
  const evaluatedIds = new Set(((evaluatedResult.data ?? []) as Array<{ player_id: string }>).map((row) => row.player_id));
  return (playersResult.data ?? []).map((player) => ({ ...player, coachName: player.coach_id ? profiles.get(player.coach_id) ?? "Unknown coach" : "Not assigned", hasEvaluation: evaluatedIds.has(player.id) }));
}

export async function fetchMobileEvaluations(academyId: string): Promise<MobileEvaluation[]> {
  const [evaluationsResult, playersResult, profilesResult] = await Promise.all([
    supabase.from("player_evaluations").select("id, player_id, season, season_year, overall_rating, strengths, development_goals, created_at, coach_id").eq("academy_id", academyId).order("created_at", { ascending: false }),
    supabase.from("players").select("id, first_name, last_name").eq("academy_id", academyId),
    supabase.from("profiles").select("id, full_name"),
  ]);
  if (evaluationsResult.error) throw evaluationsResult.error;
  if (playersResult.error) throw playersResult.error;
  if (profilesResult.error) throw profilesResult.error;
  const players = new Map((playersResult.data ?? []).map((player) => [player.id, `${player.first_name} ${player.last_name}`]));
  const profiles = new Map((profilesResult.data ?? []).map((profile) => [profile.id, profile.full_name]));
  return (evaluationsResult.data ?? []).map((evaluation) => ({ ...evaluation, playerName: players.get(evaluation.player_id) ?? "Unknown player", coachName: profiles.get(evaluation.coach_id) ?? "Unknown coach" }));
}

export async function createMobilePlayer(input: { academy_id: string; first_name: string; last_name: string; team_category: string; season: string; position: string }) {
  const { data, error } = await supabase.from("players").insert({ academy_id: input.academy_id, first_name: input.first_name.trim(), last_name: input.last_name.trim(), team_category: input.team_category.trim() || null, season: input.season.trim() || null, position: input.position.trim() || null }).select("id").single();
  if (error) throw error;
  return data;
}

export async function createMobileEvaluation(input: { academy_id: string; player_id: string; season: string; season_year: number; overall_rating: number; strengths: string; development_goals: string }) {
  const { data: userResult, error: userError } = await supabase.auth.getUser();
  if (userError || !userResult.user) throw new Error("Sign in again before saving an evaluation.");
  const { data: player, error: playerError } = await supabase.from("players").select("id, academy_id, season").eq("id", input.player_id).eq("academy_id", input.academy_id).maybeSingle();
  if (playerError) throw playerError;
  if (!player) throw new Error("Choose a player from your active academy.");
  const { data, error } = await supabase.from("player_evaluations").insert({ player_id: input.player_id, coach_id: userResult.user.id, season: input.season.trim() || player.season || "UNSPECIFIED", season_year: input.season_year, overall_rating: input.overall_rating, strengths: input.strengths.trim() || null, development_goals: input.development_goals.trim() || null }).select("id").single();
  if (error) throw error;
  return data;
}

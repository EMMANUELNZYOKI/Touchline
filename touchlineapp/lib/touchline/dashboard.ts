import { supabase } from "./supabase";

export type DashboardMetrics = {
  players: number;
  coaches: number;
  managers: number;
  evaluations: number;
};

export type CoachDashboardData = {
  registeredPlayers: number;
  awaitingEvaluation: number;
  playersEvaluated: number;
  averageRating: number;
  addedThisMonth: number;
  recentPlayers: Array<{
    id: string;
    name: string;
    created_at: string;
    evaluated: boolean;
    rating: number | null;
  }>;
};

export async function loadCoachDashboardData(
  academyId: string,
  _coachId: string,
): Promise<CoachDashboardData> {
  const [{ data: players, error: playersError }, { data: evaluations, error: evaluationsError }] =
    await Promise.all([
      supabase
        .from("players")
        .select("id, first_name, last_name, created_at")
        .eq("academy_id", academyId)
        .order("created_at", { ascending: false }),
      supabase
        .from("player_evaluations")
        .select("player_id, overall_rating, created_at")
        .eq("academy_id", academyId)
        .order("created_at", { ascending: false }),
    ]);
  if (playersError) throw playersError;
  if (evaluationsError) throw evaluationsError;
  const latestByPlayer = new Map<string, number | null>();
  for (const evaluation of evaluations ?? []) {
    if (!latestByPlayer.has(evaluation.player_id)) latestByPlayer.set(evaluation.player_id, evaluation.overall_rating);
  }
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const ratings = [...latestByPlayer.values()].filter((rating): rating is number => typeof rating === "number");
  const recentPlayers = (players ?? []).slice(0, 8).map((player) => ({
    id: player.id,
    name: `${player.first_name} ${player.last_name}`.trim(),
    created_at: player.created_at,
    evaluated: latestByPlayer.has(player.id),
    rating: latestByPlayer.get(player.id) ?? null,
  }));
  return {
    registeredPlayers: players?.length ?? 0,
    awaitingEvaluation: Math.max(0, (players?.length ?? 0) - latestByPlayer.size),
    playersEvaluated: latestByPlayer.size,
    averageRating: ratings.length ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length : 0,
    addedThisMonth: (players ?? []).filter((player) => new Date(player.created_at).getTime() >= monthStart).length,
    recentPlayers,
  };
}

export async function loadDashboardMetrics(academyId: string): Promise<DashboardMetrics> {
  const [players, coaches, managers, evaluations] = await Promise.all([
    supabase
      .from("players")
      .select("id", { count: "exact", head: true })
      .eq("academy_id", academyId),
    supabase
      .from("academy_memberships")
      .select("user_id", { count: "exact", head: true })
      .eq("academy_id", academyId)
      .eq("role", "coach")
      .eq("status", "active"),
    supabase
      .from("academy_memberships")
      .select("user_id", { count: "exact", head: true })
      .eq("academy_id", academyId)
      .eq("role", "academy_manager")
      .eq("status", "active"),
    supabase
      .from("player_evaluations")
      .select("id", { count: "exact", head: true })
      .eq("academy_id", academyId),
  ]);

  const firstError = [players.error, coaches.error, managers.error, evaluations.error].find(
    Boolean,
  );
  if (firstError) throw firstError;

  return {
    players: players.count ?? 0,
    coaches: coaches.count ?? 0,
    managers: managers.count ?? 0,
    evaluations: evaluations.count ?? 0,
  };
}

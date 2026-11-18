import { supabase } from "./supabase";

export type DashboardMetrics = {
  players: number;
  coaches: number;
  managers: number;
  evaluations: number;
};

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

import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import type { Evaluation, Player, Profile } from "./types";
import { callTouchlineApi } from "./next-server-fn";
import { SKILL_CATEGORIES, averageScore, type SkillState } from "./skills";

// Storage bucket configuration
const BUCKET_NAME = process.env["NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET"] || "players";

export async function fetchMyRole(userId: string) {
  const { data, error } = await supabase
    .from("academy_memberships")
    .select("role")
    .eq("user_id", userId)
    .eq("status", "active")
    .maybeSingle();

  if (error) throw error;
  if (data?.role === "academy_admin") return "academy_admin" as const;
  if (data?.role === "academy_manager") return "academy_manager" as const;
  if (data?.role === "coach") return "coach" as const;
  return null;
}

export async function fetchMyProfile(userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error) throw error;
  return (data as Profile | null) ?? null;
}

async function fetchMyActiveAcademyAdminId() {
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) throw new Error("Sign in to an academy administrator account.");
  const { data, error } = await supabase
    .from("academy_memberships")
    .select("academy_id")
    .eq("user_id", authData.user.id)
    .in("role", ["academy_admin", "academy_manager"])
    .eq("status", "active")
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("No active academy administrator membership was found.");
  return data.academy_id;
}

export async function fetchMyAcademySubscription(userId: string) {
  const { data: membership, error: membershipError } = await supabase
    .from("academy_memberships")
    .select("academy_id")
    .eq("user_id", userId)
    .eq("status", "active")
    .maybeSingle();
  if (membershipError) throw membershipError;
  if (!membership) return null;

  const { data: subscription, error: subscriptionError } = await supabase
    .from("academy_subscriptions")
    .select("status, trial_ends_at")
    .eq("academy_id", membership.academy_id)
    .maybeSingle();
  if (subscriptionError) throw subscriptionError;
  return subscription;
}

export async function fetchMyAcademyProfile() {
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) throw new Error("Sign in to a Touchline account.");
  const { data: membership, error: membershipError } = await supabase
    .from("academy_memberships")
    .select("academy_id")
    .eq("user_id", authData.user.id)
    .eq("status", "active")
    .maybeSingle();
  if (membershipError) throw membershipError;
  if (!membership) throw new Error("No active academy membership was found.");
  const { data, error } = await supabase
    .from("academies")
    .select("id, name, logo_path")
    .eq("id", membership.academy_id)
    .single();
  if (error) throw error;
  return data;
}

export async function uploadAcademyLogo(userId: string, file: File) {
  const { data: membership, error: membershipError } = await supabase
    .from("academy_memberships")
    .select("academy_id, role")
    .eq("user_id", userId)
    .eq("role", "academy_admin")
    .eq("status", "active")
    .maybeSingle();
  if (membershipError) throw membershipError;
  if (!membership) throw new Error("An active academy administrator membership is required.");

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "png";
  const path = `${membership.academy_id}/logo.${ext}`;
  const { error: uploadError } = await supabase.storage.from("academy-assets").upload(path, file, {
    upsert: true,
    contentType: file.type,
  });
  if (uploadError) throw uploadError;

  const { error: updateError } = await supabase
    .from("academies")
    .update({ logo_path: path })
    .eq("id", membership.academy_id);
  if (updateError) throw updateError;
  return path;
}

export async function academyLogoUrl(path: string | null): Promise<string | null> {
  if (!path) return null;
  const { data, error } = await supabase.storage.from("academy-assets").createSignedUrl(path, 3600);
  if (error) throw error;
  return data.signedUrl ?? null;
}

export type AcademyEntitlements = {
  planKey: string;
  status: "trialing" | "active" | "past_due" | "canceled" | "paused";
  playerLimit: number | null;
  coachLimit: number | null;
  features: string[];
};

export async function fetchMyAcademyEntitlements(): Promise<AcademyEntitlements | null> {
  const academyId = await fetchMyActiveAcademyAdminId();
  const { data: subscription, error: subscriptionError } = await supabase
    .from("academy_subscriptions")
    .select("plan_key, status, trial_ends_at")
    .eq("academy_id", academyId)
    .maybeSingle();
  if (subscriptionError) throw subscriptionError;
  if (!subscription) return null;

  const { data: plan, error: planError } = await supabase
    .from("subscription_plans")
    .select("plan_key, player_limit, coach_limit, feature_flags")
    .eq("plan_key", subscription.plan_key)
    .maybeSingle();
  if (planError) throw planError;

  const trialActive =
    subscription.status === "trialing" &&
    Boolean(subscription.trial_ends_at) &&
    Date.parse(subscription.trial_ends_at!) > Date.now();
  return {
    planKey: subscription.plan_key,
    status: subscription.status,
    playerLimit: plan?.player_limit ?? null,
    coachLimit: plan?.coach_limit ?? null,
    features: subscription.status === "active" || trialActive ? (plan?.feature_flags ?? []) : [],
  };
}

export async function fetchCoaches() {
  const academyId = await fetchMyActiveAcademyAdminId();
  const { data: memberships, error: membershipError } = await supabase
    .from("academy_memberships")
    .select("user_id, status")
    .eq("academy_id", academyId)
    .eq("role", "coach");
  if (membershipError) throw membershipError;
  if (!memberships?.length) return [];

  const coachIds = memberships.map((membership) => membership.user_id);
  const [profilesRes, playersRes, evalsRes] = await Promise.all([
    supabase.from("profiles").select("*").in("id", coachIds).eq("role", "coach"),
    supabase.from("players").select("id, coach_id"),
    supabase.from("player_evaluations").select("id, coach_id, player_id"),
  ]);

  if (profilesRes.error) throw profilesRes.error;
  if (playersRes.error) throw playersRes.error;
  if (evalsRes.error) throw evalsRes.error;

  const players = playersRes.data ?? [];
  const evals = evalsRes.data ?? [];
  const statusByCoach = new Map(
    memberships.map((membership) => [membership.user_id, membership.status]),
  );

  return (profilesRes.data ?? []).map((p) => ({
    ...(p as Profile),
    is_active: statusByCoach.get(p.id) === "active",
    playerCount: players.filter((pl) => pl.coach_id === p.id).length,
    evaluationCount: evals.filter((e) => e.coach_id === p.id).length,
    evaluatedPlayerCount: new Set(evals.filter((e) => e.coach_id === p.id).map((e) => e.player_id))
      .size,
  }));
}

export interface AcademyManager {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  status: "active" | "suspended";
  created_at: string;
}

export function fetchAcademyManagers() {
  return callTouchlineApi<{ managers: AcademyManager[] }>("/api/admin/managers", "GET");
}

export async function fetchCoachProfile(coachId: string) {
  const academyId = await fetchMyActiveAcademyAdminId();
  const { data: membership, error: membershipError } = await supabase
    .from("academy_memberships")
    .select("status")
    .eq("academy_id", academyId)
    .eq("user_id", coachId)
    .eq("role", "coach")
    .maybeSingle();
  if (membershipError) throw membershipError;
  if (!membership) return null;

  const [profileRes, playersRes, evaluationsRes] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", coachId).eq("role", "coach").maybeSingle(),
    supabase
      .from("players")
      .select("id, first_name, last_name, position")
      .order("created_at", { ascending: false }),
    supabase
      .from("player_evaluations")
      .select("*")
      .eq("coach_id", coachId)
      .order("created_at", { ascending: false }),
  ]);

  if (profileRes.error) throw profileRes.error;
  if (playersRes.error) throw playersRes.error;
  if (evaluationsRes.error) throw evaluationsRes.error;
  if (!profileRes.data) return null;

  const players = (playersRes.data ?? []) as unknown as Player[];
  const evaluations = (evaluationsRes.data ?? []) as unknown as Evaluation[];
  const evaluatedPlayerIds = [...new Set(evaluations.map((evaluation) => evaluation.player_id))];
  const playerNames = new Map(
    players.map((player) => [player.id, `${player.first_name} ${player.last_name}`.trim()]),
  );

  return {
    coach: { ...(profileRes.data as Profile), is_active: membership.status === "active" },
    evaluatedPlayerIds,
    evaluatedPlayers: players.filter((player) => evaluatedPlayerIds.includes(player.id)),
    evaluations: evaluations.map((evaluation) => ({
      ...evaluation,
      playerName: playerNames.get(evaluation.player_id) ?? "Player no longer assigned",
    })),
  };
}

export async function updateCoachProfile(input: {
  id: string;
  full_name: string;
  phone: string | null;
}) {
  const { error } = await supabase
    .from("profiles")
    .update({ full_name: input.full_name, phone: input.phone })
    .eq("id", input.id);

  if (error) throw error;
}

export interface PlayerRow extends Player {
  evaluation: Evaluation | null;
  hasEvaluation: boolean;
  coachName: string;
}

export async function fetchPlayers(options?: { coachId?: string }) {
  let query = supabase.from("players").select("*").order("created_at", { ascending: false });
  if (options?.coachId) query = query.eq("coach_id", options.coachId);

  const [playersRes, evalsRes, profilesRes, evaluatedIdsRes] = await Promise.all([
    query,
    supabase.from("player_evaluations").select("*").order("created_at", { ascending: false }),
    supabase.from("profiles").select("id, full_name"),
    supabase.rpc("get_evaluated_player_ids"),
  ]);

  if (playersRes.error) throw playersRes.error;
  if (evaluatedIdsRes.error) throw evaluatedIdsRes.error;

  const evals = (evalsRes.data ?? []) as unknown as Evaluation[];
  const profiles = profilesRes.data ?? [];
  const evaluatedPlayerIds = new Set((evaluatedIdsRes.data ?? []).map((row) => row.player_id));

  return ((playersRes.data ?? []) as unknown as Player[]).map<PlayerRow>((player) => ({
    ...player,
    evaluation:
      evals.find(
        (e) =>
          e.player_id === player.id &&
          e.season === (player.season ?? "UNSPECIFIED") &&
          e.season_year === new Date().getFullYear(),
      ) ?? null,
    hasEvaluation: evaluatedPlayerIds.has(player.id),
    coachName: player.coach_id
      ? (profiles.find((p) => p.id === player.coach_id)?.full_name ?? "Unknown coach")
      : "Not assigned",
  }));
}

export async function fetchPlayer(playerId: string) {
  const [playerRes, evalRes, evaluatedIdsRes] = await Promise.all([
    supabase.from("players").select("*").eq("id", playerId).maybeSingle(),
    supabase
      .from("player_evaluations")
      .select("*")
      .eq("player_id", playerId)
      .order("created_at", { ascending: false }),
    supabase.rpc("get_evaluated_player_ids"),
  ]);

  if (playerRes.error) throw playerRes.error;
  if (evaluatedIdsRes.error) throw evaluatedIdsRes.error;
  if (!playerRes.data) return null;

  const player = playerRes.data as unknown as Player;
  const academyId = (playerRes.data as { academy_id?: string }).academy_id;
  const evaluations = (evalRes.data ?? []) as unknown as Evaluation[];
  const activeEvaluation =
    evaluations.find(
      (e) =>
        e.season === (player.season ?? "UNSPECIFIED") && e.season_year === new Date().getFullYear(),
    ) ?? null;
  const evaluationCoachId = activeEvaluation?.coach_id ?? evaluations[0]?.coach_id;
  const coachId = evaluationCoachId ?? player.coach_id;
  const [{ data: coach }, { data: academy }] = await Promise.all([
    coachId
      ? await supabase
          .from("profiles")
          .select("id, full_name, email")
          .eq("id", coachId)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    academyId
      ? supabase.from("academies").select("name, logo_path").eq("id", academyId).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  return {
    player,
    evaluations,
    evaluation: activeEvaluation,
    latestEvaluation: evaluations[0] ?? null,
    hasEvaluation: (evaluatedIdsRes.data ?? []).some((row) => row.player_id === playerId),
    coachName: coachId ? (coach?.full_name ?? "Unknown coach") : "Not assigned",
    coachEmail: coach?.email ?? "",
    academyName: academy?.name ?? "Academy",
    academyLogoPath: academy?.logo_path ?? null,
  };
}

export async function fetchEvaluations() {
  const [evalsRes, playersRes, profilesRes] = await Promise.all([
    supabase.from("player_evaluations").select("*").order("created_at", { ascending: false }),
    supabase.from("players").select("id, first_name, last_name, position"),
    supabase.from("profiles").select("id, full_name"),
  ]);

  if (evalsRes.error) throw evalsRes.error;

  const players = playersRes.data ?? [];
  const profiles = profilesRes.data ?? [];

  return ((evalsRes.data ?? []) as unknown as Evaluation[]).map((e) => {
    const player = players.find((p) => p.id === e.player_id);
    return {
      ...e,
      playerName: player ? `${player.first_name} ${player.last_name}` : "Unknown player",
      position: player?.position ?? "—",
      coachName: profiles.find((p) => p.id === e.coach_id)?.full_name ?? "Unknown coach",
    };
  });
}

export type PlayerInput = Omit<Player, "id" | "coach_id" | "created_at" | "updated_at">;

export function scoresFromSkills(skills: SkillState) {
  const technical_score = averageScore(skills.technical);
  const tactical_score = averageScore(skills.tactical);
  const physical_score = averageScore(skills.physical);
  const personality_score = averageScore(skills.personality);
  const overall_rating =
    Math.round(((technical_score + tactical_score + physical_score + personality_score) / 4) * 10) /
    10;

  return { technical_score, tactical_score, physical_score, personality_score, overall_rating };
}

export interface AssessmentInput {
  strengths: string;
  weaknesses: string;
  development_goals: string;
  coach_verdict: string;
  coach_notes: string;
}

export async function registerPlayer(input: { player: PlayerInput }) {
  const player = input.player;
  const payload = {
    first_name: player.first_name.trim(),
    last_name: player.last_name.trim(),
    date_of_birth: player.date_of_birth || null,
    gender: player.gender || null,
    season: player.season || null,
    team_category: player.team_category || null,
    phone: player.phone || null,
    parent_name: player.parent_name || null,
    parent_phone: player.parent_phone || null,
    emergency_contact: player.emergency_contact || null,
    position: player.position || null,
    secondary_position: player.secondary_position || null,
    preferred_foot: player.preferred_foot || null,
    jersey_number: player.jersey_number ? Number(player.jersey_number) : null,
    player_photo: player.player_photo || null,
    height: player.height ? Number(player.height) : null,
    weight: player.weight ? Number(player.weight) : null,
    medical_notes: player.medical_notes || null,
  };
  const { data, error } = await supabase.from("players").insert(payload).select("*").single();
  if (error) throw error;
  return data as unknown as Player;
}

export async function deletePlayer(playerId: string) {
  const { error } = await supabase.from("players").delete().eq("id", playerId);
  if (error) throw error;
}

export async function createPlayerWithEvaluation(input: {
  coachId: string;
  player: PlayerInput;
  skills: SkillState;
  assessment: AssessmentInput;
}) {
  const playerPayload = {
    first_name: input.player.first_name,
    last_name: input.player.last_name,
    date_of_birth: input.player.date_of_birth || null,
    gender: input.player.gender || null,
    season: input.player.season || null,
    team_category: input.player.team_category || null,
    phone: input.player.phone || null,
    parent_name: input.player.parent_name || null,
    parent_phone: input.player.parent_phone || null,
    emergency_contact: input.player.emergency_contact || null,
    position: input.player.position || null,
    preferred_foot: input.player.preferred_foot || null,
    jersey_number: input.player.jersey_number ? Number(input.player.jersey_number) : null,
    player_photo: input.player.player_photo || null,
    height: input.player.height ? Number(input.player.height) : null,
    weight: input.player.weight ? Number(input.player.weight) : null,
    medical_notes: input.player.medical_notes || null,
    coach_id: input.coachId,
  };

  const { data: player, error } = await supabase
    .from("players")
    .insert(playerPayload)
    .select("*")
    .single();

  if (error) throw error;

  const scores = scoresFromSkills(input.skills);
  const evalPayload = {
    player_id: player.id,
    coach_id: input.coachId,
    season: input.player.season || "UNSPECIFIED",
    season_year: new Date().getFullYear(),
    ...scores,
    technical_skills: input.skills.technical,
    tactical_skills: input.skills.tactical,
    physical_skills: input.skills.physical,
    personality_skills: input.skills.personality,
    strengths: input.assessment.strengths || null,
    weaknesses: input.assessment.weaknesses || null,
    development_goals: input.assessment.development_goals || null,
    coach_verdict: input.assessment.coach_verdict || null,
    coach_notes: input.assessment.coach_notes || null,
  };

  const { error: evalError } = await supabase.from("player_evaluations").insert(evalPayload);

  if (evalError) throw evalError;

  return player as unknown as Player;
}

export async function updatePlayer(playerId: string, player: Partial<PlayerInput>) {
  const { error } = await supabase.from("players").update(player).eq("id", playerId);
  if (error) throw error;
}

export type AdminActivityAction =
  "player_created" | "player_updated" | "player_deleted" | "coach_status_changed";

export interface AdminActivityLog {
  id: string;
  actor_id: string;
  action: AdminActivityAction;
  entity_type: "player" | "coach";
  entity_id: string;
  summary: string;
  metadata: Record<string, Json | undefined>;
  created_at: string;
}

export async function logAdminActivity(input: {
  action: AdminActivityAction;
  entityType: "player" | "coach";
  entityId: string;
  summary: string;
  metadata?: Record<string, Json | undefined>;
}) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("You must be signed in to record an admin action.");

  const { error } = await supabase.from("admin_activity_logs").insert({
    actor_id: user.id,
    action: input.action,
    entity_type: input.entityType,
    entity_id: input.entityId,
    summary: input.summary,
    metadata: input.metadata ?? {},
  });

  if (error) throw error;
}

export async function fetchAdminActivity() {
  const { data, error } = await supabase
    .from("admin_activity_logs")
    .select("id, actor_id, action, entity_type, entity_id, summary, metadata, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) throw error;
  return (data ?? []) as unknown as AdminActivityLog[];
}

export async function saveEvaluation(input: {
  evaluationId?: string;
  playerId: string;
  coachId: string;
  skills: SkillState;
  assessment: AssessmentInput;
}) {
  const scores = scoresFromSkills(input.skills);
  const payload = {
    player_id: input.playerId,
    coach_id: input.coachId,
    ...scores,
    technical_skills: input.skills.technical,
    tactical_skills: input.skills.tactical,
    physical_skills: input.skills.physical,
    personality_skills: input.skills.personality,
    strengths: input.assessment.strengths || null,
    weaknesses: input.assessment.weaknesses || null,
    development_goals: input.assessment.development_goals || null,
    coach_verdict: input.assessment.coach_verdict || null,
    coach_notes: input.assessment.coach_notes || null,
  };

  if (input.evaluationId) {
    const { error } = await supabase
      .from("player_evaluations")
      .update(payload)
      .eq("id", input.evaluationId);
    if (error) throw error;
    return;
  }

  const { data: player, error: playerError } = await supabase
    .from("players")
    .select("season")
    .eq("id", input.playerId)
    .single();
  if (playerError) throw playerError;

  const { error } = await supabase.from("player_evaluations").insert({
    ...payload,
    season: player.season || "UNSPECIFIED",
    season_year: new Date().getFullYear(),
  });
  if (error?.code === "23505") {
    throw new Error("This player has already been evaluated for this season.");
  }
  if (error) throw error;
}

export async function uploadPlayerPhoto(userId: string, file: File) {
  const { data: membership, error: membershipError } = await supabase
    .from("academy_memberships")
    .select("academy_id")
    .eq("user_id", userId)
    .eq("status", "active")
    .maybeSingle();
  if (membershipError) throw membershipError;
  if (!membership)
    throw new Error("An active academy membership is required to upload a player photo.");

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const path = `${membership.academy_id}/${userId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET_NAME).upload(path, file, {
    upsert: false,
    contentType: file.type,
  });

  if (error) throw error;
  return path;
}

export async function photoUrl(path: string | null): Promise<string | null> {
  if (!path) return null;

  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  const { data, error } = await supabase.storage.from(BUCKET_NAME).createSignedUrl(path, 3600);
  if (error) throw error;
  return data.signedUrl ?? null;
}

export function skillStateFromEvaluation(evaluation: Evaluation | null, fallback: SkillState) {
  if (!evaluation) return fallback;
  const next = { ...fallback };
  for (const category of SKILL_CATEGORIES) {
    const stored = (evaluation[category.column as keyof Evaluation] ?? {}) as Record<
      string,
      number
    >;
    next[category.key] = {
      ...fallback[category.key],
      ...Object.fromEntries(
        Object.entries(stored).filter(([, v]) => typeof v === "number") as [string, number][],
      ),
    };
  }
  return next;
}

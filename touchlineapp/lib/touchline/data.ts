import { supabase } from "./supabase";
import { mobileScoresFromSkills, type MobileAssessment, type MobileSkillState } from "./skills";

export type MobilePlayerInput = {
  first_name: string;
  last_name: string;
  date_of_birth: string | null;
  gender: string | null;
  season: string | null;
  team_category: string | null;
  phone: string | null;
  parent_name: string | null;
  parent_phone: string | null;
  emergency_contact: string | null;
  position: string | null;
  secondary_position: string | null;
  preferred_foot: string | null;
  jersey_number: number | null;
  player_photo: string | null;
  height: number | null;
  weight: number | null;
  medical_notes: string | null;
};

export type MobilePlayer = MobilePlayerInput & {
  id: string;
  academy_id: string;
  coach_id: string | null;
  created_at: string;
  updated_at: string;
  coachName: string;
  hasEvaluation: boolean;
};

export type MobileEvaluation = {
  id: string;
  player_id: string;
  coach_id: string;
  season: string;
  season_year: number;
  technical_score: number | null;
  tactical_score: number | null;
  physical_score: number | null;
  personality_score: number | null;
  overall_rating: number | null;
  technical_skills: Record<string, number> | null;
  tactical_skills: Record<string, number> | null;
  physical_skills: Record<string, number> | null;
  personality_skills: Record<string, number> | null;
  strengths: string | null;
  weaknesses: string | null;
  development_goals: string | null;
  coach_verdict: string | null;
  coach_notes: string | null;
  created_at: string;
  playerName: string;
  coachName: string;
};

function optionalText(value: string | null): string | null {
  const trimmed = value?.trim() ?? "";
  return trimmed || null;
}

function optionalNumber(value: number | null): number | null {
  return value == null || !Number.isFinite(value) ? null : value;
}

export async function updateMobileProfile(input: {
  id: string;
  full_name: string;
  phone: string | null;
}) {
  const fullName = input.full_name.trim();
  if (fullName.length < 2) throw new Error("Full name must contain at least 2 characters.");
  const { error } = await supabase
    .from("profiles")
    .update({ full_name: fullName, phone: optionalText(input.phone) })
    .eq("id", input.id);
  if (error) throw error;
}

function playerPayload(input: MobilePlayerInput) {
  return {
    first_name: input.first_name.trim(),
    last_name: input.last_name.trim(),
    date_of_birth: optionalText(input.date_of_birth),
    gender: optionalText(input.gender),
    season: optionalText(input.season),
    team_category: optionalText(input.team_category),
    phone: optionalText(input.phone),
    parent_name: optionalText(input.parent_name),
    parent_phone: optionalText(input.parent_phone),
    emergency_contact: optionalText(input.emergency_contact),
    position: optionalText(input.position),
    secondary_position: optionalText(input.secondary_position),
    preferred_foot: optionalText(input.preferred_foot),
    jersey_number: optionalNumber(input.jersey_number),
    player_photo: optionalText(input.player_photo),
    height: optionalNumber(input.height),
    weight: optionalNumber(input.weight),
    medical_notes: optionalText(input.medical_notes),
  };
}

async function tryLogPlayerActivity(input: {
  action: "player_created" | "player_updated";
  playerId: string;
  summary: string;
  metadata?: Record<string, unknown>;
}) {
  try {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!userData.user) return;
    const { error } = await supabase.from("admin_activity_logs").insert({
      actor_id: userData.user.id,
      action: input.action,
      entity_type: "player",
      entity_id: input.playerId,
      summary: input.summary,
      metadata: input.metadata ?? {},
    });
    if (error) throw error;
  } catch (error) {
    // A missing audit record must not turn a successful player save into a false failure.
    console.warn("Could not record player activity", error);
  }
}

export async function fetchMobilePlayers(
  academyId: string,
  options?: { coachId?: string },
): Promise<MobilePlayer[]> {
  let playerQuery = supabase
    .from("players")
    .select("*")
    .eq("academy_id", academyId)
    .order("created_at", { ascending: false });
  if (options?.coachId) playerQuery = playerQuery.eq("coach_id", options.coachId);
  const [playersResult, profilesResult, evaluationsResult] = await Promise.all([
    playerQuery,
    supabase.from("profiles").select("id, full_name"),
    supabase.from("player_evaluations").select("player_id").eq("academy_id", academyId),
  ]);
  if (playersResult.error) throw playersResult.error;
  if (profilesResult.error) throw profilesResult.error;
  if (evaluationsResult.error) throw evaluationsResult.error;
  const profiles = new Map(
    (profilesResult.data ?? []).map((profile) => [profile.id, profile.full_name]),
  );
  const evaluatedIds = new Set((evaluationsResult.data ?? []).map((row) => row.player_id));
  return (playersResult.data ?? []).map((player) => ({
    ...player,
    coachName: player.coach_id
      ? (profiles.get(player.coach_id) ?? "Unknown coach")
      : "Not assigned",
    hasEvaluation: evaluatedIds.has(player.id),
  })) as MobilePlayer[];
}

export async function fetchMobileEvaluations(academyId: string): Promise<MobileEvaluation[]> {
  const [evaluationsResult, playersResult, profilesResult] = await Promise.all([
    supabase
      .from("player_evaluations")
      .select("*")
      .eq("academy_id", academyId)
      .order("created_at", { ascending: false }),
    supabase.from("players").select("id, first_name, last_name").eq("academy_id", academyId),
    supabase.from("profiles").select("id, full_name"),
  ]);
  if (evaluationsResult.error) throw evaluationsResult.error;
  if (playersResult.error) throw playersResult.error;
  if (profilesResult.error) throw profilesResult.error;
  const players = new Map(
    (playersResult.data ?? []).map((player) => [
      player.id,
      `${player.first_name} ${player.last_name}`,
    ]),
  );
  const profiles = new Map(
    (profilesResult.data ?? []).map((profile) => [profile.id, profile.full_name]),
  );
  return (evaluationsResult.data ?? []).map((evaluation) => ({
    ...evaluation,
    playerName: players.get(evaluation.player_id) ?? "Unknown player",
    coachName: profiles.get(evaluation.coach_id) ?? "Unknown coach",
  })) as MobileEvaluation[];
}

export async function createMobilePlayer(input: { academyId: string; player: MobilePlayerInput }) {
  const payload = playerPayload(input.player);
  if (!payload.first_name || !payload.last_name) {
    throw new Error("First name and last name are required.");
  }
  const { data, error } = await supabase
    .from("players")
    .insert({ ...payload, academy_id: input.academyId })
    .select("*")
    .single();
  if (error) throw error;
  await tryLogPlayerActivity({
    action: "player_created",
    playerId: data.id,
    summary: `${data.first_name} ${data.last_name} registered`,
    metadata: { photoUploaded: Boolean(data.player_photo) },
  });
  return data as MobilePlayer;
}

export async function updateMobilePlayer(input: {
  academyId: string;
  playerId: string;
  player: MobilePlayerInput;
}) {
  const payload = playerPayload(input.player);
  if (!payload.first_name || !payload.last_name) {
    throw new Error("First name and last name are required.");
  }
  const { data, error } = await supabase
    .from("players")
    .update(payload)
    .eq("id", input.playerId)
    .eq("academy_id", input.academyId)
    .select("*")
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("Player could not be updated. Check your academy role and try again.");
  await tryLogPlayerActivity({
    action: "player_updated",
    playerId: input.playerId,
    summary: `${data.first_name} ${data.last_name} profile updated`,
    metadata: { mobile: true },
  });
  return data as MobilePlayer;
}

export async function createMobileEvaluation(input: {
  academy_id: string;
  player_id: string;
  evaluation_id?: string;
  skills: MobileSkillState;
  assessment: MobileAssessment;
}) {
  const { data: userResult, error: userError } = await supabase.auth.getUser();
  if (userError || !userResult.user) throw new Error("Sign in again before saving an evaluation.");
  const { data: player, error: playerError } = await supabase
    .from("players")
    .select("id, academy_id, season")
    .eq("id", input.player_id)
    .eq("academy_id", input.academy_id)
    .maybeSingle();
  if (playerError) throw playerError;
  if (!player) throw new Error("Choose a player from your active academy.");

  const scores = mobileScoresFromSkills(input.skills);
  const payload = {
    player_id: input.player_id,
    coach_id: userResult.user.id,
    ...scores,
    technical_skills: input.skills.technical,
    tactical_skills: input.skills.tactical,
    physical_skills: input.skills.physical,
    personality_skills: input.skills.personality,
    strengths: optionalText(input.assessment.strengths),
    weaknesses: optionalText(input.assessment.weaknesses),
    development_goals: optionalText(input.assessment.development_goals),
    coach_verdict: optionalText(input.assessment.coach_verdict),
    coach_notes: optionalText(input.assessment.coach_notes),
  };

  if (input.evaluation_id) {
    const { data, error } = await supabase
      .from("player_evaluations")
      .update(payload)
      .eq("id", input.evaluation_id)
      .eq("player_id", input.player_id)
      .eq("coach_id", userResult.user.id)
      .eq("academy_id", input.academy_id)
      .select("id")
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new Error("You can only update your own evaluation for this academy.");
    return data;
  }

  const season = player.season?.trim() || "UNSPECIFIED";
  const { data, error } = await supabase
    .from("player_evaluations")
    .insert({
      ...payload,
      season,
      season_year: new Date().getFullYear(),
    })
    .select("id")
    .single();
  if (error?.code === "23505") {
    throw new Error("This player already has an evaluation for this season and year.");
  }
  if (error) throw error;
  return data;
}

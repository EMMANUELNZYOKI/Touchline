import Constants from "expo-constants";

import { supabase } from "./supabase";

const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, string | undefined>;
const touchlineWebUrl = (extra.touchlineWebUrl ?? process.env.EXPO_PUBLIC_TOUCHLINE_WEB_URL ?? "https://touchlineelite.vercel.app").replace(/\/$/, "");

async function adminRequest<T>(path: string, method: string, body?: unknown): Promise<T> {
  const { data, error } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (error || !token) throw new Error("Sign in again to manage academy accounts.");
  const response = await fetch(`${touchlineWebUrl}${path}`, {
    method,
    headers: { Authorization: `Bearer ${token}`, ...(body === undefined ? {} : { "Content-Type": "application/json" }) },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const result = (await response.json().catch(() => ({}))) as T & { error?: string };
  if (!response.ok) throw new Error(result.error || "The academy action could not be completed.");
  return result;
}

export type MobileManager = { id: string; full_name: string; email: string; phone: string | null; status: "active" | "suspended"; created_at: string };
export type MobileCoach = { id: string; full_name: string; email: string; phone: string | null; status: "active" | "suspended"; playerCount: number; evaluationCount: number; created_at: string };

export async function fetchMobileManagers() {
  return adminRequest<{ managers: MobileManager[]; managerLimit: number | null }>("/api/admin/managers", "GET");
}

export function createMobileManager(input: { full_name: string; email: string; phone: string; password: string }) {
  return adminRequest<{ ok: true; managerId: string }>("/api/admin/managers", "POST", input);
}

export function setMobileManagerActive(managerId: string, isActive: boolean) {
  return adminRequest<{ ok: true }>(`/api/admin/managers/${encodeURIComponent(managerId)}`, "PATCH", { managerId, isActive });
}

export async function fetchMobileCoaches(): Promise<MobileCoach[]> {
  const [{ data: memberships, error: membershipError }, { data: profiles, error: profileError }, { data: players, error: playersError }, { data: evaluations, error: evaluationsError }] = await Promise.all([
    supabase.from("academy_memberships").select("user_id, status, created_at").eq("role", "coach"),
    supabase.from("profiles").select("id, full_name, email, phone"),
    supabase.from("players").select("coach_id"),
    supabase.from("player_evaluations").select("coach_id"),
  ]);
  const firstError = [membershipError, profileError, playersError, evaluationsError].find(Boolean);
  if (firstError) throw firstError;
  const profileMap = new Map((profiles ?? []).map((profile) => [profile.id, profile]));
  const playersByCoach = new Map<string, number>();
  const evaluationsByCoach = new Map<string, number>();
  for (const player of players ?? []) if (player.coach_id) playersByCoach.set(player.coach_id, (playersByCoach.get(player.coach_id) ?? 0) + 1);
  for (const evaluation of evaluations ?? []) if (evaluation.coach_id) evaluationsByCoach.set(evaluation.coach_id, (evaluationsByCoach.get(evaluation.coach_id) ?? 0) + 1);
  return (memberships ?? []).flatMap((membership) => {
    const profile = profileMap.get(membership.user_id);
    if (!profile) return [];
    return [{ id: profile.id, full_name: profile.full_name, email: profile.email, phone: profile.phone, status: membership.status === "active" ? "active" as const : "suspended" as const, playerCount: playersByCoach.get(profile.id) ?? 0, evaluationCount: evaluationsByCoach.get(profile.id) ?? 0, created_at: membership.created_at }];
  });
}

export function createMobileCoach(input: { full_name: string; email: string; phone: string; password: string }) {
  return adminRequest<{ ok: true; coachId: string }>("/api/admin/coaches", "POST", input);
}

export function setMobileCoachActive(coachId: string, isActive: boolean) {
  return adminRequest<{ ok: true }>(`/api/admin/coaches/${encodeURIComponent(coachId)}/status`, "PATCH", { coachId, isActive });
}

export function updateMobileCoach(input: { coachId: string; full_name: string; phone: string | null }) {
  return adminRequest<{ ok: true }>(`/api/admin/coaches/${encodeURIComponent(input.coachId)}`, "PATCH", input);
}

import Constants from "expo-constants";

import { supabase } from "./supabase";

const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, string | undefined>;
const touchlineWebUrl = (extra.touchlineWebUrl ?? process.env.EXPO_PUBLIC_TOUCHLINE_WEB_URL ?? "https://touchlineelite.vercel.app").replace(/\/$/, "");

export type PlatformAcademy = {
  academy_id: string;
  academy_name: string;
  slug: string;
  academy_status: "active" | "suspended";
  created_at: string;
  plan_key: string;
  subscription_status: "trialing" | "active" | "past_due" | "canceled" | "paused";
  trial_ends_at: string | null;
  current_period_end: string | null;
  player_count: number;
  evaluation_count: number;
  coach_count: number;
  academy_admin_count: number;
  manager_count: number;
};

type ApiResult<T> = T & { error?: string };

async function platformRequest<T>(path: string, method: string, body?: unknown): Promise<T> {
  const { data, error } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (error || !token) throw new Error("Sign in again to manage Touchline academies.");

  const response = await fetch(`${touchlineWebUrl}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body === undefined ? {} : { "Content-Type": "application/json" }),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const result = (await response.json().catch(() => ({}))) as ApiResult<T>;
  if (!response.ok) throw new Error(result.error || "The platform action could not be completed.");
  return result;
}

export async function fetchPlatformAcademies(): Promise<PlatformAcademy[]> {
  await claimInitialPlatformAdmin();
  const result = await platformRequest<{ academies?: PlatformAcademy[] }>("/api/platform/academies", "GET");
  return result.academies ?? [];
}

export function claimInitialPlatformAdmin() {
  return platformRequest<{ authorized: boolean }>("/api/platform/admin/claim", "POST", {});
}

export function updatePlatformAcademy(input: {
  academyId: string;
  academyStatus: "active" | "suspended";
  subscriptionStatus: PlatformAcademy["subscription_status"];
}) {
  return platformRequest<{ ok: true }>(`/api/platform/academies/${encodeURIComponent(input.academyId)}`, "PATCH", input);
}

export function deletePlatformAcademy(academyId: string) {
  return platformRequest<{ ok: true }>(`/api/platform/academies/${encodeURIComponent(academyId)}`, "DELETE");
}

export function changePlatformAcademyPackage(input: {
  academyId: string;
  planKey: "starter" | "standard" | "pro";
  reason: string;
}) {
  return platformRequest<{ ok: true }>(`/api/platform/academies/${encodeURIComponent(input.academyId)}/package`, "POST", {
    planKey: input.planKey,
    reason: input.reason,
  });
}

export function createPlatformAcademy(input: {
  name: string;
  slug: string;
  adminFullName: string;
  adminEmail: string;
  adminPhone: string;
}) {
  return platformRequest<{ academyId: string; administrator: { fullName: string; email: string; temporaryPassword: string } }>("/api/platform/academies", "POST", input);
}

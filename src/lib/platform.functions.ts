import { callTouchlineApi } from "@/lib/next-server-fn";

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
};

export function claimInitialPlatformAdmin() {
  return callTouchlineApi<{ authorized: boolean }>("/api/platform/admin/claim", "POST", {});
}

export async function getPlatformAcademies() {
  const result = await callTouchlineApi<{ academies: PlatformAcademy[] }>(
    "/api/platform/academies",
    "GET",
  );
  return result.academies;
}

export function updatePlatformAcademy({
  data,
}: {
  data: {
    academyId: string;
    academyStatus: "active" | "suspended";
    subscriptionStatus: "trialing" | "active" | "past_due" | "canceled" | "paused";
  };
}) {
  return callTouchlineApi<{ ok: true }>(
    `/api/platform/academies/${encodeURIComponent(data.academyId)}`,
    "PATCH",
    data,
  );
}

export function createPlatformAcademy({ data }: { data: { name: string; slug: string } }) {
  return callTouchlineApi<{ academyId: string }>("/api/platform/academies", "POST", data);
}

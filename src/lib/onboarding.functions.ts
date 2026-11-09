import { callTouchlineApi } from "@/lib/next-server-fn";

export function completeAcademyOnboarding() {
  return callTouchlineApi<{ ok: true; academyId: string }>("/api/onboarding/complete", "POST", {});
}

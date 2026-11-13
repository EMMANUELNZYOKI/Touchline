import { callTouchlineApi } from "@/lib/next-server-fn";

export interface CreateCoachInput {
  full_name: string;
  email: string;
  phone?: string;
  password: string;
}

export function createCoachAccount({ data }: { data: CreateCoachInput }) {
  return callTouchlineApi<{ ok: true; coachId: string }>("/api/admin/coaches", "POST", data);
}

export function setCoachActive({ data }: { data: { coachId: string; isActive: boolean } }) {
  return callTouchlineApi<{ ok: true }>(
    `/api/admin/coaches/${encodeURIComponent(data.coachId)}/status`,
    "PATCH",
    data,
  );
}

export function updateAcademyCoach({
  data,
}: {
  data: { coachId: string; full_name: string; phone: string | null };
}) {
  return callTouchlineApi<{ ok: true }>(
    `/api/admin/coaches/${encodeURIComponent(data.coachId)}`,
    "PATCH",
    data,
  );
}

export interface CreateManagerInput {
  full_name: string;
  email: string;
  phone?: string;
  password: string;
}

export function createAcademyManager({ data }: { data: CreateManagerInput }) {
  return callTouchlineApi<{ ok: true; managerId: string }>("/api/admin/managers", "POST", data);
}

export function setAcademyManagerActive({
  data,
}: {
  data: { managerId: string; isActive: boolean };
}) {
  return callTouchlineApi<{ ok: true }>(
    `/api/admin/managers/${encodeURIComponent(data.managerId)}`,
    "PATCH",
    data,
  );
}

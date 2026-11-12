import { supabase } from "@/integrations/supabase/client";

export async function callTouchlineApi<T>(
  path: string,
  method: "GET" | "POST" | "PATCH" | "DELETE",
  data?: unknown,
): Promise<T> {
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  const token = sessionData.session?.access_token;
  if (sessionError || !token) throw new Error("Sign in again to continue.");

  const response = await fetch(path, {
    method,
    cache: "no-store",
    headers: {
      Authorization: `Bearer ${token}`,
      ...(method === "GET" ? {} : { "Content-Type": "application/json" }),
    },
    ...(method === "GET" ? {} : { body: JSON.stringify(data ?? {}) }),
  });

  const result = (await response.json().catch(() => ({}))) as { error?: string } & T;
  if (!response.ok) throw new Error(result.error || "The request could not be completed.");
  return result;
}

/** Retains the old call-site shape while API work moves to App Router endpoints. */
export function useServerFn<T>(fn: T): T {
  return fn;
}

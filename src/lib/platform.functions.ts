import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type PlatformAdminDb = typeof import("@/integrations/supabase/client.server").supabaseAdmin;

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

async function assertPlatformAdmin(db: PlatformAdminDb, userId: string) {
  const { data, error } = await db
    .from("platform_admins")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw new Error("Could not verify Touchline platform permissions.");
  return Boolean(data);
}

/**
 * One-time, allowlisted claim for the first Touchline platform administrator.
 * The server gets the email from Supabase Auth; it never trusts an email
 * supplied by the browser. Configure TOUCHLINE_PLATFORM_ADMIN_EMAIL first.
 */
export const claimInitialPlatformAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const db = supabaseAdmin;
    if (await assertPlatformAdmin(db, context.userId)) return { authorized: true };

    const { count, error: countError } = await db
      .from("platform_admins")
      .select("user_id", { count: "exact", head: true });
    if (countError) throw new Error("Could not verify initial platform setup.");
    if ((count ?? 0) > 0) return { authorized: false };

    const allowlistedEmail = process.env["TOUCHLINE_PLATFORM_ADMIN_EMAIL"]?.trim().toLowerCase();
    if (!allowlistedEmail) {
      throw new Error(
        "Platform setup is incomplete. Configure TOUCHLINE_PLATFORM_ADMIN_EMAIL on the server first.",
      );
    }

    const { data: authResult, error: authError } = await supabaseAdmin.auth.admin.getUserById(
      context.userId,
    );
    const authUser = authResult?.user;
    if (authError || !authUser?.email || authUser.email.trim().toLowerCase() !== allowlistedEmail) {
      return { authorized: false };
    }

    const { data: existingProfile, error: profileReadError } = await db
      .from("profiles")
      .select("id")
      .eq("id", context.userId)
      .maybeSingle();
    if (profileReadError) throw new Error("Could not prepare the platform administrator profile.");
    if (!existingProfile) {
      const metadataName = authUser.user_metadata?.["full_name"];
      const fullName = typeof metadataName === "string" ? metadataName : authUser.email;
      const { error: profileInsertError } = await db.from("profiles").insert({
        id: context.userId,
        full_name: fullName,
        email: authUser.email,
        role: "coach",
        is_active: true,
      });
      if (profileInsertError)
        throw new Error("Could not create the platform administrator profile.");
    }

    const { error: insertError } = await db
      .from("platform_admins")
      .insert({ user_id: context.userId });
    if (insertError) {
      // Another first-admin attempt may have won the race; re-check this user.
      if (await assertPlatformAdmin(db, context.userId)) return { authorized: true };
      throw new Error("Could not provision the initial platform administrator.");
    }
    return { authorized: true };
  });

export const getPlatformAcademies = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const db = supabaseAdmin;
    if (!(await assertPlatformAdmin(db, context.userId))) {
      throw new Error("Only a Touchline platform administrator can view all academies.");
    }
    const { data, error } = await db.rpc("platform_academy_overview");
    if (error)
      throw new Error("Could not load academy overview. Confirm the tenant migration is applied.");
    return (data ?? []) as PlatformAcademy[];
  });

const updateAcademySchema = z.object({
  academyId: z.string().uuid(),
  academyStatus: z.enum(["active", "suspended"]),
  subscriptionStatus: z.enum(["trialing", "active", "past_due", "canceled", "paused"]),
});

export const updatePlatformAcademy = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(updateAcademySchema)
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const db = supabaseAdmin;
    if (!(await assertPlatformAdmin(db, context.userId))) {
      throw new Error("Only a Touchline platform administrator can change academy status.");
    }
    const { error } = await db.rpc("set_platform_academy_state", {
      p_academy_id: data.academyId,
      p_academy_status: data.academyStatus,
      p_subscription_status: data.subscriptionStatus,
    });
    if (error)
      throw new Error("Could not update academy status. Confirm the tenant migration is applied.");
    return { ok: true };
  });

const createAcademySchema = z.object({
  name: z.string().trim().min(2).max(160),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(1)
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and single hyphens."),
});

export const createPlatformAcademy = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(createAcademySchema)
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const db = supabaseAdmin;
    if (!(await assertPlatformAdmin(db, context.userId))) {
      throw new Error("Only a Touchline platform administrator can create academies.");
    }
    const { data: academyId, error } = await db.rpc("create_platform_academy", {
      p_name: data.name,
      p_slug: data.slug,
    });
    if (error) throw new Error("Could not create academy. The slug may already be in use.");
    return { academyId: academyId as string };
  });

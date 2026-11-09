import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type AcademyAdminDb = typeof import("@/integrations/supabase/client.server").supabaseAdmin;

const createCoachSchema = z.object({
  full_name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().max(40).optional().default(""),
  password: z.string().min(8).max(72),
});

async function requireAcademyAdmin(db: AcademyAdminDb, userId: string) {
  const { data, error } = await db
    .from("academy_memberships")
    .select("academy_id")
    .eq("user_id", userId)
    .eq("role", "academy_admin")
    .eq("status", "active")
    .maybeSingle();
  if (error || !data)
    throw new Error("Only an active academy administrator can perform this action.");
  return data.academy_id;
}

async function requireAcademyCoach(db: AcademyAdminDb, academyId: string, coachId: string) {
  const { data, error } = await db
    .from("academy_memberships")
    .select("user_id")
    .eq("academy_id", academyId)
    .eq("user_id", coachId)
    .eq("role", "coach")
    .maybeSingle();
  if (error || !data) throw new Error("This coach does not belong to your academy.");
}

/** Academy admins may provision a coach only inside their own active academy. */
export const createCoachAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(createCoachSchema)
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const academyId = await requireAcademyAdmin(supabaseAdmin, context.userId);

    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: { full_name: data.full_name, phone: data.phone },
    });
    if (error || !created.user)
      throw new Error(error?.message ?? "Could not create the coach account.");

    const userId = created.user.id;
    const { error: profileError } = await supabaseAdmin.from("profiles").upsert({
      id: userId,
      full_name: data.full_name,
      email: data.email,
      phone: data.phone || null,
      role: "coach",
      is_active: true,
    });
    if (profileError) {
      await supabaseAdmin.auth.admin.deleteUser(userId);
      throw new Error("Could not create the coach profile.");
    }

    const { error: membershipError } = await supabaseAdmin.from("academy_memberships").insert({
      academy_id: academyId,
      user_id: userId,
      role: "coach",
      status: "active",
    });
    if (membershipError) {
      await supabaseAdmin.auth.admin.deleteUser(userId);
      throw new Error("Could not add the coach to this academy.");
    }

    return { ok: true, coachId: userId };
  });

/** Changes only this academy's coach membership; the Auth account is not globally banned. */
export const setCoachActive = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(z.object({ coachId: z.string().uuid(), isActive: z.boolean() }))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const academyId = await requireAcademyAdmin(supabaseAdmin, context.userId);
    await requireAcademyCoach(supabaseAdmin, academyId, data.coachId);

    const { error } = await supabaseAdmin
      .from("academy_memberships")
      .update({ status: data.isActive ? "active" : "suspended" })
      .eq("academy_id", academyId)
      .eq("user_id", data.coachId);
    if (error) throw new Error("Could not update this coach's academy access.");

    const { data: coach } = await supabaseAdmin
      .from("profiles")
      .select("full_name")
      .eq("id", data.coachId)
      .maybeSingle();
    const { error: activityError } = await supabaseAdmin.from("admin_activity_logs").insert({
      academy_id: academyId,
      actor_id: context.userId,
      action: "coach_status_changed",
      entity_type: "coach",
      entity_id: data.coachId,
      summary: `${coach?.full_name ?? "Coach"} ${data.isActive ? "activated" : "deactivated"}`,
      metadata: { isActive: data.isActive },
    });
    if (activityError) console.error("Could not record coach status activity", activityError);

    return { ok: true };
  });

/** Edits coach details only after verifying the coach belongs to the caller's academy. */
export const updateAcademyCoach = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(
    z.object({
      coachId: z.string().uuid(),
      full_name: z.string().trim().min(2).max(120),
      phone: z.string().trim().max(40).nullable(),
    }),
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const academyId = await requireAcademyAdmin(supabaseAdmin, context.userId);
    await requireAcademyCoach(supabaseAdmin, academyId, data.coachId);

    const { error } = await supabaseAdmin
      .from("profiles")
      .update({ full_name: data.full_name, phone: data.phone })
      .eq("id", data.coachId);
    if (error) throw new Error("Could not update the coach profile.");
    return { ok: true };
  });

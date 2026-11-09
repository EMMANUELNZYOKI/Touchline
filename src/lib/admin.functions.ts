import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const createCoachSchema = z.object({
  full_name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().max(40).optional().default(""),
  password: z.string().min(8).max(72),
});

const bootstrapSchema = z.object({
  full_name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(255),
  password: z.string().min(8).max(72),
});

/** Public: tells the login screen whether the academy still needs its first Super Admin. */
export const superAdminExists = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { count, error } = await supabaseAdmin
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("role", "super_admin");

  if (error) throw new Error(error.message);
  return { exists: (count ?? 0) > 0 };
});

/** One-time secure bootstrap: only works while no Super Admin exists. */
export const bootstrapSuperAdmin = createServerFn({ method: "POST" })
  .validator(bootstrapSchema)
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // 1. Verify no Super Admin exists yet
    const { count } = await supabaseAdmin
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("role", "super_admin");

    if ((count ?? 0) > 0) throw new Error("A Super Admin already exists for this academy.");

    // 2. Create the user in Supabase Auth
    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: { full_name: data.full_name },
    });

    if (error || !created.user) throw new Error(error?.message ?? "Could not create the account.");

    const userId = created.user.id;

    // 3. Upsert profile directly with role = 'super_admin'
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .upsert({
        id: userId,
        full_name: data.full_name,
        email: data.email,
        role: "super_admin",
        is_active: true,
      });

    if (profileError) throw new Error(profileError.message);

    return { ok: true };
  });

/** Helper to assert Super Admin role directly against the profiles table. */
async function assertSuperAdmin(supabaseAdmin: any, userId: string) {
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();

  if (error || data?.role !== "super_admin") {
    throw new Error("Only a Super Admin can perform this action.");
  }
}

/** Super Admin only: creates the coach auth account + profile with role = 'coach'. */
export const createCoachAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(createCoachSchema)
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    
    // Verify requester is super_admin
    await assertSuperAdmin(supabaseAdmin, context.userId);

    // 1. Create coach user in Supabase Auth
    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: { full_name: data.full_name, phone: data.phone },
    });

    if (error || !created.user) throw new Error(error?.message ?? "Could not create the coach account.");

    const userId = created.user.id;

    // 2. Insert profile directly with role = 'coach'
    const { error: profileError } = await supabaseAdmin.from("profiles").upsert({
      id: userId,
      full_name: data.full_name,
      email: data.email,
      phone: data.phone || null,
      role: "coach",
      is_active: true,
    });

    if (profileError) throw new Error(profileError.message);

    return { ok: true, coachId: userId };
  });

/** Super Admin only: activates / deactivates a coach account. */
export const setCoachActive = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator(z.object({ coachId: z.string().uuid(), isActive: z.boolean() }))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    
    // Verify requester is super_admin
    await assertSuperAdmin(supabaseAdmin, context.userId);

    // 1. Update is_active flag in profiles table
    const { error } = await supabaseAdmin
      .from("profiles")
      .update({ is_active: data.isActive })
      .eq("id", data.coachId);

    if (error) throw new Error(error.message);

    // 2. Ban or unban user from signing in
    await supabaseAdmin.auth.admin.updateUserById(data.coachId, {
      ban_duration: data.isActive ? "none" : "876000h",
    });

    const { data: coach } = await supabaseAdmin
      .from("profiles")
      .select("full_name")
      .eq("id", data.coachId)
      .maybeSingle();
    const { error: activityError } = await supabaseAdmin.from("admin_activity_logs").insert({
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

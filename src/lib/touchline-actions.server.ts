import "server-only";

import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { ApiError, jsonResponse } from "@/lib/server/http";

const createCoachSchema = z.object({
  full_name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().max(40).optional().default(""),
  password: z.string().min(8).max(72),
});

const coachStatusSchema = z.object({
  coachId: z.string().uuid(),
  isActive: z.boolean(),
});

const updateCoachSchema = z.object({
  coachId: z.string().uuid(),
  full_name: z.string().trim().min(2).max(120),
  phone: z.string().trim().max(40).nullable(),
});

const updateAcademySchema = z.object({
  academyId: z.string().uuid(),
  academyStatus: z.enum(["active", "suspended"]),
  subscriptionStatus: z.enum(["trialing", "active", "past_due", "canceled", "paused"]),
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

const signupMetadataSchema = z.object({
  full_name: z.string().trim().min(2).max(120),
  phone: z.string().trim().max(40).optional().default(""),
  academy_name: z.string().trim().min(2).max(160),
  academy_slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(1)
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and hyphens."),
  touchline_onboard_pending: z.literal(true),
});

async function requireAcademyAdmin(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("academy_memberships")
    .select("academy_id")
    .eq("user_id", userId)
    .eq("role", "academy_admin")
    .eq("status", "active")
    .maybeSingle();
  if (error) throw new ApiError("Could not verify academy administrator access.", 500);
  if (!data)
    throw new ApiError("Only an active academy administrator can perform this action.", 403);

  const [{ data: academy, error: academyError }, { data: subscription, error: subscriptionError }] =
    await Promise.all([
      supabaseAdmin.from("academies").select("status").eq("id", data.academy_id).maybeSingle(),
      supabaseAdmin
        .from("academy_subscriptions")
        .select("status, trial_ends_at")
        .eq("academy_id", data.academy_id)
        .maybeSingle(),
    ]);
  if (academyError || subscriptionError)
    throw new ApiError("Could not verify academy subscription status.", 500);
  if (academy?.status !== "active")
    throw new ApiError("This academy workspace is suspended. Contact Touchline support.", 403);

  const canWrite =
    subscription?.status === "active" ||
    (subscription?.status === "trialing" &&
      Boolean(subscription.trial_ends_at) &&
      Date.parse(subscription.trial_ends_at!) > Date.now());
  if (!canWrite) {
    throw new ApiError(
      "This academy is in read-only mode because its trial ended or subscription is inactive. Contact Touchline to reactivate it.",
      403,
    );
  }
  return data.academy_id;
}

async function requireAcademyCoach(academyId: string, coachId: string) {
  const { data, error } = await supabaseAdmin
    .from("academy_memberships")
    .select("user_id")
    .eq("academy_id", academyId)
    .eq("user_id", coachId)
    .eq("role", "coach")
    .maybeSingle();
  if (error) throw new ApiError("Could not verify this coach's academy membership.", 500);
  if (!data) throw new ApiError("This coach does not belong to your academy.", 403);
}

async function assertPlatformAdmin(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("platform_admins")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw new ApiError("Could not verify Touchline platform permissions.", 500);
  if (!data)
    throw new ApiError("Only a Touchline platform administrator can perform this action.", 403);
}

async function completeAcademySignup(userId: string) {
  const { data: authResult, error: authError } = await supabaseAdmin.auth.admin.getUserById(userId);
  const user = authResult?.user;
  if (authError || !user?.email)
    throw new ApiError("Could not verify your Touchline account.", 400);
  if (!user.email_confirmed_at) {
    throw new ApiError("Confirm your email address before completing academy setup.", 400);
  }

  const { data: existing, error: membershipError } = await supabaseAdmin
    .from("academy_memberships")
    .select("academy_id, role, status")
    .eq("user_id", userId)
    .maybeSingle();
  if (membershipError) throw new ApiError("Could not check existing academy access.", 500);
  if (existing?.role === "academy_admin" && existing.status === "active") {
    return existing.academy_id;
  }
  if (existing) throw new ApiError("This account already belongs to an academy.", 409);

  let signup;
  try {
    signup = signupMetadataSchema.parse(user.user_metadata);
  } catch {
    throw new ApiError(
      "No complete academy signup was found for this account. Start again from the signup page.",
      400,
    );
  }

  const { data: academyId, error } = await supabaseAdmin.rpc("complete_academy_onboarding", {
    p_owner_user_id: userId,
    p_name: signup.academy_name,
    p_slug: signup.academy_slug,
    p_full_name: signup.full_name,
    p_email: user.email,
    p_phone: signup.phone || null,
  });
  if (error || !academyId) {
    if (/duplicate key|academies_slug_key|unique constraint/i.test(error?.message ?? "")) {
      throw new ApiError(
        "That academy URL is already in use. Sign up again with a different academy URL.",
        409,
      );
    }
    console.error("Academy onboarding RPC failed", error);
    throw new ApiError(
      "Could not create your academy. Please try again or contact Touchline support.",
      500,
    );
  }

  const { error: metadataError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
    user_metadata: {
      ...user.user_metadata,
      touchline_onboard_pending: false,
      touchline_academy_id: academyId,
    },
  });
  if (metadataError) console.error("Could not clear academy signup marker", metadataError);
  return academyId;
}

async function claimInitialPlatformAdmin(userId: string) {
  const { data: authResult, error: authError } = await supabaseAdmin.auth.admin.getUserById(userId);
  const authUser = authResult?.user;
  if (authError) throw new ApiError("Could not verify the platform administrator account.", 500);
  if (!authUser?.email)
    throw new ApiError("Could not verify the platform administrator account.", 401);
  if (!authUser.email_confirmed_at) {
    throw new ApiError(
      "Confirm the platform administrator email before claiming platform access.",
      403,
    );
  }

  const { data: existingAdmin, error: existingError } = await supabaseAdmin
    .from("platform_admins")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();
  if (existingError) throw new ApiError("Could not verify Touchline platform permissions.", 500);
  if (existingAdmin) return { authorized: true };

  const { count, error: countError } = await supabaseAdmin
    .from("platform_admins")
    .select("user_id", { count: "exact", head: true });
  if (countError) throw new ApiError("Could not verify initial platform setup.", 500);
  if ((count ?? 0) > 0) return { authorized: false };

  const allowlistedEmail = process.env["TOUCHLINE_PLATFORM_ADMIN_EMAIL"]?.trim().toLowerCase();
  if (!allowlistedEmail) {
    throw new ApiError(
      "Platform setup is incomplete. Configure TOUCHLINE_PLATFORM_ADMIN_EMAIL on the server first.",
      500,
    );
  }

  if (authUser.email.trim().toLowerCase() !== allowlistedEmail) {
    return { authorized: false };
  }

  const { data: existingProfile, error: profileReadError } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("id", userId)
    .maybeSingle();
  if (profileReadError)
    throw new ApiError("Could not prepare the platform administrator profile.", 500);
  if (!existingProfile) {
    const metadataName = authUser.user_metadata?.["full_name"];
    const fullName = typeof metadataName === "string" ? metadataName : authUser.email;
    const { error: profileInsertError } = await supabaseAdmin.from("profiles").insert({
      id: userId,
      full_name: fullName,
      email: authUser.email,
      role: "coach",
      is_active: true,
    });
    if (profileInsertError)
      throw new ApiError("Could not create the platform administrator profile.", 500);
  }

  const { error: insertError } = await supabaseAdmin
    .from("platform_admins")
    .insert({ user_id: userId });
  if (insertError) {
    const { data: racedAdmin } = await supabaseAdmin
      .from("platform_admins")
      .select("user_id")
      .eq("user_id", userId)
      .maybeSingle();
    if (racedAdmin) return { authorized: true };
    throw new ApiError("Could not provision the initial platform administrator.", 500);
  }
  return { authorized: true };
}

async function dispatch(request: Request, userId: string, body: unknown) {
  const { pathname } = new URL(request.url);
  const method = request.method.toUpperCase();
  const segments = pathname.split("/").filter(Boolean);

  if (segments.join("/") === "api/admin/coaches" && method === "POST") {
    const data = createCoachSchema.parse(body);
    const academyId = await requireAcademyAdmin(userId);
    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: { full_name: data.full_name, phone: data.phone },
    });
    if (error) {
      if (error.code === "email_exists" || /already (registered|exists)/i.test(error.message)) {
        throw new ApiError("An account with this email already exists.", 409);
      }
      console.error("Coach Auth account creation failed", error);
      throw new ApiError("Could not create the coach account.", 500);
    }
    if (!created.user) throw new ApiError("Could not create the coach account.", 500);

    const coachId = created.user.id;
    const { error: profileError } = await supabaseAdmin.from("profiles").upsert({
      id: coachId,
      full_name: data.full_name,
      email: data.email,
      phone: data.phone || null,
      role: "coach",
      is_active: true,
    });
    if (profileError) {
      await supabaseAdmin.auth.admin.deleteUser(coachId);
      throw new ApiError("Could not create the coach profile.", 500);
    }
    const { error: membershipError } = await supabaseAdmin.from("academy_memberships").insert({
      academy_id: academyId,
      user_id: coachId,
      role: "coach",
      status: "active",
    });
    if (membershipError) {
      await supabaseAdmin.auth.admin.deleteUser(coachId);
      throw new ApiError("Could not add the coach to this academy.", 500);
    }
    return { ok: true, coachId };
  }

  if (segments[1] === "admin" && segments[2] === "coaches" && segments[3] && method === "PATCH") {
    const coachId = segments[3];
    const academyId = await requireAcademyAdmin(userId);
    await requireAcademyCoach(academyId, coachId);
    if (segments[4] === "status") {
      const data = coachStatusSchema.parse(body);
      if (data.coachId !== coachId)
        throw new ApiError("Coach ID does not match the request path.", 400);
      const { error } = await supabaseAdmin
        .from("academy_memberships")
        .update({ status: data.isActive ? "active" : "suspended" })
        .eq("academy_id", academyId)
        .eq("user_id", coachId);
      if (error) throw new ApiError("Could not update this coach's academy access.", 500);
      const { data: coach } = await supabaseAdmin
        .from("profiles")
        .select("full_name")
        .eq("id", coachId)
        .maybeSingle();
      const { error: activityError } = await supabaseAdmin.from("admin_activity_logs").insert({
        academy_id: academyId,
        actor_id: userId,
        action: "coach_status_changed",
        entity_type: "coach",
        entity_id: coachId,
        summary: `${coach?.full_name ?? "Coach"} ${data.isActive ? "activated" : "deactivated"}`,
        metadata: { isActive: data.isActive },
      });
      if (activityError) console.error("Could not record coach status activity", activityError);
      return { ok: true };
    }
    const data = updateCoachSchema.parse(body);
    if (data.coachId !== coachId)
      throw new ApiError("Coach ID does not match the request path.", 400);
    const { error } = await supabaseAdmin
      .from("profiles")
      .update({ full_name: data.full_name, phone: data.phone })
      .eq("id", coachId);
    if (error) throw new ApiError("Could not update the coach profile.", 500);
    return { ok: true };
  }

  if (segments.join("/") === "api/onboarding/complete" && method === "POST") {
    const academyId = await completeAcademySignup(userId);
    return { ok: true, academyId };
  }

  if (segments.join("/") === "api/platform/admin/claim" && method === "POST") {
    return claimInitialPlatformAdmin(userId);
  }

  if (segments.join("/") === "api/platform/academies" && method === "GET") {
    await assertPlatformAdmin(userId);
    const { data, error } = await supabaseAdmin.rpc("platform_academy_overview");
    if (error)
      throw new ApiError(
        "Could not load academy overview. Confirm the tenant migration is applied.",
        500,
      );
    return { academies: data ?? [] };
  }

  if (segments.join("/") === "api/platform/academies" && method === "POST") {
    await assertPlatformAdmin(userId);
    const data = createAcademySchema.parse(body);
    const { data: academyId, error } = await supabaseAdmin.rpc("create_platform_academy", {
      p_name: data.name,
      p_slug: data.slug,
    });
    if (error) throw new ApiError("Could not create academy. The slug may already be in use.", 400);
    return { academyId };
  }

  if (
    segments[1] === "platform" &&
    segments[2] === "academies" &&
    segments[3] &&
    method === "PATCH"
  ) {
    await assertPlatformAdmin(userId);
    const data = updateAcademySchema.parse({ ...(body as object), academyId: segments[3] });
    const { error } = await supabaseAdmin.rpc("set_platform_academy_state", {
      p_academy_id: data.academyId,
      p_academy_status: data.academyStatus,
      p_subscription_status: data.subscriptionStatus,
    });
    if (error)
      throw new ApiError(
        "Could not update academy status. Confirm the tenant migration is applied.",
        500,
      );
    return { ok: true };
  }

  throw new ApiError("Not found.", 404);
}

export async function handleTouchlineApi(request: Request) {
  try {
    const { userId } = await requireSupabaseAuth(request);
    let body: unknown = {};
    if (request.method.toUpperCase() !== "GET") {
      try {
        body = await request.json();
      } catch {
        throw new ApiError("Request body must be valid JSON.", 400);
      }
    }
    const result = await dispatch(request, userId, body);
    return jsonResponse(result);
  } catch (error) {
    if (error instanceof ApiError) return jsonResponse({ error: error.message }, error.status);
    if (error instanceof z.ZodError) {
      return jsonResponse({ error: error.issues[0]?.message ?? "Invalid request." }, 400);
    }
    console.error("Touchline API request failed", error);
    return jsonResponse({ error: "The request could not be completed. Please try again." }, 500);
  }
}

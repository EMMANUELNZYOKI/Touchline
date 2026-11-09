import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type OnboardingDb = typeof import("@/integrations/supabase/client.server").supabaseAdmin;

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

async function completeSignup(db: OnboardingDb, userId: string) {
  const { data: authResult, error: authError } = await db.auth.admin.getUserById(userId);
  const user = authResult?.user;
  if (authError || !user?.email) throw new Error("Could not verify your Touchline account.");
  if (!user.email_confirmed_at) {
    throw new Error("Confirm your email address before completing academy setup.");
  }

  const { data: existing, error: membershipError } = await db
    .from("academy_memberships")
    .select("academy_id, role, status")
    .eq("user_id", userId)
    .maybeSingle();
  if (membershipError) throw new Error("Could not check existing academy access.");
  if (existing?.role === "academy_admin" && existing.status === "active") {
    return existing.academy_id;
  }
  if (existing) throw new Error("This account already belongs to an academy.");

  let signup;
  try {
    signup = signupMetadataSchema.parse(user.user_metadata);
  } catch {
    throw new Error(
      "No complete academy signup was found for this account. Start again from the signup page.",
    );
  }

  const { data: academyId, error } = await db.rpc("complete_academy_onboarding", {
    p_owner_user_id: userId,
    p_name: signup.academy_name,
    p_slug: signup.academy_slug,
    p_full_name: signup.full_name,
    p_email: user.email,
    p_phone: signup.phone || null,
  });

  if (error || !academyId) {
    if (/duplicate key|academies_slug_key|unique constraint/i.test(error?.message ?? "")) {
      throw new Error(
        "That academy URL is already in use. Sign up again with a different academy URL.",
      );
    }
    console.error("Academy onboarding RPC failed", error);
    throw new Error(
      "Could not create your academy. Please try again or contact Touchline support.",
    );
  }

  const { error: metadataError } = await db.auth.admin.updateUserById(userId, {
    user_metadata: {
      ...user.user_metadata,
      touchline_onboard_pending: false,
      touchline_academy_id: academyId,
    },
  });
  if (metadataError) console.error("Could not clear academy signup marker", metadataError);

  return academyId;
}

/** Completes self-service signup after Supabase confirms the email address. */
export const completeAcademyOnboarding = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const academyId = await completeSignup(supabaseAdmin, context.userId);
    return { ok: true, academyId };
  });

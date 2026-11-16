import type { Session } from "@supabase/supabase-js";

import { supabase } from "./supabase";

export type MobileRole = "academy_admin" | "academy_manager" | "coach" | "super_admin";

export type RoleExpectation = MobileRole | "any";

export type TouchlineContext = {
  session: Session;
  profile: {
    id: string;
    full_name: string;
    email: string;
    phone: string | null;
  };
  role: MobileRole;
  academy: {
    id: string;
    name: string;
    status: "active" | "suspended";
    logo_path: string | null;
  } | null;
  subscription: {
    status: "trialing" | "active" | "past_due" | "canceled" | "paused";
    plan_key: string;
    trial_ends_at: string | null;
    current_period_end: string | null;
  } | null;
};

export const ROLE_LABELS: Record<MobileRole, string> = {
  academy_admin: "Academy Owner",
  academy_manager: "Academy Manager",
  coach: "Coach",
  super_admin: "Super Admin",
};

export const ROLE_DESCRIPTIONS: Record<MobileRole, string> = {
  academy_admin: "Manage your academy, people, reports, and subscription.",
  academy_manager: "Run daily academy operations for your owner.",
  coach: "Work with players and record development evaluations.",
  super_admin: "Manage Touchline academies and platform operations.",
};

function toRole(value: string | null): MobileRole | null {
  if (value === "academy_admin" || value === "academy_manager" || value === "coach") return value;
  return null;
}

export async function loadTouchlineContext(session: Session): Promise<TouchlineContext> {
  const userId = session.user.id;
  const [{ data: profileRow, error: profileError }, { data: membership, error: membershipError }, { data: platformAdmin, error: platformError }] =
    await Promise.all([
      supabase.from("profiles").select("id, full_name, email, phone").eq("id", userId).maybeSingle(),
      supabase
        .from("academy_memberships")
        .select("academy_id, role, status")
        .eq("user_id", userId)
        .eq("status", "active")
        .maybeSingle(),
      supabase.from("platform_admins").select("user_id").eq("user_id", userId).maybeSingle(),
    ]);

  if (profileError) throw profileError;
  if (membershipError) throw membershipError;
  if (platformError && platformError.code !== "PGRST116") throw platformError;

  const profile = profileRow ??
    (platformAdmin
      ? {
          id: userId,
          full_name:
            typeof session.user.user_metadata?.full_name === "string"
              ? session.user.user_metadata.full_name
              : session.user.email?.split("@")[0] ?? "Platform Admin",
          email: session.user.email ?? "",
          phone: null,
        }
      : null);
  if (!profile) throw new Error("Your Touchline profile could not be found.");

  const role = platformAdmin ? "super_admin" : toRole(membership?.role ?? null);
  if (!role) throw new Error("This account has no active Touchline role or academy membership.");

  if (role === "super_admin") {
    return {
      session,
      profile,
      role,
      academy: null,
      subscription: null,
    };
  }

  if (!membership?.academy_id) throw new Error("This account has no active academy membership.");

  const [{ data: academy, error: academyError }, { data: subscription, error: subscriptionError }] =
    await Promise.all([
      supabase
        .from("academies")
        .select("id, name, status, logo_path")
        .eq("id", membership.academy_id)
        .maybeSingle(),
      supabase
        .from("academy_subscriptions")
        .select("status, plan_key, trial_ends_at, current_period_end")
        .eq("academy_id", membership.academy_id)
        .maybeSingle(),
    ]);

  if (academyError) throw academyError;
  if (subscriptionError) throw subscriptionError;
  if (!academy) throw new Error("Your academy workspace could not be found.");
  if (academy.status !== "active") {
    throw new Error(`The ${academy.name} workspace is currently suspended. Contact Touchline support or your platform administrator.`);
  }

  return {
    session,
    profile,
    role,
    academy,
    subscription,
  };
}

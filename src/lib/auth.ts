import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { fetchMyProfile, fetchMyRole } from "@/lib/api";
import { completeAcademyOnboarding } from "@/lib/onboarding.functions";
import type { AppRole, Profile } from "@/lib/types";

interface AuthState {
  loading: boolean;
  session: Session | null;
  profile: Profile | null;
  role: AppRole | null;
}

export function useAuth(): AuthState {
  const [state, setState] = useState<AuthState>({
    loading: true,
    session: null,
    profile: null,
    role: null,
  });

  useEffect(() => {
    let active = true;

    const load = async (session: Session | null) => {
      if (!session?.user) {
        if (active) setState({ loading: false, session: null, profile: null, role: null });
        return;
      }
      try {
        const [role, profile] = await Promise.all([
          fetchMyRole(session.user.id),
          fetchMyProfile(session.user.id),
        ]);
        if (active) setState({ loading: false, session, profile, role });
      } catch {
        if (active) setState({ loading: false, session, profile: null, role: null });
      }
    };

    supabase.auth.getSession().then(({ data }) => load(data.session));

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "TOKEN_REFRESHED") return;
      load(session);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return state;
}

export async function signInWithRoleCheck(
  email: string,
  password: string,
  expected: AppRole | "any",
) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message);
  const user = data.user;
  if (!user) throw new Error("Sign in failed.");

  let [role, profile] = await Promise.all([fetchMyRole(user.id), fetchMyProfile(user.id)]);

  // A confirmed academy owner may arrive here directly from the login page instead
  // of returning through /onboard?complete=1. Finish the server-side onboarding
  // transaction before rejecting the account for missing membership.
  if (
    !role &&
    expected === "academy_admin" &&
    user.user_metadata["touchline_onboard_pending"] === true
  ) {
    try {
      await completeAcademyOnboarding();
      [role, profile] = await Promise.all([fetchMyRole(user.id), fetchMyProfile(user.id)]);
    } catch (error) {
      console.error("Could not finish pending academy onboarding", error);
      await supabase.auth.signOut();
      throw new Error(
        "Your email is verified, but academy setup could not finish yet. Please return to the academy signup link and try again.",
      );
    }
  }

  if (!role) {
    await supabase.auth.signOut();
    throw new Error(
      "This account has no active academy membership. Contact your academy administrator.",
    );
  }
  if (expected === "academy_admin" && role !== "academy_admin" && role !== "academy_manager") {
    await supabase.auth.signOut();
    throw new Error("This account is not an academy administrator. Use the Coach Sign In page.");
  }
  return { role, profile };
}

export async function signOutCompletely() {
  await supabase.auth.signOut();
}

import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { fetchMyProfile, fetchMyRole } from "@/lib/api";
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

  const [role, profile] = await Promise.all([fetchMyRole(user.id), fetchMyProfile(user.id)]);

  if (!role) {
    await supabase.auth.signOut();
    throw new Error(
      "This account has no active academy membership. Contact your academy administrator.",
    );
  }
  if (expected === "academy_admin" && role !== "academy_admin") {
    await supabase.auth.signOut();
    throw new Error("This account is not an academy administrator. Use the Coach Sign In page.");
  }
  return { role, profile };
}

export async function signOutCompletely() {
  await supabase.auth.signOut();
}

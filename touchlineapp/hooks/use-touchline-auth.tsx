import type { Session } from "@supabase/supabase-js";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  loadTouchlineContext,
  type MobileRole,
  type RoleExpectation,
  type TouchlineContext,
} from "@/lib/touchline/context";
import { supabase } from "@/lib/touchline/supabase";

const AuthContext = createContext<TouchlineAuthState | null>(null);

type TouchlineAuthState = {
  loading: boolean;
  context: TouchlineContext | null;
  error: string | null;
  signIn: (email: string, password: string, expectedRole: RoleExpectation) => Promise<void>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
};

function messageForRole(role: MobileRole) {
  return role === "academy_admin"
    ? "Academy Owner"
    : role === "academy_manager"
      ? "Academy Manager"
      : role === "coach"
        ? "Coach"
        : "Super Admin";
}

export function TouchlineAuthProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [context, setContext] = useState<TouchlineContext | null>(null);
  const [error, setError] = useState<string | null>(null);
  const requestVersion = useRef(0);

  const loadSession = useCallback(async (session: Session | null) => {
    const version = requestVersion.current + 1;
    requestVersion.current = version;
    setLoading(true);
    setError(null);

    if (!session) {
      setContext(null);
      setLoading(false);
      return;
    }

    try {
      const nextContext = await loadTouchlineContext(session);
      setContext((current) => (version === requestVersion.current ? nextContext : current));
    } catch (cause) {
      if (version !== requestVersion.current) return;
      const message =
        cause instanceof Error ? cause.message : "Could not load your Touchline account.";
      setContext(null);
      setError(message);
    } finally {
      if (version === requestVersion.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data, error: sessionError }) => {
      if (!mounted) return;
      if (sessionError) setError(sessionError.message);
      void loadSession(data.session);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "TOKEN_REFRESHED") return;
      if (mounted) void loadSession(session);
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, [loadSession]);

  const signIn = useCallback(
    async (email: string, password: string, expectedRole: RoleExpectation) => {
      setLoading(true);
      setError(null);
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      if (signInError || !data.session) {
        setLoading(false);
        throw new Error(signInError?.message ?? "Sign in failed.");
      }

      try {
        const nextContext = await loadTouchlineContext(data.session);
        if (expectedRole !== "any" && nextContext.role !== expectedRole) {
          await supabase.auth.signOut();
          throw new Error(
            `This account is not a ${messageForRole(expectedRole)} account. Use the correct role login.`,
          );
        }
        setContext(nextContext);
      } catch (cause) {
        await supabase.auth.signOut();
        throw cause instanceof Error ? cause : new Error("Could not load your Touchline account.");
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const signOut = useCallback(async () => {
    try {
      // Clear the device session immediately; a failed network revocation
      // should never leave the user trapped inside the authenticated tabs.
      const { error: authError } = await supabase.auth.signOut({ scope: "local" });
      void authError;
    } catch (cause) {
      void cause;
    } finally {
      setContext(null);
      setError(null);
      setLoading(false);
    }
    // Local logout has completed even if the remote revocation request failed.
    // Do not rethrow here: the authenticated route guard will redirect to the
    // welcome screen, and an unhandled rejection would obscure that success.
  }, []);

  const refresh = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    await loadSession(data.session);
  }, [loadSession]);

  const value = useMemo(
    () => ({ loading, context, error, signIn, signOut, refresh }),
    [loading, context, error, signIn, signOut, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useTouchlineAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useTouchlineAuth must be used inside TouchlineAuthProvider");
  return value;
}

"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";
import { AuthShell } from "@/components/AuthShell";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/PasswordInput";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type RecoveryState = "checking" | "ready" | "invalid" | "updated";
type LoginPath = "/admin/login" | "/manager/login" | "/coach/login" | "/platform/login";

async function resolveLoginPath(): Promise<LoginPath> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return "/admin/login";

  const { data: memberships } = await supabase
    .from("academy_memberships")
    .select("role")
    .eq("user_id", user.id)
    .eq("status", "active");
  const roles = (memberships ?? []).map((membership) => membership.role);
  if (roles.includes("academy_admin")) return "/admin/login";
  if (roles.includes("academy_manager")) return "/manager/login";
  if (roles.includes("coach")) return "/coach/login";

  const profileRole = user.user_metadata?.touchline_role ?? user.user_metadata?.role;
  return profileRole === "super_admin" ? "/platform/login" : "/admin/login";
}

export default function ResetPasswordPage() {
  const [state, setState] = useState<RecoveryState>("checking");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [loginPath, setLoginPath] = useState<LoginPath>("/admin/login");

  useEffect(() => {
    let active = true;
    const hash = new URLSearchParams(window.location.hash.slice(1));
    if (hash.has("error") || hash.has("error_code")) {
      setState("invalid");
      return;
    }

    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;
      if (event === "PASSWORD_RECOVERY" && session) setState("ready");
      else if (session && (event === "SIGNED_IN" || event === "INITIAL_SESSION")) setState("ready");
    });

    void supabase.auth.getSession().then(({ data: sessionData }) => {
      if (active && sessionData.session) setState("ready");
      else if (active && !window.location.hash.includes("access_token=")) setState("invalid");
    });

    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  async function updatePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (password.length < 8) {
      toast.error("Your password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("The passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setLoginPath(await resolveLoginPath());
      setState("updated");
      toast.success("Password updated. You can now sign in.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update the password.");
    } finally {
      setLoading(false);
    }
  }

  const description =
    state === "invalid"
      ? "This recovery link is invalid or expired. Request a fresh recovery email."
      : state === "updated"
        ? "Your new password is saved. Use the correct role sign-in page below."
        : "Create a new password for your Touchline account. Your academy role and access remain unchanged.";

  return (
    <AuthShell
      badge="Account recovery"
      title={state === "updated" ? "Password updated" : "Choose a new password"}
      description={description}
      footer={
        <a
          className="text-primary hover:underline"
          href={state === "invalid" ? "/forgot-password" : loginPath}
        >
          {state === "invalid" ? "Request another recovery email" : "Return to sign in"}
        </a>
      }
    >
      {state === "checking" ? (
        <p className="text-muted-foreground flex items-center gap-2 text-sm">
          <Loader2 className="h-4 w-4 animate-spin" /> Verifying your recovery link…
        </p>
      ) : state === "ready" ? (
        <form className="grid gap-4" onSubmit={updatePassword}>
          <div className="grid gap-2">
            <Label htmlFor="new-password">New password</Label>
            <PasswordInput
              id="new-password"
              autoComplete="new-password"
              required
              minLength={8}
              maxLength={72}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="confirm-password">Confirm new password</Label>
            <PasswordInput
              id="confirm-password"
              autoComplete="new-password"
              required
              minLength={8}
              maxLength={72}
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
            />
          </div>
          <Button type="submit" className="h-12 tracking-widest uppercase" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Update password
          </Button>
        </form>
      ) : state === "updated" ? (
        <a
          className="bg-primary text-primary-foreground inline-flex h-12 items-center justify-center rounded-md px-4 text-sm font-semibold uppercase"
          href={loginPath}
        >
          Continue to sign in
        </a>
      ) : (
        <a className="text-primary hover:underline text-sm" href="/forgot-password">
          Request another recovery email
        </a>
      )}
    </AuthShell>
  );
}

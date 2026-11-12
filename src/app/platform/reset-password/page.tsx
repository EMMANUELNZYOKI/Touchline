"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";
import { AuthShell } from "@/components/AuthShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/PasswordInput";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type RecoveryState = "checking" | "ready" | "invalid" | "updated";

export default function PlatformResetPasswordPage() {
  const [state, setState] = useState<RecoveryState>("checking");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

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
    if (password !== confirmPassword) {
      toast.error("The passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setState("updated");
      toast.success("Password updated. You can now sign in.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update the password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      badge="Touchline platform"
      title={state === "updated" ? "Password updated" : "Choose a new password"}
      description={
        state === "invalid"
          ? "This recovery link is invalid or expired. Request a fresh email from the platform sign-in page."
          : "Use a new password for your platform administrator account."
      }
      footer={
        <a className="text-primary hover:underline" href="/platform/login">
          Return to platform sign in
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
            <Label htmlFor="password">New password</Label>
            <PasswordInput
              id="password"
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
        <p className="text-muted-foreground text-sm">
          Your new password is saved. Sign in with it from the platform login page.
        </p>
      ) : (
        <a className="text-primary hover:underline text-sm" href="/platform/forgot-password">
          Request another recovery email
        </a>
      )}
    </AuthShell>
  );
}

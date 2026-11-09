"use client";

import { useState } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { AuthShell } from "@/components/AuthShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function PlatformForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function sendRecoveryEmail(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    try {
      const redirectTo = `${window.location.origin}/platform/reset-password`;
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo });
      if (error) throw error;
      setSent(true);
      toast.success("If that account exists, a recovery email is on its way.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not send the recovery email.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      badge="Touchline platform"
      title="Reset your password"
      description={
        sent
          ? "Check your inbox for a secure password recovery link."
          : "Enter your platform administrator email and we’ll send a recovery link."
      }
      footer={
        <a className="text-primary hover:underline" href="/platform/login">
          Return to platform sign in
        </a>
      }
    >
      {sent ? (
        <p className="text-muted-foreground text-sm">
          For security, this page shows the same confirmation whether or not an account matches that
          email. Use the newest email link; older links expire when a new one is requested.
        </p>
      ) : (
        <form className="grid gap-4" onSubmit={sendRecoveryEmail}>
          <div className="grid gap-2">
            <Label htmlFor="email">Email address</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              maxLength={255}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
            />
          </div>
          <Button type="submit" className="h-12 tracking-widest uppercase" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Send recovery email
          </Button>
          <a
            className="text-muted-foreground hover:text-foreground inline-flex items-center justify-center gap-2 text-sm"
            href="/platform/login"
          >
            <ArrowLeft className="h-4 w-4" /> Back to sign in
          </a>
        </form>
      )}
    </AuthShell>
  );
}

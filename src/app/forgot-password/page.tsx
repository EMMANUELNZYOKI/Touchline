"use client";

import { useState, type FormEvent } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { AuthShell } from "@/components/AuthShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function sendRecoveryEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    try {
      const redirectTo = `${window.location.origin}/reset-password`;
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
      badge="Account recovery"
      title="Reset your password"
      description={
        sent
          ? "Check your inbox for a secure recovery link."
          : "Enter the email used for your Touchline account and we will send a secure recovery link."
      }
      footer={
        <span>
          Remembered your password?{" "}
          <a className="text-primary hover:underline" href="/">
            Return to sign in choices
          </a>
        </span>
      }
    >
      {sent ? (
        <div className="grid gap-4">
          <p className="text-muted-foreground text-sm">
            For security, Touchline shows the same confirmation whether or not an account matches
            that email. Use the newest recovery email; older links expire when a new one is
            requested.
          </p>
          <a
            className="text-primary hover:text-primary/80 inline-flex items-center justify-center gap-2 text-sm font-medium hover:underline"
            href="/"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Touchline
          </a>
        </div>
      ) : (
        <form className="grid gap-4" onSubmit={sendRecoveryEmail}>
          <div className="grid gap-2">
            <Label htmlFor="recovery-email">Email address</Label>
            <Input
              id="recovery-email"
              type="email"
              autoComplete="email"
              required
              maxLength={255}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@academy.example"
            />
          </div>
          <Button type="submit" className="h-12 tracking-widest uppercase" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Send recovery email
          </Button>
        </form>
      )}
    </AuthShell>
  );
}

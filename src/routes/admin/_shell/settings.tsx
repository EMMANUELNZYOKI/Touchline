"use client";
import { createFileRoute } from "@/lib/next-router-compat";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { getBilling, startBillingCheckout, type BillingResponse } from "@/lib/billing.functions";

export const Route = createFileRoute("/admin/_shell/settings")({
  head: () => ({ meta: [{ title: "Settings | Touchline" }] }),
  component: AdminSettingsPage,
});

function AdminSettingsPage() {
  const { profile } = useAuth();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [billing, setBilling] = useState<BillingResponse | null>(null);
  const [billingLoading, setBillingLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  useEffect(() => {
    void getBilling()
      .then(setBilling)
      .catch((error: Error) => toast.error(error.message))
      .finally(() => setBillingLoading(false));
  }, []);

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      toast.error("Passwords do not match.");
      return;
    }
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setPassword("");
    setConfirm("");
    toast.success("Password updated.");
  };

  const startCheckout = async () => {
    setCheckoutLoading(true);
    try {
      const result = await startBillingCheckout();
      window.location.assign(result.link);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not start checkout.");
      setCheckoutLoading(false);
    }
  };

  const subscription = billing?.subscription;
  const trialEnds = subscription?.trial_ends_at ? new Date(subscription.trial_ends_at) : null;
  const isActive = subscription?.status === "active";
  const trialActive = subscription?.status === "trialing" && trialEnds && trialEnds > new Date();

  return (
    <div className="mx-auto grid max-w-3xl gap-6">
      <div>
        <h1 className="font-display text-2xl tracking-wide uppercase">Settings</h1>
        <p className="text-muted-foreground text-sm">
          Manage your academy account and subscription.
        </p>
      </div>
      <Card className="border-border/70">
        <CardHeader>
          <CardTitle className="font-display text-base tracking-wide uppercase">
            Subscription
          </CardTitle>
          <CardDescription>
            Secure checkout is hosted by Flutterwave. Touchline activates access only after server
            verification.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          {billingLoading ? (
            <div className="text-muted-foreground text-sm">Loading billing status…</div>
          ) : (
            <>
              <div className="flex items-start justify-between gap-4 rounded-lg border border-border/70 p-4">
                <div>
                  <p className="font-medium">
                    {isActive
                      ? "Active subscription"
                      : trialActive
                        ? "14-day starter trial"
                        : "Subscription inactive"}
                  </p>
                  <p className="text-muted-foreground mt-1 text-sm">
                    {isActive && subscription?.current_period_end
                      ? `Current period ends ${new Date(subscription.current_period_end).toLocaleDateString()}.`
                      : trialActive && trialEnds
                        ? `Trial ends ${trialEnds.toLocaleDateString()}.`
                        : "Start checkout to activate your academy workspace."}
                  </p>
                </div>
                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide">
                  {subscription?.status ?? "unknown"}
                </span>
              </div>
              {!isActive && (
                <Button
                  onClick={startCheckout}
                  disabled={checkoutLoading}
                  className="w-full sm:w-fit"
                >
                  {checkoutLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Continue to secure checkout
                </Button>
              )}
              <div className="text-muted-foreground flex items-center gap-2 text-xs">
                <ShieldCheck className="h-4 w-4" /> Payment details are entered on Flutterwave and
                are never stored by Touchline.
              </div>
              {billing?.payments.length ? (
                <div className="grid gap-2">
                  <p className="font-display text-xs tracking-wide uppercase">
                    Recent payment attempts
                  </p>
                  {billing.payments.map((payment) => (
                    <div
                      key={payment.tx_ref}
                      className="flex items-center justify-between gap-4 border-b border-border/50 py-2 text-sm last:border-0"
                    >
                      <span className="text-muted-foreground">
                        {new Date(payment.created_at).toLocaleDateString()}
                      </span>
                      <span>
                        {payment.currency} {Number(payment.amount).toLocaleString()}
                      </span>
                      <span className="capitalize">{payment.status}</span>
                    </div>
                  ))}
                </div>
              ) : null}
            </>
          )}
        </CardContent>
      </Card>
      <Card className="border-border/70">
        <CardHeader>
          <CardTitle className="font-display text-base tracking-wide uppercase">Account</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label>Full name</Label>
            <Input value={profile?.full_name ?? ""} disabled />
          </div>
          <div className="grid gap-2">
            <Label>Email</Label>
            <Input value={profile?.email ?? ""} disabled />
          </div>
        </CardContent>
      </Card>
      <Card className="border-border/70">
        <CardHeader>
          <CardTitle className="font-display text-base tracking-wide uppercase">
            Change password
          </CardTitle>
          <CardDescription>Use at least 8 characters.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4" onSubmit={changePassword}>
            <div className="grid gap-2">
              <Label htmlFor="new-password">New password</Label>
              <Input
                id="new-password"
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="confirm-password">Confirm password</Label>
              <Input
                id="confirm-password"
                type="password"
                required
                minLength={8}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
              />
            </div>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Update password
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
export default Route.component;

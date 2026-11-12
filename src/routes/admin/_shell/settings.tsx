"use client";
import { createFileRoute } from "@/lib/next-router-compat";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Check, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import {
  getBilling,
  startBillingCheckout,
  startMpesaCheckout,
  type BillingResponse,
} from "@/lib/billing.functions";

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
  const [mpesaLoading, setMpesaLoading] = useState(false);
  const [mpesaPhone, setMpesaPhone] = useState("");
  const [paymentMessage, setPaymentMessage] = useState("");
  const [selectedPlan, setSelectedPlan] = useState("");

  useEffect(() => {
    setMpesaPhone(profile?.phone ?? "");
  }, [profile?.phone]);

  useEffect(() => {
    void getBilling()
      .then((result) => {
        setBilling(result);
        setSelectedPlan(result.subscription?.plan_key ?? result.plans[0]?.plan_key ?? "");
      })
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

  const startMpesa = async () => {
    if (!selectedPlan || !mpesaPhone.trim()) {
      toast.error("Enter the Safaricom number that should receive the M-Pesa prompt.");
      return;
    }
    setMpesaLoading(true);
    setPaymentMessage("");
    try {
      const result = await startMpesaCheckout(selectedPlan, mpesaPhone);
      toast.success("Opening Paystack M-Pesa checkout");
      window.location.assign(result.link);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not send the M-Pesa prompt.");
      setMpesaLoading(false);
    }
  };

  const startCheckout = async () => {
    if (!selectedPlan) return;
    setCheckoutLoading(true);
    try {
      const result = await startBillingCheckout(selectedPlan);
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
  const selectedPlanDetails = billing?.plans.find((plan) => plan.plan_key === selectedPlan);
  const currentPlan = billing?.plans.find((plan) => plan.plan_key === subscription?.plan_key);
  const checkoutDisabled =
    checkoutLoading || !selectedPlan || (isActive && selectedPlan === subscription?.plan_key);

  return (
    <div className="mx-auto grid max-w-5xl gap-6">
      <div>
        <h1 className="font-display text-2xl tracking-wide uppercase">Settings</h1>
        <p className="text-muted-foreground text-sm">
          Manage your academy account, package, and subscription.
        </p>
      </div>
      <Card className="border-border/70">
        <CardHeader>
          <CardTitle className="font-display text-base tracking-wide uppercase">
            {isActive ? "Your package" : "Choose a package"}
          </CardTitle>
          <CardDescription>
            {isActive && subscription?.current_period_end
              ? `${currentPlan?.name ?? "Current package"} renews around ${new Date(subscription.current_period_end).toLocaleDateString()}. You can change package before your next checkout.`
              : trialActive && trialEnds
                ? `Your trial is active until ${trialEnds.toLocaleDateString()}. Choose a package now; checkout becomes available when the trial ends.`
                : "Select the package that fits your academy. Paystack supports M-Pesa and card checkout."}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5">
          {billingLoading ? (
            <div className="text-muted-foreground text-sm">Loading packages…</div>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-3">
                {(billing?.plans ?? []).map((plan) => {
                  const selected = selectedPlan === plan.plan_key;
                  const current = subscription?.plan_key === plan.plan_key;
                  return (
                    <button
                      key={plan.plan_key}
                      type="button"
                      onClick={() => setSelectedPlan(plan.plan_key)}
                      className={`relative grid gap-4 rounded-xl border p-5 text-left transition ${selected ? "border-primary bg-primary/5 shadow-sm" : "border-border/70 hover:border-primary/50"}`}
                    >
                      {current && (
                        <span className="absolute right-4 top-4 rounded-full bg-primary/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide">
                          Current
                        </span>
                      )}
                      <div>
                        <p className="font-display text-lg tracking-wide uppercase">{plan.name}</p>
                        <p className="text-muted-foreground mt-1 text-sm">{plan.description}</p>
                      </div>
                      <p className="text-2xl font-semibold">
                        {plan.currency} {Number(plan.amount).toLocaleString()}
                        <span className="text-muted-foreground text-xs font-normal"> / month</span>
                      </p>
                      <ul className="text-muted-foreground grid gap-2 text-sm">
                        {plan.feature_summary.map((feature) => (
                          <li key={feature} className="flex items-start gap-2">
                            <Check className="text-primary mt-0.5 h-4 w-4 shrink-0" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </button>
                  );
                })}
              </div>
              <div className="grid gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4">
                <div>
                  <p className="font-semibold">Fast checkout with M-Pesa</p>
                  <p className="text-muted-foreground text-xs">
                    Enter a Safaricom number and approve the prompt with your M-Pesa PIN.
                  </p>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Input
                    value={mpesaPhone}
                    onChange={(event) => setMpesaPhone(event.target.value)}
                    placeholder="0712 345 678"
                    inputMode="tel"
                    aria-label="Safaricom M-Pesa phone number"
                    disabled={mpesaLoading}
                  />
                  <Button
                    onClick={startMpesa}
                    disabled={checkoutDisabled || mpesaLoading}
                    className="sm:w-auto"
                  >
                    {mpesaLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isActive ? "Change with M-Pesa" : "Pay with M-Pesa"}
                  </Button>
                </div>
                {paymentMessage && (
                  <p role="status" className="text-sm">
                    {paymentMessage}
                  </p>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  onClick={startCheckout}
                  disabled={checkoutDisabled || checkoutLoading}
                  variant="outline"
                  className="w-full sm:w-fit"
                >
                  {checkoutLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Pay by card or other method
                </Button>
                {selectedPlanDetails && (
                  <span className="text-muted-foreground text-sm">
                    Selected: {selectedPlanDetails.name} · {selectedPlanDetails.currency}{" "}
                    {Number(selectedPlanDetails.amount).toLocaleString()} / month
                  </span>
                )}
              </div>
              {trialActive && (
                <p className="text-muted-foreground text-xs">
                  You can choose and subscribe to a package during your trial. Your paid package
                  will activate after Paystack confirms payment.
                </p>
              )}
              <div className="text-muted-foreground flex items-center gap-2 text-xs">
                <ShieldCheck className="h-4 w-4" /> Payment details are entered on Paystack and are
                never stored by Touchline.
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
                        {payment.plan_key} · {payment.currency}{" "}
                        {Number(payment.amount).toLocaleString()}
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

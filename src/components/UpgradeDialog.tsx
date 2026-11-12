"use client";

import { useEffect, useState } from "react";
import { Check, Loader2, ShieldCheck, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  getBilling,
  startBillingCheckout,
  startMpesaCheckout,
  type BillingPlan,
  type BillingResponse,
} from "@/lib/billing.functions";
import type { Profile } from "@/lib/types";

type UpgradeDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: Profile | null;
};

function formatAmount(plan: BillingPlan) {
  return `${plan.currency} ${Number(plan.amount).toLocaleString()}`;
}

export function UpgradeDialog({ open, onOpenChange, profile }: UpgradeDialogProps) {
  const [billing, setBilling] = useState<BillingResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState("");
  const [mpesaPhone, setMpesaPhone] = useState(profile?.phone ?? "");
  const [mpesaLoading, setMpesaLoading] = useState(false);
  const [cardLoading, setCardLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [mpesaPromptOpen, setMpesaPromptOpen] = useState(false);

  useEffect(() => {
    setMpesaPhone(profile?.phone ?? "");
  }, [profile?.phone]);

  useEffect(() => {
    if (!open) return;
    setMessage("");
    setMpesaPromptOpen(false);
    setLoading(true);
    void getBilling()
      .then((result) => {
        setBilling(result);
        setSelectedPlan(result.subscription?.plan_key ?? result.plans[0]?.plan_key ?? "");
      })
      .catch((error: Error) => toast.error(error.message))
      .finally(() => setLoading(false));
  }, [open]);

  const selectedPlanDetails = billing?.plans.find((plan) => plan.plan_key === selectedPlan);
  const currentPlan = billing?.subscription?.plan_key;
  const isTrial = billing?.subscription?.status === "trialing";

  const payWithMpesa = async () => {
    if (!selectedPlan || !mpesaPhone.trim()) {
      toast.error("Enter the Safaricom number that should receive the M-Pesa prompt.");
      return;
    }
    setMpesaLoading(true);
    setMessage("");
    try {
      const result = await startMpesaCheckout(selectedPlan, mpesaPhone);
      toast.success("Opening Paystack M-Pesa checkout");
      window.location.assign(result.link);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not send the M-Pesa prompt.");
    } finally {
      setMpesaLoading(false);
    }
  };

  const payByCard = async () => {
    if (!selectedPlan) return;
    setCardLoading(true);
    try {
      const result = await startBillingCheckout(selectedPlan);
      window.location.assign(result.link);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not start checkout.");
      setCardLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-6xl overflow-y-auto border-white/10 bg-[#171717] p-5 text-white sm:p-8">
        <div className="mb-2 pr-8">
          <div>
            <div className="mb-2 flex items-center gap-2 text-primary">
              <Sparkles className="h-4 w-4" />
              <span className="text-xs font-semibold uppercase tracking-[0.2em]">
                Touchline packages
              </span>
            </div>
            <DialogTitle className="font-display text-3xl tracking-wide sm:text-4xl">
              Upgrade your academy
            </DialogTitle>
            <DialogDescription className="mt-2 max-w-2xl text-white/60">
              {isTrial
                ? "Your 14-day trial is active. Choose a package now and subscribe when you are ready."
                : "Choose the capacity and features your academy needs. You can change package later."}
            </DialogDescription>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-3 py-16 text-sm text-white/60">
            <Loader2 className="h-5 w-5 animate-spin" /> Loading packages…
          </div>
        ) : (
          <>
            <div className="grid gap-4 lg:grid-cols-3">
              {(billing?.plans ?? []).map((plan) => {
                const selected = selectedPlan === plan.plan_key;
                const current = currentPlan === plan.plan_key;
                const featured = plan.plan_key === "growth";
                return (
                  <button
                    key={plan.plan_key}
                    type="button"
                    onClick={() => {
                      setSelectedPlan(plan.plan_key);
                      setMessage("");
                      setMpesaPromptOpen(true);
                    }}
                    className={`relative flex h-full flex-col rounded-2xl border p-5 text-left transition sm:p-6 ${selected ? "border-primary bg-primary/10 shadow-[0_0_0_1px_hsl(var(--primary))]" : "border-white/10 bg-white/[0.03] hover:border-white/30"}`}
                  >
                    {featured && (
                      <span className="absolute -top-3 left-5 rounded-full bg-primary px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-primary-foreground">
                        Most popular
                      </span>
                    )}
                    {current && (
                      <span className="absolute right-5 top-5 rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white/70">
                        {isTrial ? "Trial plan" : "Current plan"}
                      </span>
                    )}
                    <div className="min-h-24">
                      <p className="font-display text-xl uppercase tracking-wide">{plan.name}</p>
                      <p className="mt-2 text-sm leading-5 text-white/55">{plan.description}</p>
                    </div>
                    <p className="mt-5 text-3xl font-semibold tracking-tight">
                      {formatAmount(plan)}
                      <span className="ml-1 text-sm font-normal text-white/45">/ month</span>
                    </p>
                    <div className="my-5 h-px bg-white/10" />
                    <ul className="grid flex-1 gap-3 text-sm text-white/70">
                      {plan.feature_summary.map((feature) => (
                        <li key={feature} className="flex items-start gap-2.5">
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <span
                      className={`mt-6 block rounded-full py-2.5 text-center text-sm font-semibold transition ${selected ? "bg-white text-black" : "bg-white/10 text-white"}`}
                    >
                      {selected ? "Selected" : "Choose package"}
                    </span>
                  </button>
                );
              })}
            </div>

            <Card className="mt-5 border-primary/25 bg-primary/5 text-white">
              <CardContent className="grid gap-4 p-4 sm:p-5">
                <div>
                  <p className="font-semibold">Subscribe quickly with M-Pesa</p>
                  <p className="mt-1 text-xs text-white/60">
                    Selected:{" "}
                    {selectedPlanDetails
                      ? `${selectedPlanDetails.name} · ${formatAmount(selectedPlanDetails)} / month`
                      : "Choose a package above"}
                    . Continue to Paystack, choose M-Pesa, then approve the prompt with your OTP and
                    M-Pesa PIN.
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
                    className="border-white/15 bg-white/5 text-white placeholder:text-white/35"
                  />
                  <Button
                    onClick={payWithMpesa}
                    disabled={!selectedPlan || mpesaLoading || cardLoading}
                    className="sm:min-w-44"
                  >
                    {mpesaLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Subscribe with M-Pesa
                  </Button>
                </div>
                {message && (
                  <p role="status" className="text-sm text-white/75">
                    {message}
                  </p>
                )}
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-3">
                  <p className="flex items-center gap-2 text-xs text-white/50">
                    <ShieldCheck className="h-4 w-4" /> Payment is verified before access changes.
                  </p>
                  <Button
                    variant="outline"
                    onClick={payByCard}
                    disabled={!selectedPlan || cardLoading || mpesaLoading}
                    className="border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white"
                  >
                    {cardLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Pay by card or other method
                  </Button>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </DialogContent>
      <Dialog open={mpesaPromptOpen} onOpenChange={setMpesaPromptOpen}>
        <DialogContent className="max-w-md border-white/10 bg-[#171717] p-5 text-white sm:p-7">
          <DialogTitle className="font-display text-2xl tracking-wide">
            Subscribe with M-Pesa
          </DialogTitle>
          <DialogDescription className="text-white/60">
            {selectedPlanDetails
              ? `${selectedPlanDetails.name} · ${formatAmount(selectedPlanDetails)} / month`
              : "Choose a package to continue."}
          </DialogDescription>
          <div className="mt-2 grid gap-4">
            <div className="rounded-xl border border-primary/25 bg-primary/5 p-4 text-sm text-white/75">
              Enter the Safaricom number that should receive the M-Pesa prompt. Paystack will open
              next so you can choose M-Pesa and approve with your OTP and M-Pesa PIN.
            </div>
            <Input
              autoFocus
              value={mpesaPhone}
              onChange={(event) => setMpesaPhone(event.target.value)}
              placeholder="0712 345 678"
              inputMode="tel"
              aria-label="Safaricom M-Pesa phone number"
              disabled={mpesaLoading}
              className="border-white/15 bg-white/5 text-white placeholder:text-white/35"
            />
            <Button
              onClick={payWithMpesa}
              disabled={!selectedPlan || mpesaLoading || cardLoading}
              className="w-full"
            >
              {mpesaLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Continue to Paystack with M-Pesa
            </Button>
            <p className="flex items-center gap-2 text-xs text-white/50">
              <ShieldCheck className="h-4 w-4 shrink-0" /> Payment is verified before access
              changes.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}

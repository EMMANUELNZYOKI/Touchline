import { callTouchlineApi } from "@/lib/next-server-fn";

export type BillingPlan = {
  plan_key: string;
  name: string;
  description: string;
  amount: number;
  currency: string;
  player_limit: number | null;
  feature_summary: string[];
  active: boolean;
  display_order: number;
};

export type BillingResponse = {
  subscription: {
    status: "trialing" | "active" | "past_due" | "canceled" | "paused";
    plan_key: string;
    trial_ends_at: string | null;
    current_period_end: string | null;
    provider: string | null;
  } | null;
  plans: BillingPlan[];
  payments: Array<{
    tx_ref: string;
    amount: number;
    currency: string;
    plan_key: string;
    status: "pending" | "successful" | "failed" | "cancelled";
    created_at: string;
    paid_at: string | null;
  }>;
};

export function getBilling() {
  return callTouchlineApi<BillingResponse>("/api/billing", "GET");
}

export function startMpesaCheckout(planKey: string, phone: string) {
  return callTouchlineApi<{
    link: string;
    txRef: string;
    amount: number;
    currency: string;
    planKey: string;
  }>("/api/billing/mpesa", "POST", { planKey, phone });
}

export function startBillingCheckout(planKey: string) {
  return callTouchlineApi<{
    link: string;
    txRef: string;
    amount: number;
    currency: string;
    planKey: string;
  }>("/api/billing/checkout", "POST", { planKey });
}

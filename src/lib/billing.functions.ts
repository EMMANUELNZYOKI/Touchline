import { callTouchlineApi } from "@/lib/next-server-fn";

export type BillingResponse = {
  subscription: {
    status: "trialing" | "active" | "past_due" | "canceled" | "paused";
    trial_ends_at: string | null;
    current_period_end: string | null;
    provider: string | null;
  } | null;
  payments: Array<{
    tx_ref: string;
    amount: number;
    currency: string;
    status: "pending" | "successful" | "failed" | "cancelled";
    created_at: string;
    paid_at: string | null;
  }>;
};

export function getBilling() {
  return callTouchlineApi<BillingResponse>("/api/billing", "GET");
}

export function startBillingCheckout() {
  return callTouchlineApi<{ link: string; txRef: string; amount: number; currency: string }>(
    "/api/billing/checkout",
    "POST",
  );
}

import Constants from "expo-constants";

import { supabase } from "./supabase";

const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, string | undefined>;
const touchlineWebUrl = (extra.touchlineWebUrl ?? process.env.EXPO_PUBLIC_TOUCHLINE_WEB_URL ?? "https://touchlineelite.vercel.app").replace(/\/$/, "");

export type BillingPlan = {
  plan_key: string;
  name: string;
  description: string;
  amount: number;
  currency: string;
  player_limit: number | null;
  coach_limit: number | null;
  feature_summary: string[];
  feature_flags: string[];
  active: boolean;
  display_order: number;
};

export type BillingData = {
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

async function billingRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const { data, error } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (error || !token) throw new Error("Sign in again to continue.");
  const response = await fetch(`${touchlineWebUrl}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  const result = (await response.json().catch(() => ({}))) as { error?: string } & T;
  if (!response.ok) throw new Error(result.error || "The billing request could not be completed.");
  return result;
}

export function fetchBilling() {
  return billingRequest<BillingData>("/api/billing");
}

export function startMpesaCheckout(planKey: string, phone: string) {
  return billingRequest<{ link: string; txRef: string; amount: number; currency: string; planKey: string }>("/api/billing/mpesa", {
    method: "POST",
    body: JSON.stringify({ planKey, phone }),
  });
}

export function startBillingCheckout(planKey: string) {
  return billingRequest<{
    link: string;
    txRef: string;
    amount: number;
    currency: string;
    planKey: string;
  }>("/api/billing/checkout", {
    method: "POST",
    body: JSON.stringify({ planKey }),
  });
}

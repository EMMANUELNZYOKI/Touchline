import "server-only";
import crypto from "node:crypto";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { ApiError } from "@/lib/server/http";

const PAYSTACK_API = "https://api.paystack.co";

type PaystackResponse<T> = { status: boolean; message?: string; data: T };
type SubscriptionPlan = {
  plan_key: string;
  name: string;
  amount: number;
  currency: string;
};
type PaystackTransaction = {
  id: number;
  status: string;
  reference: string;
  amount: number;
  currency: string;
  paid_at?: string | null;
  customer?: { email?: string | null };
  metadata?: string | Record<string, unknown> | null;
};

function requiredEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new ApiError(`Paystack is not configured. Missing ${name}.`, 503);
  return value;
}

async function paystackRequest<T>(path: string, init: RequestInit) {
  const response = await fetch(`${PAYSTACK_API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${requiredEnv("PAYSTACK_SECRET_KEY")}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
    cache: "no-store",
  });
  const payload = (await response.json().catch(() => null)) as PaystackResponse<T> | null;
  if (!response.ok || !payload?.status) {
    console.error("Paystack API request failed", response.status, payload?.message);
    throw new ApiError("Could not communicate with Paystack.", 502);
  }
  return payload.data;
}

async function getSubscriptionPlan(planKey: string) {
  const { data, error } = await supabaseAdmin
    .from("subscription_plans")
    .select("plan_key, name, amount, currency")
    .eq("plan_key", planKey)
    .eq("active", true)
    .maybeSingle();
  if (error) throw new ApiError("Could not load the selected package.", 500);
  if (!data) throw new ApiError("That package is no longer available.", 400);
  return data as SubscriptionPlan;
}

export async function createPaystackCheckout(input: {
  academyId: string;
  planKey: string;
  email: string;
  name: string;
  phone?: string | null;
  channels: string[];
}) {
  const plan = await getSubscriptionPlan(input.planKey);
  if (plan.currency.toUpperCase() !== "KES") {
    throw new ApiError("Paystack checkout is available only for KES packages.", 400);
  }
  const reference = `touchline-${input.academyId}-${crypto.randomUUID()}`;
  const { error: paymentError } = await supabaseAdmin.from("academy_payments").insert({
    academy_id: input.academyId,
    provider: "paystack",
    tx_ref: reference,
    amount: plan.amount,
    currency: plan.currency,
    plan_key: plan.plan_key,
    status: "pending",
    payment_type: "subscription",
  });
  if (paymentError) {
    console.error("Could not persist Paystack payment", paymentError);
    throw new ApiError("Could not prepare the payment. Please try again.", 500);
  }
  const checkout = await paystackRequest<{
    authorization_url: string;
    access_code: string;
    reference: string;
  }>("/transaction/initialize", {
    method: "POST",
    body: JSON.stringify({
      email: input.email,
      amount: Math.round(Number(plan.amount) * 100),
      currency: plan.currency,
      reference,
      channels: input.channels,
      callback_url: process.env.NEXT_PUBLIC_APP_URL
        ? `${process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "")}/admin/settings?payment=returned`
        : undefined,
      metadata: {
        academy_id: input.academyId,
        plan_key: plan.plan_key,
        payment_type: "subscription",
        customer_name: input.name,
        phone: input.phone || undefined,
      },
    }),
  });
  return {
    link: checkout.authorization_url,
    txRef: checkout.reference,
    amount: plan.amount,
    currency: plan.currency,
    planKey: plan.plan_key,
  };
}

async function verifyTransaction(reference: string) {
  return paystackRequest<PaystackTransaction>(
    `/transaction/verify/${encodeURIComponent(reference)}`,
    { method: "GET" },
  );
}

function safeEqual(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function metadataObject(metadata: PaystackTransaction["metadata"]) {
  if (!metadata) return {};
  if (typeof metadata === "object") return metadata;
  try {
    return JSON.parse(metadata) as Record<string, unknown>;
  } catch {
    return {};
  }
}

export async function handlePaystackWebhook(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-paystack-signature") || "";
  const expected = crypto
    .createHmac("sha512", requiredEnv("PAYSTACK_SECRET_KEY"))
    .update(rawBody)
    .digest("hex");
  if (!safeEqual(signature, expected)) return new Response(null, { status: 401 });

  const payload = JSON.parse(rawBody) as { event?: string; data?: PaystackTransaction };
  if (payload.event !== "charge.success" || !payload.data?.reference) {
    return Response.json({ ok: true });
  }

  const eventId = `${payload.event}:${payload.data.reference}:${payload.data.id}`;
  const { error: eventError } = await supabaseAdmin.from("payment_webhook_events").insert({
    provider: "paystack",
    event_id: eventId,
    event_type: payload.event,
  });
  if (eventError?.code === "23505") return Response.json({ ok: true });
  if (eventError) {
    console.error("Could not record Paystack webhook event", eventError);
    return new Response(null, { status: 500 });
  }

  const verified = await verifyTransaction(payload.data.reference);
  const { data: payment, error: paymentError } = await supabaseAdmin
    .from("academy_payments")
    .select("id, academy_id, tx_ref, amount, currency, plan_key, status")
    .eq("tx_ref", verified.reference)
    .eq("provider", "paystack")
    .maybeSingle();
  if (paymentError) throw paymentError;
  if (!payment) return Response.json({ ok: true });

  const plan = await getSubscriptionPlan(payment.plan_key);
  const successful =
    verified.status === "success" &&
    verified.reference === payment.tx_ref &&
    Number(verified.amount) === Math.round(Number(plan.amount) * 100) &&
    verified.currency.toUpperCase() === plan.currency.toUpperCase();
  if (!successful) return Response.json({ ok: true });

  const paidAt = verified.paid_at || new Date().toISOString();
  const { error: updateError } = await supabaseAdmin
    .from("academy_payments")
    .update({
      provider_transaction_id: String(verified.id),
      status: "successful",
      paid_at: paidAt,
      updated_at: new Date().toISOString(),
    })
    .eq("id", payment.id)
    .eq("status", "pending");
  if (updateError) throw updateError;

  const periodStart = new Date(paidAt);
  const periodEnd = new Date(periodStart);
  periodEnd.setMonth(periodEnd.getMonth() + 1);
  const metadata = metadataObject(verified.metadata);
  const { error: subscriptionError } = await supabaseAdmin
    .from("academy_subscriptions")
    .update({
      plan_key: plan.plan_key,
      status: "active",
      provider: "paystack",
      provider_customer_id: verified.customer?.email ?? null,
      provider_subscription_id: String(verified.id),
      current_period_start: periodStart.toISOString(),
      current_period_end: periodEnd.toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("academy_id", payment.academy_id);
  if (subscriptionError) throw subscriptionError;
  void metadata;
  return Response.json({ ok: true });
}

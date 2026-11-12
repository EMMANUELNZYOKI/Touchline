import "server-only";
import crypto from "node:crypto";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { ApiError } from "@/lib/server/http";

const FLUTTERWAVE_API = "https://api.flutterwave.com/v3";

type FlutterwaveResponse<T> = { status: string; message?: string; data: T | null };
type VerifiedTransaction = {
  id: number;
  tx_ref: string;
  amount: number;
  currency: string;
  status: string;
  charged_amount?: number;
  customer?: { email?: string; name?: string };
};
type WebhookData = {
  id?: number | string;
  transaction_id?: number | string;
  tx_ref?: string;
  amount?: number;
  currency?: string;
  status?: string;
};

function requiredEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new ApiError(`Flutterwave is not configured. Missing ${name}.`, 503);
  return value;
}

function billingConfig() {
  const amount = Number(process.env.FLW_SUBSCRIPTION_AMOUNT);
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new ApiError("Flutterwave is not configured with a valid subscription amount.", 503);
  }
  const currency = (process.env.FLW_SUBSCRIPTION_CURRENCY || "NGN").trim().toUpperCase();
  const paymentPlan = process.env.FLW_PAYMENT_PLAN_ID?.trim();
  if (!paymentPlan) {
    throw new ApiError("Flutterwave is not configured with a payment plan ID.", 503);
  }
  return { amount, currency, paymentPlan };
}

async function flutterwaveRequest<T>(path: string, init: RequestInit) {
  const response = await fetch(`${FLUTTERWAVE_API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${requiredEnv("FLW_SECRET_KEY")}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
    cache: "no-store",
  });
  const payload = (await response.json().catch(() => null)) as FlutterwaveResponse<T> | null;
  if (!response.ok || payload?.status !== "success") {
    console.error("Flutterwave API request failed", response.status, payload?.message);
    throw new ApiError("Could not communicate with Flutterwave.", 502);
  }
  return payload.data as T;
}

export async function createFlutterwaveCheckout(input: {
  academyId: string;
  email: string;
  name: string;
  phone?: string | null;
}) {
  const { amount, currency, paymentPlan } = billingConfig();
  const txRef = `touchline-${input.academyId}-${crypto.randomUUID()}`;
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "").trim().replace(/\/$/, "");
  if (!appUrl) throw new ApiError("NEXT_PUBLIC_APP_URL is required for Flutterwave checkout.", 503);
  const { error: paymentError } = await supabaseAdmin.from("academy_payments").insert({
    academy_id: input.academyId,
    provider: "flutterwave",
    tx_ref: txRef,
    amount,
    currency,
    status: "pending",
    payment_type: "subscription",
  });
  if (paymentError) {
    console.error("Could not persist Flutterwave payment", paymentError);
    throw new ApiError("Could not prepare the payment. Please try again.", 500);
  }
  const checkout = await flutterwaveRequest<{ link: string }>("/payments", {
    method: "POST",
    body: JSON.stringify({
      tx_ref: txRef,
      amount,
      currency,
      payment_plan: Number(paymentPlan),
      redirect_url: `${appUrl}/admin/settings?payment=returned`,
      customer: { email: input.email, name: input.name, phonenumber: input.phone || undefined },
      meta: { academy_id: input.academyId, payment_type: "subscription" },
      customizations: {
        title: "Touchline Academy Subscription",
        description: "Keep your Touchline academy workspace active.",
      },
      configurations: { session_duration: 30, max_retry_attempt: 3 },
    }),
  });
  return { link: checkout.link, txRef, amount, currency };
}

async function verifyTransaction(transactionId: number) {
  return flutterwaveRequest<VerifiedTransaction>(`/transactions/${transactionId}/verify`, {
    method: "GET",
  });
}

function safeEqual(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export async function handleFlutterwaveWebhook(request: Request) {
  const secretHash = requiredEnv("FLW_SECRET_HASH");
  const signature = request.headers.get("verif-hash") || "";
  if (!safeEqual(signature, secretHash)) return new Response(null, { status: 401 });
  const payload = (await request.json().catch(() => null)) as {
    event?: string;
    data?: WebhookData;
  } | null;
  if (!payload?.data) return new Response(null, { status: 400 });
  const eventKey = payload.event ?? "transaction";
  const transactionKey = payload.data.transaction_id ?? payload.data.id ?? payload.data.tx_ref;
  const eventId = `${eventKey}:${transactionKey ?? "unknown"}:${payload.data.status ?? "unknown"}`;
  if (!transactionKey) return new Response(null, { status: 400 });
  const { error: eventError } = await supabaseAdmin.from("payment_webhook_events").insert({
    provider: "flutterwave",
    event_id: eventId,
    event_type: payload.event ?? null,
  });
  if (eventError?.code === "23505") return Response.json({ ok: true });
  if (eventError) {
    console.error("Could not record Flutterwave webhook event", eventError);
    return new Response(null, { status: 500 });
  }
  const transactionId = Number(payload.data.transaction_id ?? payload.data.id);
  if (!Number.isInteger(transactionId) || transactionId <= 0) return Response.json({ ok: true });
  const verified = await verifyTransaction(transactionId);
  const { data: payment, error: paymentError } = await supabaseAdmin
    .from("academy_payments")
    .select("id, academy_id, tx_ref, amount, currency, status")
    .eq("tx_ref", verified.tx_ref)
    .maybeSingle();
  if (paymentError) throw paymentError;
  if (!payment) return Response.json({ ok: true });
  const successful =
    verified.status === "successful" &&
    verified.tx_ref === payment.tx_ref &&
    Number(verified.amount) === Number(payment.amount) &&
    verified.currency.toUpperCase() === payment.currency.toUpperCase();
  const nextStatus = successful
    ? "successful"
    : verified.status === "cancelled"
      ? "cancelled"
      : "failed";
  const { error: updateError } = await supabaseAdmin
    .from("academy_payments")
    .update({
      provider_transaction_id: String(verified.id),
      status: nextStatus,
      paid_at: successful ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", payment.id);
  if (updateError) throw updateError;
  if (successful) {
    const periodStart = new Date();
    const periodEnd = new Date(periodStart);
    periodEnd.setMonth(periodEnd.getMonth() + 1);
    const { error: subscriptionError } = await supabaseAdmin
      .from("academy_subscriptions")
      .update({
        status: "active",
        provider: "flutterwave",
        provider_customer_id: verified.customer?.email ?? null,
        provider_subscription_id: String(verified.id),
        current_period_start: periodStart.toISOString(),
        current_period_end: periodEnd.toISOString(),
        updated_at: periodStart.toISOString(),
      })
      .eq("academy_id", payment.academy_id);
    if (subscriptionError) throw subscriptionError;
  }
  return Response.json({ ok: true });
}

export { billingConfig };

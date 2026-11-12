import "server-only";
import crypto from "node:crypto";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { ApiError } from "@/lib/server/http";

const FLUTTERWAVE_API = "https://api.flutterwave.com/v3";
type FlutterwaveResponse<T> = { status: string; message?: string; data: T | null };
type SubscriptionPlan = {
  plan_key: string;
  name: string;
  amount: number;
  currency: string;
  flutterwave_plan_id: string | null;
};
type VerifiedTransaction = {
  id: number;
  tx_ref: string;
  amount: number;
  currency: string;
  status: string;
  customer?: { email?: string; name?: string };
};
type WebhookData = {
  id?: number | string;
  transaction_id?: number | string;
  subscription_id?: number | string;
  tx_ref?: string;
  amount?: number;
  currency?: string;
  status?: string;
  meta?: { academy_id?: string; plan_key?: string };
};

function requiredEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new ApiError(`Flutterwave is not configured. Missing ${name}.`, 503);
  return value;
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

async function getSubscriptionPlan(planKey: string) {
  const { data, error } = await supabaseAdmin
    .from("subscription_plans")
    .select("plan_key, name, amount, currency, flutterwave_plan_id")
    .eq("plan_key", planKey)
    .eq("active", true)
    .maybeSingle();
  if (error) throw new ApiError("Could not load the selected package.", 500);
  if (!data) throw new ApiError("That package is no longer available.", 400);
  if (!data.flutterwave_plan_id) {
    throw new ApiError(`The ${data.name} package is not ready for checkout yet.`, 503);
  }
  return data as SubscriptionPlan;
}

export async function createFlutterwaveCheckout(input: {
  academyId: string;
  planKey: string;
  email: string;
  name: string;
  phone?: string | null;
}) {
  const plan = await getSubscriptionPlan(input.planKey);
  const txRef = `touchline-${input.academyId}-${crypto.randomUUID()}`;
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "").trim().replace(/\/$/, "");
  if (!appUrl) throw new ApiError("NEXT_PUBLIC_APP_URL is required for Flutterwave checkout.", 503);
  const { error: paymentError } = await supabaseAdmin.from("academy_payments").insert({
    academy_id: input.academyId,
    provider: "flutterwave",
    tx_ref: txRef,
    amount: plan.amount,
    currency: plan.currency,
    plan_key: plan.plan_key,
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
      amount: plan.amount,
      currency: plan.currency,
      payment_plan: Number(plan.flutterwave_plan_id),
      redirect_url: `${appUrl}/admin/settings?payment=returned`,
      customer: { email: input.email, name: input.name, phonenumber: input.phone || undefined },
      meta: { academy_id: input.academyId, plan_key: plan.plan_key, payment_type: "subscription" },
      customizations: {
        title: `Touchline ${plan.name} Package`,
        description: `Activate the ${plan.name} package for your academy.`,
      },
      configurations: { session_duration: 30, max_retry_attempt: 3 },
    }),
  });
  return {
    link: checkout.link,
    txRef,
    amount: plan.amount,
    currency: plan.currency,
    planKey: plan.plan_key,
  };
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
  const { data: existingPayment, error: paymentError } = await supabaseAdmin
    .from("academy_payments")
    .select("id, academy_id, tx_ref, amount, currency, plan_key, status")
    .eq("tx_ref", verified.tx_ref)
    .maybeSingle();
  if (paymentError) throw paymentError;
  let payment = existingPayment;

  const providerSubscriptionId = payload.data.subscription_id
    ? String(payload.data.subscription_id)
    : null;
  if (!payment && providerSubscriptionId) {
    const { data: subscription } = await supabaseAdmin
      .from("academy_subscriptions")
      .select("academy_id, plan_key")
      .eq("provider_subscription_id", providerSubscriptionId)
      .maybeSingle();
    if (subscription) {
      const { data: createdPayment, error: createdPaymentError } = await supabaseAdmin
        .from("academy_payments")
        .insert({
          academy_id: subscription.academy_id,
          provider: "flutterwave",
          tx_ref: verified.tx_ref,
          amount: verified.amount,
          currency: verified.currency,
          plan_key: subscription.plan_key,
          status: "pending",
          payment_type: "subscription_renewal",
        })
        .select("id, academy_id, tx_ref, amount, currency, plan_key, status")
        .single();
      if (createdPaymentError) throw createdPaymentError;
      payment = createdPayment;
    }
  }
  if (!payment && payload.data.meta?.academy_id) {
    const { data: subscription } = await supabaseAdmin
      .from("academy_subscriptions")
      .select("academy_id, plan_key")
      .eq("academy_id", payload.data.meta.academy_id)
      .maybeSingle();
    if (subscription) {
      const { data: createdPayment, error: createdPaymentError } = await supabaseAdmin
        .from("academy_payments")
        .insert({
          academy_id: subscription.academy_id,
          provider: "flutterwave",
          tx_ref: verified.tx_ref,
          amount: verified.amount,
          currency: verified.currency,
          plan_key: subscription.plan_key,
          status: "pending",
          payment_type: "subscription_renewal",
        })
        .select("id, academy_id, tx_ref, amount, currency, plan_key, status")
        .single();
      if (createdPaymentError) throw createdPaymentError;
      payment = createdPayment;
    }
  }
  if (!payment) return Response.json({ ok: true });
  const plan = await getSubscriptionPlan(payment.plan_key);
  const successful =
    verified.status === "successful" &&
    verified.tx_ref === payment.tx_ref &&
    Number(verified.amount) === Number(plan.amount) &&
    verified.currency.toUpperCase() === plan.currency.toUpperCase();
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
        plan_key: plan.plan_key,
        status: "active",
        provider: "flutterwave",
        provider_customer_id: verified.customer?.email ?? null,
        provider_subscription_id: providerSubscriptionId ?? String(verified.id),
        current_period_start: periodStart.toISOString(),
        current_period_end: periodEnd.toISOString(),
        updated_at: periodStart.toISOString(),
      })
      .eq("academy_id", payment.academy_id);
    if (subscriptionError) throw subscriptionError;
  } else if (nextStatus === "failed") {
    await supabaseAdmin
      .from("academy_subscriptions")
      .update({ status: "past_due", updated_at: new Date().toISOString() })
      .eq("academy_id", payment.academy_id)
      .eq("status", "active");
  }
  return Response.json({ ok: true });
}

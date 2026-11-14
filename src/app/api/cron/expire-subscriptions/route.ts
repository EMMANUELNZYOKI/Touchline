import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const configuredSecret = process.env.CRON_SECRET?.trim();
  const authorization = request.headers.get("authorization");
  if (!configuredSecret || authorization !== `Bearer ${configuredSecret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { data, error } = await supabaseAdmin
    .from("academy_subscriptions")
    .update({ status: "past_due", updated_at: new Date().toISOString() })
    .eq("status", "active")
    .not("current_period_end", "is", null)
    .lte("current_period_end", new Date().toISOString())
    .select("id");
  if (error) {
    console.error("Could not expire overdue subscriptions", error);
    return Response.json({ error: "Could not expire overdue subscriptions" }, { status: 500 });
  }

  return Response.json({ ok: true, expired: data?.length ?? 0 });
}

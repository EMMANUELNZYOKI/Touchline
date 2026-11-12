import { handlePaystackWebhook } from "@/lib/paystack.server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    return await handlePaystackWebhook(request);
  } catch (error) {
    console.error("Paystack webhook failed", error);
    return new Response(null, { status: 500 });
  }
}

import { handleFlutterwaveWebhook } from "@/lib/flutterwave.server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    return await handleFlutterwaveWebhook(request);
  } catch (error) {
    console.error("Flutterwave webhook failed", error);
    return new Response(null, { status: 500 });
  }
}

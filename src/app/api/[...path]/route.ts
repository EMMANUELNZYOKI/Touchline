import { handleTouchlineApi } from "@/lib/touchline-actions.server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = handleTouchlineApi;
export const POST = handleTouchlineApi;
export const PATCH = handleTouchlineApi;

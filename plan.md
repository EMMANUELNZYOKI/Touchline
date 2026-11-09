# Touchline Next.js App Router migration

## Status

The framework migration is implemented in the working tree and passes the local code/build checks. It has **not** been committed, pushed, or deployed. Vercel rollout remains paused until the server-only Supabase service-role key is configured, per the user's instruction.

## What changed

1. Added Next.js App Router pages and protected layouts under `src/app/`, preserving the current public, academy-admin, coach, platform-admin, onboarding, and evaluation URLs.
2. Kept the existing React screens in `src/routes/` temporarily and added `src/lib/next-router-compat.tsx` to bridge navigation and route params without redesigning the UI.
3. Replaced TanStack server functions with authenticated Next API handlers. `src/integrations/supabase/auth-middleware.ts` verifies bearer tokens; server handlers derive the actor from verified claims and check academy membership or platform-admin authorization before using service-role operations.
4. Switched browser Supabase configuration to `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`. The service-role key remains server-only. Route-specific Next metadata and robots directives are in place.
5. Removed Vite/TanStack runtime packages and entry points, set npm as the canonical package manager, and moved Vercel detection to Next.js.
6. Hardened platform-admin bootstrap so the Auth email must be confirmed. Unexpected backend/provider errors return generic messages rather than raw details.

## Preserved scope

Supabase schema and RLS migrations were not changed in this framework work. The existing academy, coach, player, and evaluation workflows remain in place. No Dios records or files were transferred, no billing provider was added, and no Vercel deployment was attempted.

## Local validation

Validated with `npm run lint`, `npx tsc --noEmit --pretty false`, and `NEXT_PUBLIC_SUPABASE_URL="$SUPABASE_URL" NEXT_PUBLIC_SUPABASE_ANON_KEY="$SUPABASE_KEY" npm run build`.

## Environment required before live tests/deployment

Browser build variables: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

Server-only variables: `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `TOUCHLINE_PLATFORM_ADMIN_EMAIL`.

Never expose `SUPABASE_SERVICE_ROLE_KEY` to the client or commit it. After the service-role key is configured in Vercel, verify academy-admin creation, coach login, academy-scoped player visibility, evaluation create/update, and platform-admin access before enabling the deployment.

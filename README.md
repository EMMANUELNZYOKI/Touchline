# Touchline — Soccer Academy Management

Touchline is a web application for soccer academies to manage players, coaches, and player evaluations. It includes the original Dios academy workflows as the first tenant foundation, plus a separate Touchline platform-admin area for managing academy workspaces.

> **Tenant rollout status:** The baseline and tenant migrations have been applied to the Touchline Supabase project. The database now enforces academy-scoped RLS and private photo storage. Do not onboard customer academies until the deployed app is configured, first-admin bootstrap is completed, and isolation is tested with separate test tenants.

## Current stack

- React + TypeScript
- TanStack Start / Router and Vite
- Supabase Auth, PostgreSQL, Row-Level Security, and Storage
- Tailwind CSS
- Vercel configuration

## Local development

Requirements: Node.js 18+ (or Bun).

```bash
npm install
cp .env.example .env
npm run dev
```

The browser uses `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. Server functions also require `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, and `SUPABASE_SERVICE_ROLE_KEY`. The service-role key is server-only: never prefix it with `VITE_`, expose it to the browser, or commit it.

Set `TOUCHLINE_PLATFORM_ADMIN_EMAIL` on the server to the email address of the initial platform operator. First create that user through Supabase Auth, then sign in at `/platform/login`; the server grants platform access only if the signed-in Auth email exactly matches the allowlisted address and no platform administrator has yet been provisioned.

## Database migrations

The current Touchline Supabase project has the baseline schema plus the migrations below applied. For a new environment, apply every file in `supabase/migrations/` in chronological order. The academy-tenancy migration:

- Creates `academies`, `academy_memberships`, `platform_admins`, and `academy_subscriptions`.
- Seeds an initial Dios Soccer Academy tenant and a trial subscription, then backfills existing players, evaluations, activity logs, and legacy administrator/coach roles into that academy.
- Adds and requires `academy_id` on players and evaluations, adds academy ownership to activity logs, and adds a composite key so evaluations cannot reference a player in a different academy.
- Replaces prior RLS policies with membership-based tenant checks. Coaches can read their academy roster and create/update their own evaluations; academy administrators can manage their academy's players, memberships, and evaluations.
- Separates Touchline platform administrators from academy roles. The platform dashboard uses service-role server functions to read aggregate academy counts and manage academy/subscription status; it does not expose player-level data to the platform UI.
- Moves internal authorization helpers to a non-exposed schema, scopes the evaluated-player status RPC to the caller's academy, and stores player photos in a private bucket with academy-prefixed object paths and signed URLs.
- Removes the unauthenticated legacy Super Admin bootstrap. Academy-admin sign-in and coach creation, status changes, and profile edits now verify an active `academy_admin` membership and are scoped to that academy; the legacy `profiles.role` value is not an authorization source.

The current academy portal has no academy switcher, so the schema permits only one active academy membership per user. A tenant-assignment trigger fills `academy_id` for the existing single-academy app only when the signed-in user has exactly one active membership. Add an explicit workspace selector before allowing a person to operate in multiple active academies.

The `active` subscription status in the platform dashboard is currently an operator-managed status field; payment collection, renewals, invoices, and automatic state updates require a billing-provider integration and are not included yet. New academies are created with a starter trial record and do not automatically receive an academy administrator; add the admin invitation flow before customer onboarding.

## Commands

```bash
npm run dev
npm run build
npm run lint
```

`npm run lint` currently scans the full repository, including generated output; use targeted ESLint on changed `src` files when validating during development.

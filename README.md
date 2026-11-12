# Touchline — Soccer Academy Management

Touchline is a multi-academy web application for managing player records, coaches, and player evaluations. It carries forward the Dios Soccer Academy workflow as the first tenant while adding academy isolation and a separate Touchline platform-operator area.

> **Rollout status:** The tenant/RLS and academy onboarding migrations have been applied to the Touchline Supabase project. The new signup flow creates a verified academy administrator and a 14-day starter trial. The Dios source records have **not** been copied into Touchline yet. Do not invite real academies until the first platform operator is configured, Auth email delivery is working, and tenant access has been tested with separate accounts.

## Current stack

- React + TypeScript
- Next.js App Router
- Supabase Auth, PostgreSQL, Row-Level Security, and Storage
- Tailwind CSS
- Vercel deployment configuration

The framework migration now uses the Next.js App Router. Existing public, admin, coach, platform, and evaluation URLs are preserved under `src/app/`; the screens remain in `src/routes/` temporarily and use a small Next navigation adapter while the UI is migrated incrementally. Authenticated actions go through `/api/[...path]`, where Supabase bearer tokens are verified and academy/platform roles are checked server-side.

## Local development

Requirements: Node.js 20.9 or newer.

```bash
npm ci
cp .env.example .env.local
npm run dev
```

Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to the Touchline Supabase project for browser access. Authenticated API handlers also require server-only `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, and `TOUCHLINE_PLATFORM_ADMIN_EMAIL`. The service-role key bypasses RLS: never prefix it with `NEXT_PUBLIC_`, never commit it, and never expose it to browser code. The example file contains placeholders, not usable credentials.

For Vercel, add the variables in **Project → Settings → Environment Variables** for Production, Preview, and Development as appropriate, then redeploy. Keep `SUPABASE_SERVICE_ROLE_KEY` server-only. Do not paste keys into source control or a chat.

### First Touchline platform operator

Set `TOUCHLINE_PLATFORM_ADMIN_EMAIL` on the server to the exact email address of the first Touchline operator. Create that account in the Touchline Supabase project's **Authentication → Users**, confirm its email, and choose its password. Visit `/platform/login` and sign in with that same email/password. The server grants the first platform-admin record only when the signed-in Auth email matches the allowlist and `platform_admins` is empty; afterward the allowlist cannot be used to add another operator.

Use the project URL `https://icmocslfyhnizdgbldhj.supabase.co`. In **Authentication → URL Configuration**, set the local Site URL as needed and add the exact local callback `http://localhost:3000/onboard?complete=1` plus the production callback `https://YOUR-DOMAIN/onboard?complete=1` (or carefully scoped equivalent redirect patterns). Configure Supabase's email provider before testing a signup that requires email confirmation. Restart the local Next server after editing `.env.local`; after changing Vercel variables, redeploy.

### New academy signup

Open `/onboard`, enter academy and first-admin details, and confirm the email. The verified user becomes that academy's `academy_admin`; the database atomically creates an active academy, membership, and 14-day `starter` trial. The admin can then sign in at `/admin/login`, create players and coach accounts, and manage their academy. Coaches sign in at `/coach/login` and can create/update their own player evaluations within that academy. Tenant RLS enforces the boundaries; platform operators are separate from academy roles.

The trial now has a database-backed Flutterwave package catalog. The default packages are Starter (KES 3,000/month, up to 30 players), Growth (KES 6,000/month, up to 100 players), and Pro (KES 9,000/month, highest limits and priority support). Academy administrators can review package cards in `/admin/settings`; after the 14-day trial, they select a package and start hosted checkout. The server looks up the selected package, creates the transaction, records a pending payment, verifies the completed transaction, and activates or changes the academy package only after the webhook verification matches the transaction reference, amount, and currency.

Create one recurring Flutterwave payment plan for each package, then update the `flutterwave_plan_id` values in `subscription_plans` in Supabase. Do not accept package amounts or Flutterwave plan IDs from the browser. Register `https://YOUR-DOMAIN/api/flutterwave/webhook` with the same webhook secret hash in Flutterwave. Payment-plan webhooks are used to renew active subscriptions, move failed renewals to `past_due`, and keep the academy read-only until a successful payment restores access. For Kenya, `/admin/settings` also provides a faster M-Pesa STK Push path: the admin enters a Safaricom number, approves the prompt with an M-Pesa PIN, and the same signed webhook plus server-side transaction verification activates the package. M-Pesa renewals should be treated as monthly payment prompts rather than silent automatic debits; cards can remain available as the automatic-renewal fallback.

## Database migrations

After creating the three recurring plans in Flutterwave, copy their plan IDs into the package catalog. Run this only after the new package migration has been applied:

```sql
UPDATE public.subscription_plans SET flutterwave_plan_id = 'FLUTTERWAVE_STARTER_PLAN_ID' WHERE plan_key = 'starter';
UPDATE public.subscription_plans SET flutterwave_plan_id = 'FLUTTERWAVE_GROWTH_PLAN_ID' WHERE plan_key = 'growth';
UPDATE public.subscription_plans SET flutterwave_plan_id = 'FLUTTERWAVE_PRO_PLAN_ID' WHERE plan_key = 'pro';
```

The Touchline Supabase project has the baseline schema and the migration files in `supabase/migrations/` applied in chronological order. The academy-tenancy migration:

- Creates `academies`, `academy_memberships`, `platform_admins`, and `academy_subscriptions`.
- Seeds one initial Dios Soccer Academy tenant and trial subscription. Legacy records are backfilled only if they already exist in the project when that migration runs.
- Adds and requires `academy_id` on players and evaluations, adds academy ownership to activity logs, and adds a composite key so an evaluation cannot reference a player from another academy.
- Replaces old policies with membership-based tenant checks. Coaches can read their academy roster and create/update their own evaluations; academy administrators can manage their academy's players, memberships, and evaluations.
- Keeps platform administration separate from academy roles. The platform dashboard receives aggregate academy counts and manages academy/subscription status through trusted server-only API handlers; it does not expose player-level records.
- Moves internal authorization helpers to a non-exposed schema, scopes the evaluated-player status RPC to the caller's academy, and uses academy-scoped private photo storage with signed URLs.
- Removes the unauthenticated legacy Super Admin bootstrap. The old `profiles.role` field is not the source of application authority; active academy membership is.
- Adds a service-role-only onboarding RPC to atomically create the first academy administrator and 14-day trial after the signed-up email is confirmed.

The current academy portal has no workspace switcher, so a user can have only one active academy membership. A tenant-assignment trigger fills `academy_id` for the existing single-academy app only when the signed-in user has exactly one active membership. Add an explicit workspace selector before allowing the same person to operate in multiple active academies.

## Dios data migration status

The old Dios Supabase project currently contains 3 Auth users and profiles, 2 players, 1 evaluation, 4 activity logs, 2 player-photo references, and 4 Storage objects. The new Touchline project currently has no Auth users, profiles, or Storage objects; its seeded Dios tenant has no imported players or evaluations yet. No child or staff data has been moved by this setup.

For a safe import, first take backups of both projects. Preserve Auth user IDs/password hashes using Supabase's documented project-migration approach, or deliberately recreate/invite staff and reset their passwords; do not copy `profiles` without their corresponding `auth.users`. Preserve player/evaluation IDs and scores, map each coach to the matching academy membership, set the target Dios `academy_id`, and copy only the photo files referenced by imported players into the private tenant-prefixed bucket. Do not restore a full source database over the already-migrated target schema. Review and approve the exact data set before running a transfer because player records can include minors' dates of birth, guardian contacts, and medical notes.

## Commands

```bash
npm run dev
npm run build
npm run lint
```

`npm run lint` checks the maintained project source while ignoring Next.js generated output and the Deno-only Supabase Edge Function source.

# Touchline — Soccer Academy Management

Touchline is a multi-academy web application for managing player records, coaches, and player evaluations. It carries forward the Dios Soccer Academy workflow as the first tenant while adding academy isolation and a separate Touchline platform-operator area.

> **Rollout status:** The tenant/RLS and academy onboarding migrations have been applied to the Touchline Supabase project. The new signup flow creates a verified academy administrator and a 14-day starter trial. The Dios source records have **not** been copied into Touchline yet. Do not invite real academies until the first platform operator is configured, Auth email delivery is working, and tenant access has been tested with separate accounts.

## Current stack

- React + TypeScript
- TanStack Start / Router and Vite
- Supabase Auth, PostgreSQL, Row-Level Security, and Storage
- Tailwind CSS
- Vercel deployment configuration

## Local development

Requirements: Node.js 18+.

```bash
npm ci
cp .env.example .env.local
npm run dev
```

Set the browser variables `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to the Touchline Supabase project. The server functions also require `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, and `SUPABASE_SERVICE_ROLE_KEY`. The service-role key bypasses RLS: keep it server-only, never prefix it with `VITE_`, and never commit it. The example file contains placeholders, not usable credentials.

For Vercel, add those same variables in **Project → Settings → Environment Variables** for the environments you deploy, then redeploy. Keep the service-role key as a server-side environment variable only. Do not paste keys into source control or a chat.

### First Touchline platform operator

Set `TOUCHLINE_PLATFORM_ADMIN_EMAIL` on the server to the exact email address of the first Touchline operator. Create that account in the Touchline Supabase project's **Authentication → Users**, confirm its email, and choose its password. Visit `/platform/login` and sign in with that same email/password. The server grants the first platform-admin record only when the signed-in Auth email matches the allowlist and `platform_admins` is empty; afterward the allowlist cannot be used to add another operator.

Use the project URL `https://icmocslfyhnizdgbldhj.supabase.co`. In **Authentication → URL Configuration**, set the local Site URL as needed and add the exact local callback `http://localhost:5173/onboard?complete=1` plus the production callback `https://YOUR-DOMAIN/onboard?complete=1` (or carefully scoped equivalent redirect patterns). Configure Supabase's email provider before testing a signup that requires email confirmation. Restart the local server after editing `.env.local`; after changing Vercel variables, redeploy.

### New academy signup

Open `/onboard`, enter academy and first-admin details, and confirm the email. The verified user becomes that academy's `academy_admin`; the database atomically creates an active academy, membership, and 14-day `starter` trial. The admin can then sign in at `/admin/login`, create players and coach accounts, and manage their academy. Coaches sign in at `/coach/login` and can create/update their own player evaluations within that academy. Tenant RLS enforces the boundaries; platform operators are separate from academy roles.

The trial is not yet connected to a payment processor. There is no checkout, invoice collection, automatic renewal, payment-failure webhook, or automatic trial expiry enforcement yet. Select the legal business country, billing currency, payment methods, and provider before enabling paid subscriptions.

## Database migrations

The Touchline Supabase project has the baseline schema and the migration files in `supabase/migrations/` applied in chronological order. The academy-tenancy migration:

- Creates `academies`, `academy_memberships`, `platform_admins`, and `academy_subscriptions`.
- Seeds one initial Dios Soccer Academy tenant and trial subscription. Legacy records are backfilled only if they already exist in the project when that migration runs.
- Adds and requires `academy_id` on players and evaluations, adds academy ownership to activity logs, and adds a composite key so an evaluation cannot reference a player from another academy.
- Replaces old policies with membership-based tenant checks. Coaches can read their academy roster and create/update their own evaluations; academy administrators can manage their academy's players, memberships, and evaluations.
- Keeps platform administration separate from academy roles. The platform dashboard receives aggregate academy counts and manages academy/subscription status through trusted server functions; it does not expose player-level records.
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

`npm run lint` scans generated output as well; use targeted ESLint on changed source files when validating during development.

# Touchline Next.js migration checklist

- [x] Replace TanStack Start with Next.js App Router while preserving current Touchline URLs and screens.
- [x] Add Next pages/layouts for landing, onboarding, academy admin, coach, platform admin, player records, and evaluations.
- [x] Replace TanStack navigation with a transitional Next-compatible adapter; keep existing UI behavior while avoiding a redesign.
- [x] Replace TanStack server functions with authenticated Next API handlers; verify Supabase bearer tokens and enforce academy/platform authorization server-side.
- [x] Preserve Supabase RLS-scoped browser queries, storage behavior, onboarding, and coach evaluation flows; keep service-role use server-only.
- [x] Replace Vite/TanStack configuration and dependencies with Next.js; make npm the canonical package manager.
- [x] Update setup and environment documentation; remove stale TanStack instructions and lock/config artifacts.
- [x] Validate with ESLint, strict TypeScript, and a production Next.js build.
- [x] Add Flutterwave hosted checkout, server-side transaction verification, webhook signature validation, idempotent event tracking, and academy billing status/payment history.
- [x] Make verified academy owners self-complete pending onboarding on first admin sign-in and guide expired trials to package selection.
- [x] Add Starter, Growth, and Pro package catalog with package cards, server-validated Flutterwave checkout, package changes, and renewal webhook handling.
- [ ] Configure the Touchline service-role key and remaining environment variables in the Vercel project.
- [ ] Run live role-isolation smoke tests (academy admin, coach, player evaluation, platform admin) after server configuration is available.
- [ ] Push and deploy only after the service-role key is configured and the user authorizes rollout.

No Dios data transfer is included in this migration.

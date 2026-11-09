# Touchline — Soccer Academy Management

Touchline is a web application for soccer academies to manage players, coaches, and player evaluations. This repository starts from the Dios Soccer Academy application and retains its current single-academy workflows and interface as a foundation for future SaaS development.

> **SaaS readiness:** This code is not yet multi-tenant. Do not connect multiple academies to one shared database until academy-level data ownership and Row-Level Security policies have been implemented and tested.

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

Set the following values in `.env` using your own Supabase project:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
```

Apply the SQL migrations in `supabase/migrations/` to a new Supabase project before using the application. Do not commit `.env` files, service-role keys, or other secrets.

## Commands

```bash
npm run dev
npm run build
npm run lint
```

## Important next step

Before offering this application to multiple academies, implement an academy/tenant model and add tenant ownership to user profiles, players, evaluations, activity logs, and file storage. Enforce tenant isolation in every database RLS policy and verify that users in one academy cannot access another academy's records.

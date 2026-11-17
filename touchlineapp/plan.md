# Touchline Mobile — implementation plan

## Product direction

Build a proper Expo React Native application for Android and iOS that uses the existing Touchline Supabase project as its shared source of truth. The mobile app will not create a second account system or duplicate academy data. Existing Touchline users will sign in with the same credentials and load the same academy membership, role, players, coaches, evaluations, reports, branding, and subscription state used by the web application.

## Current parity pass

1. Align the mobile player form with the website's profile fields and allow an authorized owner to update a player record; keep server-side RLS authoritative.
2. Align coach evaluations with the website's 28 skill ratings, four category scores, overall score, assessment fields, verdict, and create/update behavior for the current period.
3. Make every new Pressable action use explicit React Native styles and adequate touch targets because the app disables NativeWind class mapping on Pressable.
4. Surface backend/role failures inside the modal or screen that owns the action; invalidate the matching query data after writes.
5. Run Expo TypeScript/lint checks and inspect the resulting diff. Do not deploy or merge to production without separate approval.

## Follow-on slices

- Native player-photo capture/upload and signed-photo display.
- Password recovery/deep-link completion and explicit suspended/expired membership guidance.
- Subscription return handling, live billing refresh and report/export parity.
- Android and iOS real-device workflow tests and store-ready configuration.

## Design

### Selected style: Matchday Command Center

- Dark navy surfaces, pitch-green accent, high-contrast text, compact operational cards, one-thumb actions and calm data density.
- Use React Native controls and touch-first portrait layout. Pressable containers use explicit `style`/`StyleSheet` values; child `Text` may use NativeWind classes.

## Shared backend boundary

The mobile app uses only the public Supabase URL and publishable key in the client bundle. Supabase RLS remains authoritative for reads and writes. Paystack secrets, service-role access, webhook processing, subscription mutation, platform administration, and other privileged operations remain server-side in the existing Touchline web application/API. Do not broaden data permissions without a deliberate policy review.

# Touchline Mobile — implementation plan

## Product direction

Build a proper Expo React Native application for Android and iOS that uses the existing Touchline Supabase project as its shared source of truth. The mobile app will not create a second account system or duplicate academy data. Existing Touchline users will sign in with the same credentials and load the same academy membership, role, players, coaches, evaluations, reports, branding, and subscription state used by the web application.

## Scope for the first mobile slice

1. Replace the Expo starter screen with a Touchline-branded mobile entry experience.
2. Add a shared Supabase email/password session using SecureStore on native and AsyncStorage-compatible persistence on web Preview.
3. Add role-specific sign-in selection for Academy Owner, Academy Manager, Coach, and Super Admin, with the same role verification used by the web application.
4. Load the signed-in user profile, active academy membership, academy name, workspace status, and subscription state from the shared Supabase backend.
5. Show a fast, touch-first academy dashboard shell with the signed-in person’s name, role, academy name, key operating counts, and role-appropriate navigation.
6. Preserve secure server-side authorization for write operations; mobile reads may use the existing RLS-protected Supabase tables, while payment and privileged actions continue through the existing Touchline server API.
7. Add mobile deep-link support for password recovery and authentication return flows without exposing server secrets.

## Follow-on slices

- Players and player profiles with paginated queries.
- Coach and manager management for authorized owners/managers.
- Evaluation creation, history, and mobile-friendly forms.
- Reports, Pro analytics, CSV/PDF handoff, and academy logo display.
- Subscription package cards, Paystack/M-Pesa checkout via the existing server endpoint, and 30-day read-only/past-due state.
- Push notifications, offline evaluation drafts, camera uploads, and biometric unlock.
- Store-ready Android and iOS builds through Expo EAS after device testing.

## Design

### Styles considered

- Matchday Command Center — 0.07 probability: dark navy surfaces, sharp white panels, energetic pitch-green signals, and compact operational cards.
- Academy Ledger — 0.06 probability: warm ivory canvas, navy typography, and restrained data-table hierarchy.
- Floodlight Minimal — 0.05 probability: bright white canvas with electric blue highlights and large, spacious score-like metrics.

### Selected style: Matchday Command Center

- **Design Movement:** Modern football operations console with the clarity of a matchday control room.
- **Core Principles:** Immediate identity, clear role boundaries, one-thumb actions, and calm data density.
- **Color Philosophy:** Deep navy anchors trust and focus; a pitch-green accent signals progress and active states; cool white cards keep operational information readable.
- **Layout Paradigm:** A vertical command rail and stacked cards rather than a dense desktop grid; the primary action stays within comfortable thumb reach.
- **Signature Elements:** Rounded score cards, thin pitch-line dividers, and a compact academy identity lockup at the top of every signed-in screen.
- **Interaction Philosophy:** Every tap should confirm context first—who is signed in, which academy is active, and what the user can do.
- **Animation:** Use short fades and 150–220ms slide transitions for session and tab changes; avoid decorative motion that competes with data entry.
- **Typography System:** System sans for native legibility, with bold display weights for academy identity and metrics and regular body text for operational descriptions.
- **Brand Essence:** Player development operations that keep every academy moving forward; focused, trusted, practical.
- **Brand Voice:** Direct and encouraging. Example: “Ruiru Stars Academy, ready for the next session.” and “Keep player progress visible.”
- **Wordmark & Mark:** Reuse the existing Touchline footballer mark for the launcher and in-app identity lockup; do not invent a second logo.
- **Signature Brand Color:** Touchline pitch green, used sparingly for active state, primary actions, and progress indicators against navy.

## Project structure

- `app/`: Expo Router screens for entry, authentication, dashboard, and role-based tabs.
- `components/`: reusable mobile cards, identity header, buttons, and status treatments.
- `hooks/`: auth and academy-context state with stale-request protection.
- `lib/touchline/`: Supabase client, role/profile/academy queries, and mobile API helpers.
- `constants/`: app branding, public runtime values, role labels, and palette extensions.
- `assets/images/`: Touchline launcher, splash, and adaptive icon assets.
- `server/`: retain the starter server for the mobile runtime; privileged Touchline operations remain on the existing web API until explicitly migrated.

## Shared backend boundary

The mobile app uses only the public Supabase URL and publishable key in the client bundle. Supabase RLS remains authoritative for reads. Paystack secrets, service-role access, webhook processing, subscription mutation, platform administration, and other privileged operations remain server-side in the existing Touchline web application/API.

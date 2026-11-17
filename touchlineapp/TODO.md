# Touchline Mobile outcomes

## Shared authentication and account context

- [x] Existing Touchline users can open the mobile app and sign in with the same email and password used on the web application.
- [x] The mobile app persists the authenticated session securely on native devices and restores it without showing stale academy data from a previous user.
- [x] The mobile app loads the signed-in user profile, active membership, role, academy name, academy status, and subscription state from the existing Touchline Supabase project.
- [x] Role selection clearly distinguishes Academy Owner, Academy Manager, Coach, and Super Admin login, and the selected role is verified against the user’s actual Touchline role.
- [x] When the app opens, the supplied Touchline football image is centered on screen while the workspace loads for at least 3.5 seconds and no more than 5 seconds before the entry flow appears.
- [x] The entry flow presents roles in this order: Super Admin, Academy Owner, Academy Manager, and Coach.
- [x] Tapping a role opens its login form in a modal rather than placing every login form below the role sections.
- [x] A new academy owner can tap “Create your academy workspace” and continue through the existing Touchline onboarding flow, using the same credentials for mobile and web without creating duplicate accounts.
- [x] Users without an active membership, users with the wrong selected role, suspended workspaces, and expired subscriptions receive clear mobile-safe messages.

## Touchline mobile identity and dashboard

- [x] The mobile app uses the Touchline football mark for launcher, splash, and in-app identity assets.
- [x] The mobile entry experience is app-style rather than a copy of the marketing website: compact Touchline branding, short workspace description, role portals, feature summary, and 14-day academy onboarding.
- [x] The supplied football mark is displayed clearly on the splash, login entry, dashboard identity headers, and signed-in account panel.
- [x] Every signed-in user can open the account side panel to see their name, email, role, academy/workspace, and a clear Log out action.
- [x] Every signed-in role sees an immediate identity header containing the user’s name, role, and academy name where applicable.
- [x] Academy Owners see subscription context and owner navigation without exposing billing controls to Managers or Coaches.
- [x] Academy Managers see normal academy operations without owner-only billing, branding, or platform controls.
- [x] Coaches see their player and evaluation work without academy subscription details.
- [x] Super Admin access remains separated from academy workspaces and is not granted by a normal academy membership.
- [x] Super Admin mobile Overview mirrors the web platform dashboard with active academies, workspace status, subscription plan/status, period or trial end date, players, evaluations, coaches, and managers.
- [x] Super Admin mobile academy cards expose the web management actions: Add Academy, Manage Academy, Suspend/Reactivate, Change Package with reason, and permanent Delete with confirmation.
- [x] Academy Owners, Managers, and Coaches receive role-specific Overview copy, academy subscription context, operational metrics, and quick actions from the shared workspace data.
- [x] Academy-role dashboard quick actions open the Players, Evaluations, or More workspace instead of being display-only cards.

## Shared academy workflows
- [x] Mobile provides role-protected Managers, Coaches, Reports, Activity History, and Settings workspaces reachable from More, using the same Touchline account and API records as the web app.
- [ ] Players, coaches, managers, evaluations, reports, academy logo, subscription state, and activity history use the same records as the web application.
- [x] Mobile reads use Supabase RLS and privileged mutations continue through secure Touchline server APIs; no service-role or Paystack secret is bundled into the app.
- [x] The mobile app supports password recovery and authentication deep links without breaking the existing web recovery flow.
- [x] The app remains touch-first and responsive in portrait mode on Android, iOS, and Expo Web Preview.

## Billing and release readiness

- [x] Academy Owners can select Starter, Standard, or Pro and start the existing Paystack M-Pesa checkout through the secure server endpoint.
- [ ] Verified payment updates the shared subscription record and the mobile app displays the same 30-day period and past-due/read-only state as the web app.
- [ ] Android and iOS test builds are verified on real devices before store submission.
- [ ] Store metadata, privacy policy, support details, icons, signing, and EAS build configuration are prepared before public release.

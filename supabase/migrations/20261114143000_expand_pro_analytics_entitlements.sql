-- Make the Pro package's advanced analytics and support benefits explicit so
-- the database, API, and UI can enforce and explain the same entitlements.
UPDATE public.subscription_plans
SET
  description = 'Complete academy intelligence, reporting, and priority support for established academies.',
  feature_summary = ARRAY[
    'Unlimited players',
    'Everything in Standard',
    'Up to 20 coach accounts',
    'Up to 5 Academy Managers',
    'Player development trends and progress tracking',
    'Team, category, season, and coach comparisons',
    'Advanced PDF, CSV, and academy exports',
    'Coach activity insights',
    'Priority support and onboarding assistance'
  ]::TEXT[],
  feature_flags = ARRAY[
    'player_profiles',
    'evaluations',
    'coach_accounts',
    'academy_dashboard',
    'reports',
    'activity_history',
    'advanced_analytics',
    'player_development_trends',
    'team_category_comparisons',
    'coach_activity_insights',
    'advanced_exports',
    'priority_support'
  ]::TEXT[],
  updated_at = NOW()
WHERE plan_key = 'pro';
***

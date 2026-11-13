-- Update the Touchline package catalog:
-- Starter: KES 3,000/month, up to 50 players, 5 coaches.
-- Standard: KES 5,000/month, up to 100 players, 15 coaches.
-- Pro: KES 7,000/month, unlimited players, 20 coaches.

-- Preserve existing subscriptions and payment history while renaming the plan key.
UPDATE public.academy_subscriptions
SET plan_key = 'standard'
WHERE plan_key = 'growth';

UPDATE public.academy_payments
SET plan_key = 'standard'
WHERE plan_key = 'growth';

INSERT INTO public.subscription_plans (
  plan_key,
  name,
  description,
  amount,
  currency,
  player_limit,
  coach_limit,
  feature_summary,
  feature_flags,
  active,
  display_order
)
VALUES (
  'standard',
  'Standard',
  'More capacity and features for growing academies.',
  5000,
  'KES',
  100,
  15,
  ARRAY[
    'Up to 100 players',
    'Everything in Starter',
    'Up to 15 coach accounts',
    'Reports and activity history'
  ]::TEXT[],
  ARRAY[
    'player_profiles',
    'evaluations',
    'coach_accounts',
    'academy_dashboard',
    'reports',
    'activity_history'
  ]::TEXT[],
  TRUE,
  2
)
ON CONFLICT (plan_key) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  amount = EXCLUDED.amount,
  currency = EXCLUDED.currency,
  player_limit = EXCLUDED.player_limit,
  coach_limit = EXCLUDED.coach_limit,
  feature_summary = EXCLUDED.feature_summary,
  feature_flags = EXCLUDED.feature_flags,
  active = EXCLUDED.active,
  display_order = EXCLUDED.display_order,
  updated_at = NOW();

UPDATE public.subscription_plans
SET
  name = 'Starter',
  amount = 3000,
  currency = 'KES',
  player_limit = 50,
  coach_limit = 5,
  feature_summary = ARRAY[
    'Up to 50 players',
    'Player profiles and evaluations',
    'Up to 5 coach accounts',
    'Academy dashboard'
  ]::TEXT[],
  feature_flags = ARRAY[
    'player_profiles',
    'evaluations',
    'coach_accounts',
    'academy_dashboard'
  ]::TEXT[],
  active = TRUE,
  display_order = 1,
  updated_at = NOW()
WHERE plan_key = 'starter';

UPDATE public.subscription_plans
SET
  name = 'Pro',
  amount = 7000,
  currency = 'KES',
  player_limit = NULL,
  coach_limit = 20,
  feature_summary = ARRAY[
    'Unlimited players',
    'Everything in Standard',
    'Up to 20 coach accounts',
    'Advanced analytics and priority support'
  ]::TEXT[],
  feature_flags = ARRAY[
    'player_profiles',
    'evaluations',
    'coach_accounts',
    'academy_dashboard',
    'reports',
    'activity_history',
    'advanced_analytics',
    'priority_support'
  ]::TEXT[],
  active = TRUE,
  display_order = 3,
  updated_at = NOW()
WHERE plan_key = 'pro';

DELETE FROM public.subscription_plans
WHERE plan_key = 'growth';

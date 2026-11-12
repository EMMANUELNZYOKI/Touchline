-- Touchline package entitlements.
-- Trial academies use Starter limits until they activate a paid package.
ALTER TABLE public.subscription_plans
  ADD COLUMN IF NOT EXISTS coach_limit INTEGER;

ALTER TABLE public.subscription_plans
  ADD COLUMN IF NOT EXISTS feature_flags TEXT[] NOT NULL DEFAULT '{}';

UPDATE public.subscription_plans
SET
  coach_limit = CASE plan_key
    WHEN 'starter' THEN 5
    WHEN 'growth' THEN 15
    WHEN 'pro' THEN 20
    ELSE coach_limit
  END,
  feature_flags = CASE plan_key
    WHEN 'starter' THEN ARRAY['player_profiles', 'evaluations', 'coach_accounts', 'academy_dashboard']::TEXT[]
    WHEN 'growth' THEN ARRAY['player_profiles', 'evaluations', 'coach_accounts', 'academy_dashboard', 'reports', 'activity_history']::TEXT[]
    WHEN 'pro' THEN ARRAY['player_profiles', 'evaluations', 'coach_accounts', 'academy_dashboard', 'reports', 'activity_history', 'advanced_analytics', 'priority_support']::TEXT[]
    ELSE feature_flags
  END,
  feature_summary = CASE plan_key
    WHEN 'starter' THEN ARRAY[
      'Up to 30 players',
      'Player profiles and evaluations',
      'Up to 5 coach accounts',
      'Academy dashboard'
    ]::TEXT[]
    WHEN 'growth' THEN ARRAY[
      'Up to 100 players',
      'Everything in Starter',
      'Up to 15 coach accounts',
      'Reports and activity history'
    ]::TEXT[]
    WHEN 'pro' THEN ARRAY[
      'Unlimited players',
      'Everything in Growth',
      'Up to 20 coach accounts',
      'Advanced analytics and priority support'
    ]::TEXT[]
    ELSE feature_summary
  END,
  updated_at = NOW()
WHERE plan_key IN ('starter', 'growth', 'pro');

CREATE OR REPLACE FUNCTION public.has_academy_feature(
  p_academy_id UUID,
  p_feature TEXT
)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.academy_subscriptions AS s
    JOIN public.subscription_plans AS sp ON sp.plan_key = s.plan_key
    WHERE s.academy_id = p_academy_id
      AND s.status IN ('trialing', 'active')
      AND (s.status = 'active' OR (s.trial_ends_at IS NOT NULL AND s.trial_ends_at > NOW()))
      AND p_feature = ANY(sp.feature_flags)
  );
$$;

REVOKE ALL ON FUNCTION public.has_academy_feature(UUID, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_academy_feature(UUID, TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION private.enforce_academy_coach_limit()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  package_limit INTEGER;
  current_coaches INTEGER;
BEGIN
  IF NEW.role <> 'coach' OR NEW.status <> 'active' THEN
    RETURN NEW;
  END IF;

  SELECT sp.coach_limit
  INTO package_limit
  FROM public.academy_subscriptions AS s
  JOIN public.subscription_plans AS sp ON sp.plan_key = s.plan_key
  WHERE s.academy_id = NEW.academy_id
    AND s.status IN ('trialing', 'active')
    AND (s.status = 'active' OR (s.trial_ends_at IS NOT NULL AND s.trial_ends_at > NOW()));

  IF package_limit IS NULL THEN
    RAISE EXCEPTION 'This academy does not have an active package for coach accounts'
      USING ERRCODE = 'check_violation';
  END IF;

  SELECT COUNT(*)::INTEGER
  INTO current_coaches
  FROM public.academy_memberships
  WHERE academy_id = NEW.academy_id
    AND role = 'coach'
    AND status = 'active'
    AND (TG_OP <> 'UPDATE' OR user_id <> NEW.user_id);

  IF current_coaches >= package_limit THEN
    RAISE EXCEPTION 'The selected subscription package allows up to % active coach accounts', package_limit
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION private.enforce_academy_coach_limit() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS enforce_academy_coach_limit ON public.academy_memberships;
CREATE TRIGGER enforce_academy_coach_limit
  BEFORE INSERT OR UPDATE OF role, status, academy_id, user_id ON public.academy_memberships
  FOR EACH ROW
  EXECUTE FUNCTION private.enforce_academy_coach_limit();

COMMENT ON COLUMN public.subscription_plans.coach_limit IS
  'Maximum number of active coach memberships allowed by this package.';
COMMENT ON COLUMN public.subscription_plans.feature_flags IS
  'Machine-readable entitlements used to gate package features.';

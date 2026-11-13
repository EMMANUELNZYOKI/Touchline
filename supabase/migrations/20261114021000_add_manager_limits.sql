-- Manager entitlements: owners can delegate daily operations without making
-- the manager role unlimited on every package.
ALTER TABLE public.subscription_plans
  ADD COLUMN IF NOT EXISTS manager_limit INTEGER;

UPDATE public.subscription_plans
SET
  manager_limit = CASE plan_key
    WHEN 'starter' THEN 1
    WHEN 'standard' THEN 3
    WHEN 'pro' THEN 5
    ELSE manager_limit
  END,
  feature_summary = CASE plan_key
    WHEN 'starter' THEN ARRAY[
      'Up to 50 players',
      'Player profiles and evaluations',
      'Up to 5 coach accounts',
      '1 Academy Manager',
      'Academy dashboard'
    ]::TEXT[]
    WHEN 'standard' THEN ARRAY[
      'Up to 100 players',
      'Everything in Starter',
      'Up to 15 coach accounts',
      'Up to 3 Academy Managers',
      'Reports and activity history'
    ]::TEXT[]
    WHEN 'pro' THEN ARRAY[
      'Unlimited players',
      'Everything in Standard',
      'Up to 20 coach accounts',
      'Up to 5 Academy Managers',
      'Advanced analytics and priority support'
    ]::TEXT[]
    ELSE feature_summary
  END,
  updated_at = NOW()
WHERE plan_key IN ('starter', 'standard', 'pro');

CREATE OR REPLACE FUNCTION private.enforce_academy_manager_limit()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  package_limit INTEGER;
  current_managers INTEGER;
BEGIN
  IF NEW.role <> 'academy_manager' OR NEW.status <> 'active' THEN
    RETURN NEW;
  END IF;

  SELECT sp.manager_limit
  INTO package_limit
  FROM public.academy_subscriptions AS s
  JOIN public.subscription_plans AS sp ON sp.plan_key = s.plan_key
  WHERE s.academy_id = NEW.academy_id
    AND s.status IN ('trialing', 'active')
    AND (s.status = 'active' OR (s.trial_ends_at IS NOT NULL AND s.trial_ends_at > NOW()));

  IF package_limit IS NULL THEN
    RAISE EXCEPTION 'This academy does not have an active package for manager accounts'
      USING ERRCODE = 'check_violation';
  END IF;

  SELECT COUNT(*)::INTEGER
  INTO current_managers
  FROM public.academy_memberships
  WHERE academy_id = NEW.academy_id
    AND role = 'academy_manager'
    AND status = 'active'
    AND (TG_OP <> 'UPDATE' OR user_id <> NEW.user_id);

  IF current_managers >= package_limit THEN
    RAISE EXCEPTION 'The selected subscription package allows up to % active manager accounts', package_limit
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION private.enforce_academy_manager_limit() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS enforce_academy_manager_limit ON public.academy_memberships;
CREATE TRIGGER enforce_academy_manager_limit
  BEFORE INSERT OR UPDATE OF role, status, academy_id, user_id ON public.academy_memberships
  FOR EACH ROW
  EXECUTE FUNCTION private.enforce_academy_manager_limit();

COMMENT ON COLUMN public.subscription_plans.manager_limit IS
  'Maximum number of active Academy Manager memberships allowed by this package.';

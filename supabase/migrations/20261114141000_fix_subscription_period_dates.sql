-- Active subscriptions receive a precise 30-day period from activation.
-- Backfill older active records that did not previously store an end date.
UPDATE public.academy_subscriptions
SET current_period_start = COALESCE(current_period_start, updated_at, NOW()),
    current_period_end = COALESCE(current_period_end, COALESCE(current_period_start, updated_at, NOW()) + INTERVAL '30 days'),
    updated_at = NOW()
WHERE status = 'active'
  AND current_period_end IS NULL;

CREATE OR REPLACE FUNCTION public.set_platform_academy_state(
  p_academy_id UUID,
  p_academy_status TEXT,
  p_subscription_status TEXT
)
RETURNS VOID
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  previous_subscription_status TEXT;
BEGIN
  IF p_academy_status NOT IN ('active', 'suspended') THEN
    RAISE EXCEPTION 'Invalid academy status';
  END IF;
  IF p_subscription_status NOT IN ('trialing', 'active', 'past_due', 'canceled', 'paused') THEN
    RAISE EXCEPTION 'Invalid subscription status';
  END IF;

  UPDATE public.academies
  SET status = p_academy_status, updated_at = NOW()
  WHERE id = p_academy_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Academy not found';
  END IF;

  SELECT status
  INTO previous_subscription_status
  FROM public.academy_subscriptions
  WHERE academy_id = p_academy_id
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Academy subscription not found';
  END IF;

  IF p_subscription_status = 'active' AND previous_subscription_status <> 'active' THEN
    UPDATE public.academy_subscriptions
    SET status = 'active',
        trial_ends_at = NULL,
        current_period_start = NOW(),
        current_period_end = NOW() + INTERVAL '30 days',
        provider = 'manual',
        updated_at = NOW()
    WHERE academy_id = p_academy_id;
  ELSE
    UPDATE public.academy_subscriptions
    SET status = p_subscription_status, updated_at = NOW()
    WHERE academy_id = p_academy_id;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.set_platform_academy_state(UUID, TEXT, TEXT)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.set_platform_academy_state(UUID, TEXT, TEXT)
  TO service_role;

-- Manual package activation follows the same exact 30-day period rule.
CREATE OR REPLACE FUNCTION public.set_platform_academy_package(
  p_academy_id UUID,
  p_plan_key TEXT,
  p_reason TEXT,
  p_changed_by UUID
)
RETURNS TABLE (
  previous_plan_key TEXT,
  new_plan_key TEXT,
  subscription_status TEXT
)
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  current_plan TEXT;
  current_status TEXT;
  existing_period_end TIMESTAMPTZ;
  next_period_end TIMESTAMPTZ;
BEGIN
  IF length(trim(p_reason)) < 3 OR length(trim(p_reason)) > 500 THEN
    RAISE EXCEPTION 'A package change reason must be between 3 and 500 characters';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.platform_admins WHERE user_id = p_changed_by
  ) THEN
    RAISE EXCEPTION 'Only a platform administrator can change packages';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.subscription_plans
    WHERE plan_key = p_plan_key AND active = TRUE
  ) THEN
    RAISE EXCEPTION 'The selected subscription package is not available';
  END IF;
  SELECT s.plan_key, s.status, s.current_period_end
  INTO current_plan, current_status, existing_period_end
  FROM public.academy_subscriptions AS s
  WHERE s.academy_id = p_academy_id
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Academy subscription not found';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.academies WHERE id = p_academy_id) THEN
    RAISE EXCEPTION 'Academy not found';
  END IF;
  IF current_plan = p_plan_key AND current_status = 'active' THEN
    RAISE EXCEPTION 'The academy is already active on this package';
  END IF;
  next_period_end := CASE
    WHEN current_status = 'active' AND existing_period_end IS NOT NULL AND existing_period_end > NOW()
      THEN existing_period_end
    ELSE NOW() + INTERVAL '30 days'
  END;
  UPDATE public.academy_subscriptions
  SET plan_key = p_plan_key,
      status = 'active',
      trial_ends_at = NULL,
      current_period_start = NOW(),
      current_period_end = next_period_end,
      provider = 'manual',
      updated_at = NOW()
  WHERE academy_id = p_academy_id;
  INSERT INTO public.platform_subscription_changes (
    academy_id, previous_plan_key, new_plan_key, previous_status, new_status, reason, changed_by
  ) VALUES (
    p_academy_id, current_plan, p_plan_key, current_status, 'active', trim(p_reason), p_changed_by
  );
  RETURN QUERY SELECT current_plan, p_plan_key, 'active'::TEXT;
END;
$$;
REVOKE ALL ON FUNCTION public.set_platform_academy_package(UUID, TEXT, TEXT, UUID)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.set_platform_academy_package(UUID, TEXT, TEXT, UUID)
  TO service_role;

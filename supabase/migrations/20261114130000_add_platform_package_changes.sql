-- Audited manual package changes performed by Touchline platform operators.
CREATE TABLE IF NOT EXISTS public.platform_subscription_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id UUID NOT NULL REFERENCES public.academies(id) ON DELETE CASCADE,
  previous_plan_key TEXT NOT NULL,
  new_plan_key TEXT NOT NULL,
  previous_status TEXT NOT NULL,
  new_status TEXT NOT NULL,
  reason TEXT NOT NULL CHECK (length(trim(reason)) BETWEEN 3 AND 500),
  changed_by UUID NOT NULL REFERENCES public.platform_admins(user_id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.platform_subscription_changes ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.platform_subscription_changes FROM PUBLIC, anon, authenticated;

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
    ELSE NOW() + INTERVAL '1 month'
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
    academy_id,
    previous_plan_key,
    new_plan_key,
    previous_status,
    new_status,
    reason,
    changed_by
  ) VALUES (
    p_academy_id,
    current_plan,
    p_plan_key,
    current_status,
    'active',
    trim(p_reason),
    p_changed_by
  );

  RETURN QUERY SELECT current_plan, p_plan_key, 'active'::TEXT;
END;
$$;

REVOKE ALL ON FUNCTION public.set_platform_academy_package(UUID, TEXT, TEXT, UUID)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.set_platform_academy_package(UUID, TEXT, TEXT, UUID)
  TO service_role;

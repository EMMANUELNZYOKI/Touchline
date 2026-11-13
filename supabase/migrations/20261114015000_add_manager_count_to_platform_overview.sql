-- Extend the trusted platform overview with active Academy Manager counts.
-- PostgreSQL requires replacing the function when its TABLE return shape changes.
DROP FUNCTION IF EXISTS public.platform_academy_overview();

CREATE FUNCTION public.platform_academy_overview()
RETURNS TABLE (
  academy_id UUID,
  academy_name TEXT,
  slug TEXT,
  academy_status TEXT,
  created_at TIMESTAMPTZ,
  plan_key TEXT,
  subscription_status TEXT,
  trial_ends_at TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  player_count BIGINT,
  evaluation_count BIGINT,
  coach_count BIGINT,
  academy_admin_count BIGINT,
  manager_count BIGINT
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT a.id, a.name, a.slug, a.status, a.created_at,
         s.plan_key, s.status, s.trial_ends_at, s.current_period_end,
         count(DISTINCT p.id), count(DISTINCT e.id),
         count(DISTINCT m.user_id) FILTER (WHERE m.role = 'coach'),
         count(DISTINCT m.user_id) FILTER (WHERE m.role = 'academy_admin'),
         count(DISTINCT m.user_id) FILTER (WHERE m.role = 'academy_manager')
  FROM public.academies AS a
  LEFT JOIN public.academy_subscriptions AS s ON s.academy_id = a.id
  LEFT JOIN public.players AS p ON p.academy_id = a.id
  LEFT JOIN public.player_evaluations AS e ON e.academy_id = a.id
  LEFT JOIN public.academy_memberships AS m
    ON m.academy_id = a.id AND m.status = 'active'
  GROUP BY a.id, s.plan_key, s.status, s.trial_ends_at, s.current_period_end
  ORDER BY a.created_at DESC;
$$;

REVOKE ALL ON FUNCTION public.platform_academy_overview() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.platform_academy_overview() TO service_role;

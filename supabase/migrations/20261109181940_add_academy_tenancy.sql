-- Touchline tenant foundation.
-- Apply after the existing single-academy schema migrations have been applied.
-- The Dios data is migrated into one initial tenant; no platform administrator is
-- seeded here. Provision the first platform_admins row through a trusted process.

CREATE TABLE IF NOT EXISTS public.academies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.academy_memberships (
  academy_id UUID NOT NULL REFERENCES public.academies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('academy_admin', 'coach')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'invited', 'suspended')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (academy_id, user_id)
);

CREATE INDEX IF NOT EXISTS academy_memberships_user_status_idx
  ON public.academy_memberships (user_id, status, academy_id);
CREATE INDEX IF NOT EXISTS academy_memberships_academy_role_idx
  ON public.academy_memberships (academy_id, role, status);
-- The current academy portal has no workspace switcher yet. Allow multiple
-- historical/invited memberships, but only one active academy per user until
-- a deliberate tenant-switch UX is added.
CREATE UNIQUE INDEX IF NOT EXISTS academy_memberships_one_active_academy_per_user_idx
  ON public.academy_memberships (user_id)
  WHERE status = 'active';

-- Platform operators are intentionally separate from academy membership roles.
-- This table has no client-side insert/update policy; seed the first row only
-- through the platform bootstrap flow or an owner-run SQL statement.
CREATE TABLE IF NOT EXISTS public.platform_admins (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Subscription state is separated from academy profile settings so academy
-- administrators cannot alter their own plan or billing status.
CREATE TABLE IF NOT EXISTS public.academy_subscriptions (
  academy_id UUID PRIMARY KEY REFERENCES public.academies(id) ON DELETE CASCADE,
  plan_key TEXT NOT NULL DEFAULT 'starter',
  status TEXT NOT NULL DEFAULT 'trialing'
    CHECK (status IN ('trialing', 'active', 'past_due', 'canceled', 'paused')),
  trial_ends_at TIMESTAMPTZ,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  provider TEXT,
  provider_customer_id TEXT,
  provider_subscription_id TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.players ADD COLUMN IF NOT EXISTS academy_id UUID;
ALTER TABLE public.player_evaluations ADD COLUMN IF NOT EXISTS academy_id UUID;
ALTER TABLE public.admin_activity_logs ADD COLUMN IF NOT EXISTS academy_id UUID;

-- The existing single-academy app is represented as the first tenant. Preserve
-- its identity and move its existing application data into this tenant.
INSERT INTO public.academies (name, slug)
VALUES ('Dios Soccer Academy', 'dios-soccer-academy')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.academy_subscriptions (academy_id, plan_key, status)
SELECT id, 'starter', 'trialing'
FROM public.academies
WHERE slug = 'dios-soccer-academy'
ON CONFLICT (academy_id) DO NOTHING;

UPDATE public.players AS p
SET academy_id = a.id
FROM public.academies AS a
WHERE a.slug = 'dios-soccer-academy'
  AND p.academy_id IS NULL;

UPDATE public.player_evaluations AS e
SET academy_id = p.academy_id
FROM public.players AS p
WHERE p.id = e.player_id
  AND e.academy_id IS NULL;

UPDATE public.admin_activity_logs AS l
SET academy_id = a.id
FROM public.academies AS a
WHERE a.slug = 'dios-soccer-academy'
  AND l.academy_id IS NULL;

-- Translate legacy single-installation roles into academy-scoped memberships.
INSERT INTO public.academy_memberships (academy_id, user_id, role, status)
SELECT a.id, p.id,
       CASE WHEN p.role = 'super_admin' THEN 'academy_admin' ELSE 'coach' END,
       CASE WHEN COALESCE(p.is_active, TRUE) THEN 'active' ELSE 'suspended' END
FROM public.profiles AS p
CROSS JOIN public.academies AS a
WHERE a.slug = 'dios-soccer-academy'
  AND p.role IN ('super_admin', 'coach')
ON CONFLICT (academy_id, user_id) DO NOTHING;

-- Any legacy player rows must have a tenant before tenant_id becomes required.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.players WHERE academy_id IS NULL) THEN
    RAISE EXCEPTION 'Tenant backfill failed: players remain without academy_id';
  END IF;
  IF EXISTS (SELECT 1 FROM public.player_evaluations WHERE academy_id IS NULL) THEN
    RAISE EXCEPTION 'Tenant backfill failed: evaluations remain without academy_id';
  END IF;
  IF EXISTS (SELECT 1 FROM public.admin_activity_logs WHERE academy_id IS NULL) THEN
    RAISE EXCEPTION 'Tenant backfill failed: activity logs remain without academy_id';
  END IF;
END;
$$;

ALTER TABLE public.players ALTER COLUMN academy_id SET NOT NULL;
ALTER TABLE public.player_evaluations ALTER COLUMN academy_id SET NOT NULL;
-- Keep academy_id nullable on platform-wide activity records; academy-scoped
-- activity entries should always provide it.

ALTER TABLE public.players
  ADD CONSTRAINT players_academy_id_fkey
  FOREIGN KEY (academy_id) REFERENCES public.academies(id) ON DELETE CASCADE;
ALTER TABLE public.player_evaluations
  ADD CONSTRAINT player_evaluations_academy_id_fkey
  FOREIGN KEY (academy_id) REFERENCES public.academies(id) ON DELETE CASCADE;
ALTER TABLE public.admin_activity_logs
  ADD CONSTRAINT admin_activity_logs_academy_id_fkey
  FOREIGN KEY (academy_id) REFERENCES public.academies(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS players_academy_created_idx
  ON public.players (academy_id, created_at DESC);
CREATE INDEX IF NOT EXISTS players_academy_coach_idx
  ON public.players (academy_id, coach_id);
CREATE INDEX IF NOT EXISTS evaluations_academy_created_idx
  ON public.player_evaluations (academy_id, created_at DESC);
CREATE INDEX IF NOT EXISTS evaluations_academy_player_idx
  ON public.player_evaluations (academy_id, player_id, created_at DESC);
CREATE INDEX IF NOT EXISTS activity_academy_created_idx
  ON public.admin_activity_logs (academy_id, created_at DESC);

-- Ensure an evaluation cannot reference a player from a different academy.
ALTER TABLE public.players
  ADD CONSTRAINT players_academy_id_id_key UNIQUE (academy_id, id);
ALTER TABLE public.player_evaluations
  ADD CONSTRAINT evaluations_player_same_academy_fkey
  FOREIGN KEY (academy_id, player_id)
  REFERENCES public.players (academy_id, id) ON DELETE CASCADE;

CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.platform_admins AS pa
    WHERE pa.user_id = (SELECT auth.uid())
  );
$$;

CREATE OR REPLACE FUNCTION public.has_academy_role(
  p_academy_id UUID,
  p_roles TEXT[] DEFAULT ARRAY['academy_admin', 'coach']::TEXT[]
)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.academy_memberships AS am
    JOIN public.academies AS a ON a.id = am.academy_id
    WHERE am.academy_id = p_academy_id
      AND am.user_id = (SELECT auth.uid())
      AND am.status = 'active'
      AND a.status = 'active'
      AND am.role = ANY (p_roles)
  );
$$;

CREATE OR REPLACE FUNCTION public.shares_active_academy_with(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.academy_memberships AS mine
    JOIN public.academy_memberships AS theirs
      ON theirs.academy_id = mine.academy_id
    JOIN public.academies AS a ON a.id = mine.academy_id
    WHERE mine.user_id = (SELECT auth.uid())
      AND theirs.user_id = p_user_id
      AND mine.status = 'active'
      AND theirs.status = 'active'
      AND a.status = 'active'
  );
$$;

REVOKE ALL ON FUNCTION public.is_platform_admin() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.has_academy_role(UUID, TEXT[]) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.shares_active_academy_with(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_platform_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_academy_role(UUID, TEXT[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.shares_active_academy_with(UUID) TO authenticated;

-- Retain the existing evaluated-player status feature but scope it to the
-- caller's academy; the pre-tenant helper returned IDs across the whole DB.
CREATE OR REPLACE FUNCTION public.get_evaluated_player_ids()
RETURNS TABLE (player_id UUID)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT DISTINCT pe.player_id
  FROM public.player_evaluations AS pe
  WHERE public.has_academy_role(pe.academy_id)
    AND pe.season = COALESCE(NULLIF((
      SELECT p.season FROM public.players AS p WHERE p.id = pe.player_id
    ), ''), 'UNSPECIFIED')
    AND pe.season_year = EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER;
$$;
REVOKE ALL ON FUNCTION public.get_evaluated_player_ids() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_evaluated_player_ids() TO authenticated;

ALTER TABLE public.academies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academy_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academy_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_activity_logs ENABLE ROW LEVEL SECURITY;

-- Replace the legacy single-academy policies. This prevents an old permissive
-- policy (such as authenticated-users-can-read-all-players) from OR-ing around
-- the new tenant checks.
DO $$
DECLARE
  target_table TEXT;
  policy_name TEXT;
BEGIN
  FOREACH target_table IN ARRAY ARRAY[
    'academies', 'academy_memberships', 'platform_admins',
    'academy_subscriptions', 'profiles', 'players',
    'player_evaluations', 'admin_activity_logs'
  ] LOOP
    FOR policy_name IN
      SELECT policyname FROM pg_policies
      WHERE schemaname = 'public' AND tablename = target_table
    LOOP
      EXECUTE format('DROP POLICY %I ON public.%I', policy_name, target_table);
    END LOOP;
  END LOOP;
END;
$$;

-- Platform-admin authority is distinct from any academy role. Platform
-- management mutations are performed only by verified server functions using
-- the service role after checking platform_admins.
CREATE POLICY platform_admins_read_self
  ON public.platform_admins FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY academies_read_member_or_platform
  ON public.academies FOR SELECT TO authenticated
  USING (
    public.is_platform_admin()
    OR public.has_academy_role(id)
  );
CREATE POLICY memberships_read_self_or_academy_admin
  ON public.academy_memberships FOR SELECT TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    OR public.has_academy_role(academy_id, ARRAY['academy_admin']::TEXT[])
  );
CREATE POLICY memberships_manage_academy_admin
  ON public.academy_memberships FOR ALL TO authenticated
  USING (public.has_academy_role(academy_id, ARRAY['academy_admin']::TEXT[]))
  WITH CHECK (public.has_academy_role(academy_id, ARRAY['academy_admin']::TEXT[]));

CREATE POLICY subscriptions_read_member_or_platform
  ON public.academy_subscriptions FOR SELECT TO authenticated
  USING (
    public.is_platform_admin()
    OR public.has_academy_role(academy_id)
  );
CREATE POLICY profiles_read_self_or_shared_academy
  ON public.profiles FOR SELECT TO authenticated
  USING (
    id = (SELECT auth.uid())
    OR public.shares_active_academy_with(id)
  );
CREATE POLICY profiles_update_self
  ON public.profiles FOR UPDATE TO authenticated
  USING (id = (SELECT auth.uid()))
  WITH CHECK (id = (SELECT auth.uid()));

CREATE POLICY players_read_academy_member
  ON public.players FOR SELECT TO authenticated
  USING (public.has_academy_role(academy_id));
CREATE POLICY players_manage_academy_admin
  ON public.players FOR ALL TO authenticated
  USING (public.has_academy_role(academy_id, ARRAY['academy_admin']::TEXT[]))
  WITH CHECK (public.has_academy_role(academy_id, ARRAY['academy_admin']::TEXT[]));

CREATE POLICY evaluations_read_academy_member
  ON public.player_evaluations FOR SELECT TO authenticated
  USING (public.has_academy_role(academy_id));
CREATE POLICY evaluations_insert_own_coach_or_admin
  ON public.player_evaluations FOR INSERT TO authenticated
  WITH CHECK (
    public.has_academy_role(academy_id, ARRAY['academy_admin']::TEXT[])
    OR (coach_id = (SELECT auth.uid())
        AND public.has_academy_role(academy_id, ARRAY['coach']::TEXT[]))
  );
CREATE POLICY evaluations_update_own_coach_or_admin
  ON public.player_evaluations FOR UPDATE TO authenticated
  USING (
    public.has_academy_role(academy_id, ARRAY['academy_admin']::TEXT[])
    OR (coach_id = (SELECT auth.uid())
        AND public.has_academy_role(academy_id, ARRAY['coach']::TEXT[]))
  )
  WITH CHECK (
    public.has_academy_role(academy_id, ARRAY['academy_admin']::TEXT[])
    OR (coach_id = (SELECT auth.uid())
        AND public.has_academy_role(academy_id, ARRAY['coach']::TEXT[]))
  );
CREATE POLICY evaluations_delete_admin_only
  ON public.player_evaluations FOR DELETE TO authenticated
  USING (public.has_academy_role(academy_id, ARRAY['academy_admin']::TEXT[]));

CREATE POLICY activity_read_academy_admin
  ON public.admin_activity_logs FOR SELECT TO authenticated
  USING (
    academy_id IS NOT NULL
    AND public.has_academy_role(academy_id, ARRAY['academy_admin']::TEXT[])
  );
CREATE POLICY activity_insert_actor_academy_admin
  ON public.admin_activity_logs FOR INSERT TO authenticated
  WITH CHECK (
    actor_id = (SELECT auth.uid())
    AND academy_id IS NOT NULL
    AND public.has_academy_role(academy_id, ARRAY['academy_admin']::TEXT[])
  );

-- The existing Dios client does not yet send academy_id. Resolve it from the
-- signed-in user's single active membership during this transition. Once the
-- academy selector is implemented, requests may send academy_id explicitly;
-- membership checks still run in RLS. This never trusts a client-supplied
-- tenant on its own.
CREATE OR REPLACE FUNCTION public.assign_player_academy_id()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  membership_count INTEGER;
  membership_academy UUID;
BEGIN
  IF (SELECT auth.uid()) IS NULL OR public.is_platform_admin() THEN
    RETURN NEW;
  END IF;

  IF NEW.academy_id IS NULL THEN
    SELECT count(*), (array_agg(am.academy_id))[1]
    INTO membership_count, membership_academy
    FROM public.academy_memberships AS am
    JOIN public.academies AS a ON a.id = am.academy_id
    WHERE am.user_id = (SELECT auth.uid())
      AND am.status = 'active'
      AND a.status = 'active';
    IF membership_count <> 1 THEN
      RAISE EXCEPTION 'Select exactly one active academy before creating a player';
    END IF;
    NEW.academy_id := membership_academy;
  ELSIF NOT public.has_academy_role(NEW.academy_id, ARRAY['academy_admin']::TEXT[]) THEN
    RAISE EXCEPTION 'You are not an administrator of this academy';
  END IF;

  IF TG_OP = 'UPDATE' AND NEW.academy_id <> OLD.academy_id THEN
    RAISE EXCEPTION 'Player records cannot be moved between academies';
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.assign_evaluation_academy_id()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  player_academy UUID;
BEGIN
  SELECT p.academy_id INTO player_academy
  FROM public.players AS p WHERE p.id = NEW.player_id;
  IF player_academy IS NULL THEN
    RAISE EXCEPTION 'Player not found or has no academy';
  END IF;
  IF NEW.academy_id IS NULL THEN
    NEW.academy_id := player_academy;
  ELSIF NEW.academy_id <> player_academy THEN
    RAISE EXCEPTION 'Evaluation and player must belong to the same academy';
  END IF;

  IF (SELECT auth.uid()) IS NOT NULL AND NOT public.is_platform_admin()
     AND NOT public.has_academy_role(NEW.academy_id) THEN
    RAISE EXCEPTION 'You are not a member of this academy';
  END IF;
  IF TG_OP = 'UPDATE' AND NEW.academy_id <> OLD.academy_id THEN
    RAISE EXCEPTION 'Evaluations cannot be moved between academies';
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.assign_activity_academy_id()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  membership_count INTEGER;
  membership_academy UUID;
BEGIN
  IF (SELECT auth.uid()) IS NULL OR public.is_platform_admin() THEN
    RETURN NEW;
  END IF;
  IF NEW.actor_id <> (SELECT auth.uid()) THEN
    RAISE EXCEPTION 'Activity actor must be the signed-in user';
  END IF;
  IF NEW.academy_id IS NULL THEN
    SELECT count(*), (array_agg(am.academy_id))[1]
    INTO membership_count, membership_academy
    FROM public.academy_memberships AS am
    JOIN public.academies AS a ON a.id = am.academy_id
    WHERE am.user_id = (SELECT auth.uid())
      AND am.role = 'academy_admin'
      AND am.status = 'active'
      AND a.status = 'active';
    IF membership_count <> 1 THEN
      RAISE EXCEPTION 'Select exactly one active academy before recording activity';
    END IF;
    NEW.academy_id := membership_academy;
  ELSIF NOT public.has_academy_role(NEW.academy_id, ARRAY['academy_admin']::TEXT[]) THEN
    RAISE EXCEPTION 'You are not an administrator of this academy';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS players_assign_academy_id ON public.players;
CREATE TRIGGER players_assign_academy_id
  BEFORE INSERT OR UPDATE OF academy_id ON public.players
  FOR EACH ROW EXECUTE FUNCTION public.assign_player_academy_id();
DROP TRIGGER IF EXISTS evaluations_assign_academy_id ON public.player_evaluations;
CREATE TRIGGER evaluations_assign_academy_id
  BEFORE INSERT OR UPDATE OF academy_id, player_id ON public.player_evaluations
  FOR EACH ROW EXECUTE FUNCTION public.assign_evaluation_academy_id();
DROP TRIGGER IF EXISTS activity_assign_academy_id ON public.admin_activity_logs;
CREATE TRIGGER activity_assign_academy_id
  BEFORE INSERT OR UPDATE OF academy_id ON public.admin_activity_logs
  FOR EACH ROW EXECUTE FUNCTION public.assign_activity_academy_id();

REVOKE ALL ON FUNCTION public.assign_player_academy_id() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.assign_evaluation_academy_id() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.assign_activity_academy_id() FROM PUBLIC;

-- Keep the old profile.role column for a gradual UI transition, but do not let
-- browser users promote themselves to the legacy super_admin value.
REVOKE UPDATE ON public.profiles FROM authenticated;
GRANT UPDATE (full_name, phone) ON public.profiles TO authenticated;

-- Aggregate overview is intentionally callable only by trusted server code.
CREATE OR REPLACE FUNCTION public.platform_academy_overview()
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
  academy_admin_count BIGINT
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
         count(DISTINCT m.user_id) FILTER (WHERE m.role = 'academy_admin')
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
  UPDATE public.academy_subscriptions
  SET status = p_subscription_status, updated_at = NOW()
  WHERE academy_id = p_academy_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Academy subscription not found';
  END IF;
END;
$$;
REVOKE ALL ON FUNCTION public.set_platform_academy_state(UUID, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.set_platform_academy_state(UUID, TEXT, TEXT) TO service_role;

CREATE OR REPLACE FUNCTION public.create_platform_academy(
  p_name TEXT,
  p_slug TEXT
)
RETURNS UUID
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  new_academy_id UUID;
BEGIN
  IF length(trim(p_name)) < 2 OR length(trim(p_name)) > 160 THEN
    RAISE EXCEPTION 'Academy name must be between 2 and 160 characters';
  END IF;
  IF p_slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$' OR length(p_slug) > 80 THEN
    RAISE EXCEPTION 'Academy slug must use lowercase letters, digits, and hyphens';
  END IF;
  INSERT INTO public.academies (name, slug)
  VALUES (trim(p_name), p_slug)
  RETURNING id INTO new_academy_id;
  INSERT INTO public.academy_subscriptions (academy_id, plan_key, status)
  VALUES (new_academy_id, 'starter', 'trialing');
  RETURN new_academy_id;
END;
$$;
REVOKE ALL ON FUNCTION public.create_platform_academy(TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_platform_academy(TEXT, TEXT) TO service_role;

-- Platform users receive no direct table writes through authenticated RLS; the
-- server-side platform functions use service role only after checking the
-- caller against platform_admins. Academy writes continue through tenant RLS.
COMMENT ON TABLE public.platform_admins IS
  'Touchline platform operators; deliberately separate from academy memberships.';
COMMENT ON TABLE public.academy_memberships IS
  'Academy-scoped roles. Academy admins and coaches receive no cross-tenant access.';
COMMENT ON TABLE public.academy_subscriptions IS
  'Billing state managed only by Touchline platform operations.';

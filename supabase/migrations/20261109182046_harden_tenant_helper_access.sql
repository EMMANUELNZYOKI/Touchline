-- RLS helper functions are implementation details, not public RPC endpoints.
-- Keep them in an unexposed schema and grant only the EXECUTE needed by RLS.
CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon, authenticated;
GRANT USAGE ON SCHEMA private TO authenticated;

CREATE OR REPLACE FUNCTION private.is_platform_admin()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.platform_admins AS pa
    WHERE pa.user_id = (SELECT auth.uid())
  );
$$;

CREATE OR REPLACE FUNCTION private.has_academy_role(
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

CREATE OR REPLACE FUNCTION private.shares_active_academy_with(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.academy_memberships AS mine
    JOIN public.academy_memberships AS theirs ON theirs.academy_id = mine.academy_id
    JOIN public.academies AS a ON a.id = mine.academy_id
    WHERE mine.user_id = (SELECT auth.uid())
      AND theirs.user_id = p_user_id
      AND mine.status = 'active'
      AND theirs.status = 'active'
      AND a.status = 'active'
  );
$$;

REVOKE ALL ON FUNCTION private.is_platform_admin() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION private.has_academy_role(UUID, TEXT[]) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION private.shares_active_academy_with(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.is_platform_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION private.has_academy_role(UUID, TEXT[]) TO authenticated;
GRANT EXECUTE ON FUNCTION private.shares_active_academy_with(UUID) TO authenticated;

DROP POLICY academies_read_member_or_platform ON public.academies;
CREATE POLICY academies_read_member_or_platform
  ON public.academies FOR SELECT TO authenticated
  USING (private.is_platform_admin() OR private.has_academy_role(id));

DROP POLICY memberships_read_self_or_academy_admin ON public.academy_memberships;
CREATE POLICY memberships_read_self_or_academy_admin
  ON public.academy_memberships FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()) OR private.has_academy_role(academy_id, ARRAY['academy_admin']::TEXT[]));
DROP POLICY memberships_manage_academy_admin ON public.academy_memberships;
CREATE POLICY memberships_manage_academy_admin
  ON public.academy_memberships FOR ALL TO authenticated
  USING (private.has_academy_role(academy_id, ARRAY['academy_admin']::TEXT[]))
  WITH CHECK (private.has_academy_role(academy_id, ARRAY['academy_admin']::TEXT[]));

DROP POLICY subscriptions_read_member_or_platform ON public.academy_subscriptions;
CREATE POLICY subscriptions_read_member_or_platform
  ON public.academy_subscriptions FOR SELECT TO authenticated
  USING (private.is_platform_admin() OR private.has_academy_role(academy_id));

DROP POLICY profiles_read_self_or_shared_academy ON public.profiles;
CREATE POLICY profiles_read_self_or_shared_academy
  ON public.profiles FOR SELECT TO authenticated
  USING (id = (SELECT auth.uid()) OR private.shares_active_academy_with(id));

DROP POLICY players_read_academy_member ON public.players;
CREATE POLICY players_read_academy_member
  ON public.players FOR SELECT TO authenticated
  USING (private.has_academy_role(academy_id));
DROP POLICY players_manage_academy_admin ON public.players;
CREATE POLICY players_manage_academy_admin
  ON public.players FOR ALL TO authenticated
  USING (private.has_academy_role(academy_id, ARRAY['academy_admin']::TEXT[]))
  WITH CHECK (private.has_academy_role(academy_id, ARRAY['academy_admin']::TEXT[]));

DROP POLICY evaluations_read_academy_member ON public.player_evaluations;
CREATE POLICY evaluations_read_academy_member
  ON public.player_evaluations FOR SELECT TO authenticated
  USING (private.has_academy_role(academy_id));
DROP POLICY evaluations_insert_own_coach_or_admin ON public.player_evaluations;
CREATE POLICY evaluations_insert_own_coach_or_admin
  ON public.player_evaluations FOR INSERT TO authenticated
  WITH CHECK (
    private.has_academy_role(academy_id, ARRAY['academy_admin']::TEXT[])
    OR (coach_id = (SELECT auth.uid()) AND private.has_academy_role(academy_id, ARRAY['coach']::TEXT[]))
  );
DROP POLICY evaluations_update_own_coach_or_admin ON public.player_evaluations;
CREATE POLICY evaluations_update_own_coach_or_admin
  ON public.player_evaluations FOR UPDATE TO authenticated
  USING (
    private.has_academy_role(academy_id, ARRAY['academy_admin']::TEXT[])
    OR (coach_id = (SELECT auth.uid()) AND private.has_academy_role(academy_id, ARRAY['coach']::TEXT[]))
  )
  WITH CHECK (
    private.has_academy_role(academy_id, ARRAY['academy_admin']::TEXT[])
    OR (coach_id = (SELECT auth.uid()) AND private.has_academy_role(academy_id, ARRAY['coach']::TEXT[]))
  );
DROP POLICY evaluations_delete_admin_only ON public.player_evaluations;
CREATE POLICY evaluations_delete_admin_only
  ON public.player_evaluations FOR DELETE TO authenticated
  USING (private.has_academy_role(academy_id, ARRAY['academy_admin']::TEXT[]));

DROP POLICY activity_read_academy_admin ON public.admin_activity_logs;
CREATE POLICY activity_read_academy_admin
  ON public.admin_activity_logs FOR SELECT TO authenticated
  USING (academy_id IS NOT NULL AND private.has_academy_role(academy_id, ARRAY['academy_admin']::TEXT[]));
DROP POLICY activity_insert_actor_academy_admin ON public.admin_activity_logs;
CREATE POLICY activity_insert_actor_academy_admin
  ON public.admin_activity_logs FOR INSERT TO authenticated
  WITH CHECK (
    actor_id = (SELECT auth.uid())
    AND academy_id IS NOT NULL
    AND private.has_academy_role(academy_id, ARRAY['academy_admin']::TEXT[])
  );

CREATE OR REPLACE FUNCTION public.assign_player_academy_id()
RETURNS TRIGGER LANGUAGE PLPGSQL SECURITY DEFINER SET search_path = ''
AS $$
DECLARE membership_count INTEGER; membership_academy UUID;
BEGIN
  IF (SELECT auth.uid()) IS NULL OR private.is_platform_admin() THEN RETURN NEW; END IF;
  IF NEW.academy_id IS NULL THEN
    SELECT count(*), (array_agg(am.academy_id))[1]
    INTO membership_count, membership_academy
    FROM public.academy_memberships AS am
    JOIN public.academies AS a ON a.id = am.academy_id
    WHERE am.user_id = (SELECT auth.uid()) AND am.status = 'active' AND a.status = 'active';
    IF membership_count <> 1 THEN RAISE EXCEPTION 'Select exactly one active academy before creating a player'; END IF;
    NEW.academy_id := membership_academy;
  ELSIF NOT private.has_academy_role(NEW.academy_id, ARRAY['academy_admin']::TEXT[]) THEN
    RAISE EXCEPTION 'You are not an administrator of this academy';
  END IF;
  IF TG_OP = 'UPDATE' AND NEW.academy_id <> OLD.academy_id THEN RAISE EXCEPTION 'Player records cannot be moved between academies'; END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.assign_evaluation_academy_id()
RETURNS TRIGGER LANGUAGE PLPGSQL SECURITY DEFINER SET search_path = ''
AS $$
DECLARE player_academy UUID;
BEGIN
  SELECT p.academy_id INTO player_academy FROM public.players AS p WHERE p.id = NEW.player_id;
  IF player_academy IS NULL THEN RAISE EXCEPTION 'Player not found or has no academy'; END IF;
  IF NEW.academy_id IS NULL THEN NEW.academy_id := player_academy;
  ELSIF NEW.academy_id <> player_academy THEN RAISE EXCEPTION 'Evaluation and player must belong to the same academy'; END IF;
  IF (SELECT auth.uid()) IS NOT NULL AND NOT private.is_platform_admin() AND NOT private.has_academy_role(NEW.academy_id) THEN
    RAISE EXCEPTION 'You are not a member of this academy';
  END IF;
  IF TG_OP = 'UPDATE' AND NEW.academy_id <> OLD.academy_id THEN RAISE EXCEPTION 'Evaluations cannot be moved between academies'; END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.assign_activity_academy_id()
RETURNS TRIGGER LANGUAGE PLPGSQL SECURITY DEFINER SET search_path = ''
AS $$
DECLARE membership_count INTEGER; membership_academy UUID;
BEGIN
  IF (SELECT auth.uid()) IS NULL OR private.is_platform_admin() THEN RETURN NEW; END IF;
  IF NEW.actor_id <> (SELECT auth.uid()) THEN RAISE EXCEPTION 'Activity actor must be the signed-in user'; END IF;
  IF NEW.academy_id IS NULL THEN
    SELECT count(*), (array_agg(am.academy_id))[1]
    INTO membership_count, membership_academy
    FROM public.academy_memberships AS am
    JOIN public.academies AS a ON a.id = am.academy_id
    WHERE am.user_id = (SELECT auth.uid()) AND am.role = 'academy_admin' AND am.status = 'active' AND a.status = 'active';
    IF membership_count <> 1 THEN RAISE EXCEPTION 'Select exactly one active academy before recording activity'; END IF;
    NEW.academy_id := membership_academy;
  ELSIF NOT private.has_academy_role(NEW.academy_id, ARRAY['academy_admin']::TEXT[]) THEN
    RAISE EXCEPTION 'You are not an administrator of this academy';
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.assign_player_academy_id() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.assign_evaluation_academy_id() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.assign_activity_academy_id() FROM PUBLIC, anon, authenticated;

-- This helper now runs with the caller's RLS, so it no longer needs definer privileges.
CREATE OR REPLACE FUNCTION public.get_evaluated_player_ids()
RETURNS TABLE (player_id UUID)
LANGUAGE SQL
STABLE
SECURITY INVOKER
SET search_path = ''
AS $$
  SELECT DISTINCT pe.player_id
  FROM public.player_evaluations AS pe
  JOIN public.players AS p ON p.id = pe.player_id
  WHERE private.has_academy_role(pe.academy_id)
    AND pe.season = COALESCE(NULLIF(p.season, ''), 'UNSPECIFIED')
    AND pe.season_year = EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER;
$$;
REVOKE ALL ON FUNCTION public.get_evaluated_player_ids() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_evaluated_player_ids() TO authenticated;

-- Public-schema copies are unused by policies and must not remain callable over REST.
REVOKE ALL ON FUNCTION public.is_platform_admin() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.has_academy_role(UUID, TEXT[]) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.shares_active_academy_with(UUID) FROM PUBLIC, anon, authenticated;

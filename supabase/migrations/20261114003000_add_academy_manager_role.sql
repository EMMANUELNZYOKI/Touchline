-- Academy owners remain academy_admin. Academy managers receive normal
-- operational access without billing, branding, or manager-administration access.

ALTER TABLE public.academy_memberships
  DROP CONSTRAINT IF EXISTS academy_memberships_role_check;
ALTER TABLE public.academy_memberships
  ADD CONSTRAINT academy_memberships_role_check
  CHECK (role IN ('academy_admin', 'academy_manager', 'coach'));

CREATE OR REPLACE FUNCTION private.has_academy_role(
  p_academy_id UUID,
  p_roles TEXT[] DEFAULT ARRAY['academy_admin', 'academy_manager', 'coach']::TEXT[]
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

-- Managers can inspect the academy roster, but only owners can change
-- memberships or create/deactivate managers through owner-only server actions.
DROP POLICY IF EXISTS memberships_read_self_or_academy_admin ON public.academy_memberships;
CREATE POLICY memberships_read_self_or_academy_admin
  ON public.academy_memberships FOR SELECT TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    OR private.has_academy_role(academy_id, ARRAY['academy_admin', 'academy_manager']::TEXT[])
  );

-- Managers can operate the player/evaluation workflow.
DROP POLICY IF EXISTS players_manage_academy_admin ON public.players;
CREATE POLICY players_manage_academy_admin
  ON public.players FOR ALL TO authenticated
  USING (
    private.has_academy_role(academy_id, ARRAY['academy_admin', 'academy_manager']::TEXT[])
    AND private.academy_can_write(academy_id)
  )
  WITH CHECK (
    private.has_academy_role(academy_id, ARRAY['academy_admin', 'academy_manager']::TEXT[])
    AND private.academy_can_write(academy_id)
  );

DROP POLICY IF EXISTS evaluations_insert_own_coach_or_admin ON public.player_evaluations;
CREATE POLICY evaluations_insert_own_coach_or_admin
  ON public.player_evaluations FOR INSERT TO authenticated
  WITH CHECK (
    private.academy_can_write(academy_id)
    AND (
      private.has_academy_role(academy_id, ARRAY['academy_admin', 'academy_manager']::TEXT[])
      OR (coach_id = (SELECT auth.uid())
          AND private.has_academy_role(academy_id, ARRAY['coach']::TEXT[]))
    )
  );

DROP POLICY IF EXISTS evaluations_update_own_coach_or_admin ON public.player_evaluations;
CREATE POLICY evaluations_update_own_coach_or_admin
  ON public.player_evaluations FOR UPDATE TO authenticated
  USING (
    private.academy_can_write(academy_id)
    AND (
      private.has_academy_role(academy_id, ARRAY['academy_admin', 'academy_manager']::TEXT[])
      OR (coach_id = (SELECT auth.uid())
          AND private.has_academy_role(academy_id, ARRAY['coach']::TEXT[]))
    )
  )
  WITH CHECK (
    private.academy_can_write(academy_id)
    AND (
      private.has_academy_role(academy_id, ARRAY['academy_admin', 'academy_manager']::TEXT[])
      OR (coach_id = (SELECT auth.uid())
          AND private.has_academy_role(academy_id, ARRAY['coach']::TEXT[]))
    )
  );

DROP POLICY IF EXISTS evaluations_delete_admin_only ON public.player_evaluations;
CREATE POLICY evaluations_delete_admin_only
  ON public.player_evaluations FOR DELETE TO authenticated
  USING (
    private.has_academy_role(academy_id, ARRAY['academy_admin', 'academy_manager']::TEXT[])
    AND private.academy_can_write(academy_id)
  );

DROP POLICY IF EXISTS activity_read_academy_admin ON public.admin_activity_logs;
CREATE POLICY activity_read_academy_admin
  ON public.admin_activity_logs FOR SELECT TO authenticated
  USING (
    academy_id IS NOT NULL
    AND private.has_academy_role(academy_id, ARRAY['academy_admin', 'academy_manager']::TEXT[])
  );

DROP POLICY IF EXISTS activity_insert_actor_academy_admin ON public.admin_activity_logs;
CREATE POLICY activity_insert_actor_academy_admin
  ON public.admin_activity_logs FOR INSERT TO authenticated
  WITH CHECK (
    actor_id = (SELECT auth.uid())
    AND academy_id IS NOT NULL
    AND private.has_academy_role(academy_id, ARRAY['academy_admin', 'academy_manager']::TEXT[])
    AND private.academy_can_write(academy_id)
  );

-- Managers may manage player photos as part of normal player operations.
DROP POLICY IF EXISTS players_bucket_insert_academy_member ON storage.objects;
CREATE POLICY players_bucket_insert_academy_member
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'players'
    AND private.has_academy_role(
      CASE WHEN (storage.foldername(name))[1] ~* '^[0-9a-f-]{36}$'
           THEN ((storage.foldername(name))[1])::UUID ELSE NULL END
    )
    AND private.academy_can_write(
      CASE WHEN (storage.foldername(name))[1] ~* '^[0-9a-f-]{36}$'
           THEN ((storage.foldername(name))[1])::UUID ELSE NULL END
    )
  );

DROP POLICY IF EXISTS players_bucket_update_academy_member ON storage.objects;
CREATE POLICY players_bucket_update_academy_member
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'players'
    AND private.has_academy_role(
      CASE WHEN (storage.foldername(name))[1] ~* '^[0-9a-f-]{36}$'
           THEN ((storage.foldername(name))[1])::UUID ELSE NULL END
    )
    AND private.academy_can_write(
      CASE WHEN (storage.foldername(name))[1] ~* '^[0-9a-f-]{36}$'
           THEN ((storage.foldername(name))[1])::UUID ELSE NULL END
    )
  )
  WITH CHECK (
    bucket_id = 'players'
    AND private.has_academy_role(
      CASE WHEN (storage.foldername(name))[1] ~* '^[0-9a-f-]{36}$'
           THEN ((storage.foldername(name))[1])::UUID ELSE NULL END
    )
    AND private.academy_can_write(
      CASE WHEN (storage.foldername(name))[1] ~* '^[0-9a-f-]{36}$'
           THEN ((storage.foldername(name))[1])::UUID ELSE NULL END
    )
  );

DROP POLICY IF EXISTS players_bucket_delete_academy_member ON storage.objects;
CREATE POLICY players_bucket_delete_academy_member
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'players'
    AND private.has_academy_role(
      CASE WHEN (storage.foldername(name))[1] ~* '^[0-9a-f-]{36}$'
           THEN ((storage.foldername(name))[1])::UUID ELSE NULL END
    )
    AND private.academy_can_write(
      CASE WHEN (storage.foldername(name))[1] ~* '^[0-9a-f-]{36}$'
           THEN ((storage.foldername(name))[1])::UUID ELSE NULL END
    )
  );

COMMENT ON COLUMN public.academy_memberships.role IS
  'academy_admin is the academy owner; academy_manager handles operations; coach evaluates players.';

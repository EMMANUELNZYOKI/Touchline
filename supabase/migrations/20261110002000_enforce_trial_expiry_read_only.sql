-- After the 14-day starter trial ends, preserve read access but deny academy writes.
-- Paid/activated subscriptions remain writable; trialing subscriptions are writable
-- only while trial_ends_at is in the future. Missing or inactive billing state is
-- read-only by default.
CREATE OR REPLACE FUNCTION private.academy_can_write(p_academy_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.academies AS a
    JOIN public.academy_subscriptions AS s ON s.academy_id = a.id
    WHERE a.id = p_academy_id
      AND a.status = 'active'
      AND (
        s.status = 'active'
        OR (s.status = 'trialing' AND s.trial_ends_at IS NOT NULL AND s.trial_ends_at > NOW())
      )
  );
$$;
REVOKE ALL ON FUNCTION private.academy_can_write(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.academy_can_write(UUID) TO authenticated;

-- Admins may manage academy users while billing is active; preserve the existing
-- separate SELECT policy so expired customers can still inspect their roster.
DROP POLICY IF EXISTS memberships_manage_academy_admin ON public.academy_memberships;
CREATE POLICY memberships_manage_academy_admin
  ON public.academy_memberships FOR ALL TO authenticated
  USING (
    private.has_academy_role(academy_id, ARRAY['academy_admin']::TEXT[])
    AND private.academy_can_write(academy_id)
  )
  WITH CHECK (
    private.has_academy_role(academy_id, ARRAY['academy_admin']::TEXT[])
    AND private.academy_can_write(academy_id)
  );

-- Player records remain visible to academy members but become immutable after expiry.
DROP POLICY IF EXISTS players_manage_academy_admin ON public.players;
CREATE POLICY players_manage_academy_admin
  ON public.players FOR ALL TO authenticated
  USING (
    private.has_academy_role(academy_id, ARRAY['academy_admin']::TEXT[])
    AND private.academy_can_write(academy_id)
  )
  WITH CHECK (
    private.has_academy_role(academy_id, ARRAY['academy_admin']::TEXT[])
    AND private.academy_can_write(academy_id)
  );

-- Neither coach evaluations nor admin edits/deletes are allowed after expiry.
DROP POLICY IF EXISTS evaluations_insert_own_coach_or_admin ON public.player_evaluations;
CREATE POLICY evaluations_insert_own_coach_or_admin
  ON public.player_evaluations FOR INSERT TO authenticated
  WITH CHECK (
    private.academy_can_write(academy_id)
    AND (
      private.has_academy_role(academy_id, ARRAY['academy_admin']::TEXT[])
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
      private.has_academy_role(academy_id, ARRAY['academy_admin']::TEXT[])
      OR (coach_id = (SELECT auth.uid())
          AND private.has_academy_role(academy_id, ARRAY['coach']::TEXT[]))
    )
  )
  WITH CHECK (
    private.academy_can_write(academy_id)
    AND (
      private.has_academy_role(academy_id, ARRAY['academy_admin']::TEXT[])
      OR (coach_id = (SELECT auth.uid())
          AND private.has_academy_role(academy_id, ARRAY['coach']::TEXT[]))
    )
  );

DROP POLICY IF EXISTS evaluations_delete_admin_only ON public.player_evaluations;
CREATE POLICY evaluations_delete_admin_only
  ON public.player_evaluations FOR DELETE TO authenticated
  USING (
    private.has_academy_role(academy_id, ARRAY['academy_admin']::TEXT[])
    AND private.academy_can_write(academy_id)
  );

DROP POLICY IF EXISTS activity_insert_actor_academy_admin ON public.admin_activity_logs;
CREATE POLICY activity_insert_actor_academy_admin
  ON public.admin_activity_logs FOR INSERT TO authenticated
  WITH CHECK (
    actor_id = (SELECT auth.uid())
    AND academy_id IS NOT NULL
    AND private.has_academy_role(academy_id, ARRAY['academy_admin']::TEXT[])
    AND private.academy_can_write(academy_id)
  );

-- Player photos are private, readable to members, and not mutable in read-only mode.
DROP POLICY IF EXISTS players_bucket_insert_academy_member ON storage.objects;
CREATE POLICY players_bucket_insert_academy_member
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'players'
    AND private.has_academy_role(
      CASE
        WHEN (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
        THEN ((storage.foldername(name))[1])::UUID
        ELSE NULL
      END
    )
    AND private.academy_can_write(
      CASE
        WHEN (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
        THEN ((storage.foldername(name))[1])::UUID
        ELSE NULL
      END
    )
  );

DROP POLICY IF EXISTS players_bucket_update_academy_member ON storage.objects;
CREATE POLICY players_bucket_update_academy_member
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'players'
    AND private.has_academy_role(
      CASE
        WHEN (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
        THEN ((storage.foldername(name))[1])::UUID
        ELSE NULL
      END
    )
    AND private.academy_can_write(
      CASE
        WHEN (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
        THEN ((storage.foldername(name))[1])::UUID
        ELSE NULL
      END
    )
  )
  WITH CHECK (
    bucket_id = 'players'
    AND private.has_academy_role(
      CASE
        WHEN (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
        THEN ((storage.foldername(name))[1])::UUID
        ELSE NULL
      END
    )
    AND private.academy_can_write(
      CASE
        WHEN (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
        THEN ((storage.foldername(name))[1])::UUID
        ELSE NULL
      END
    )
  );

DROP POLICY IF EXISTS players_bucket_delete_academy_member ON storage.objects;
CREATE POLICY players_bucket_delete_academy_member
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'players'
    AND private.has_academy_role(
      CASE
        WHEN (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
        THEN ((storage.foldername(name))[1])::UUID
        ELSE NULL
      END
    )
    AND private.academy_can_write(
      CASE
        WHEN (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
        THEN ((storage.foldername(name))[1])::UUID
        ELSE NULL
      END
    )
  );

-- Platform-created starter workspaces receive the same 14-day trial window.
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
  INSERT INTO public.academy_subscriptions (academy_id, plan_key, status, trial_ends_at, updated_at)
  VALUES (new_academy_id, 'starter', 'trialing', NOW() + INTERVAL '14 days', NOW());
  RETURN new_academy_id;
END;
$$;
REVOKE ALL ON FUNCTION public.create_platform_academy(TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_platform_academy(TEXT, TEXT) TO service_role;

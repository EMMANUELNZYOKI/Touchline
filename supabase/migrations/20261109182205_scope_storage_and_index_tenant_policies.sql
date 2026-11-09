-- Avoid redundant SELECT-policy evaluation while keeping tenant checks unchanged.
DROP POLICY memberships_manage_academy_admin ON public.academy_memberships;
CREATE POLICY memberships_insert_academy_admin
  ON public.academy_memberships FOR INSERT TO authenticated
  WITH CHECK (private.has_academy_role(academy_id, ARRAY['academy_admin']::TEXT[]));
CREATE POLICY memberships_update_academy_admin
  ON public.academy_memberships FOR UPDATE TO authenticated
  USING (private.has_academy_role(academy_id, ARRAY['academy_admin']::TEXT[]))
  WITH CHECK (private.has_academy_role(academy_id, ARRAY['academy_admin']::TEXT[]));
CREATE POLICY memberships_delete_academy_admin
  ON public.academy_memberships FOR DELETE TO authenticated
  USING (private.has_academy_role(academy_id, ARRAY['academy_admin']::TEXT[]));

DROP POLICY players_manage_academy_admin ON public.players;
CREATE POLICY players_insert_academy_admin
  ON public.players FOR INSERT TO authenticated
  WITH CHECK (private.has_academy_role(academy_id, ARRAY['academy_admin']::TEXT[]));
CREATE POLICY players_update_academy_admin
  ON public.players FOR UPDATE TO authenticated
  USING (private.has_academy_role(academy_id, ARRAY['academy_admin']::TEXT[]))
  WITH CHECK (private.has_academy_role(academy_id, ARRAY['academy_admin']::TEXT[]));
CREATE POLICY players_delete_academy_admin
  ON public.players FOR DELETE TO authenticated
  USING (private.has_academy_role(academy_id, ARRAY['academy_admin']::TEXT[]));

-- Cover ownership foreign keys for deletes/updates and per-coach queries.
CREATE INDEX IF NOT EXISTS players_coach_id_idx ON public.players (coach_id);
CREATE INDEX IF NOT EXISTS evaluations_coach_id_idx ON public.player_evaluations (coach_id);
CREATE INDEX IF NOT EXISTS activity_actor_id_idx ON public.admin_activity_logs (actor_id);

-- Player photos may contain images of minors. Store them privately and require
-- every object key to begin with the owning academy UUID.
INSERT INTO storage.buckets (id, name, public)
VALUES ('players', 'players', FALSE)
ON CONFLICT (id) DO UPDATE SET public = FALSE;

DROP POLICY IF EXISTS players_bucket_read_academy_member ON storage.objects;
CREATE POLICY players_bucket_read_academy_member
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'players'
    AND private.has_academy_role(
      CASE
        WHEN (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
        THEN ((storage.foldername(name))[1])::UUID
        ELSE NULL
      END
    )
  );
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
  );

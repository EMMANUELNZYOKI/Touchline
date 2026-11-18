-- Academy Managers operate the same player workflow as Academy Owners.
-- Keep writes subscription-aware so expired or suspended academies remain read-only.
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

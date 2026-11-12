DROP FUNCTION IF EXISTS public.delete_platform_academy(UUID);

CREATE OR REPLACE FUNCTION public.delete_platform_academy(p_academy_id UUID)
RETURNS UUID[]
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  member_ids UUID[];
BEGIN
  SELECT COALESCE(array_agg(am.user_id), ARRAY[]::UUID[])
  INTO member_ids
  FROM public.academy_memberships AS am
  WHERE am.academy_id = p_academy_id
    AND NOT EXISTS (
      SELECT 1
      FROM public.platform_admins AS pa
      WHERE pa.user_id = am.user_id
    )
    AND NOT EXISTS (
      SELECT 1
      FROM public.academy_memberships AS other_membership
      WHERE other_membership.user_id = am.user_id
        AND other_membership.academy_id <> p_academy_id
    );

  DELETE FROM public.academies WHERE id = p_academy_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Academy workspace not found';
  END IF;

  -- Remove login accounts that belonged only to this deleted workspace.
  -- Profiles and academy memberships cascade from auth.users/public.academies.
  IF cardinality(member_ids) > 0 THEN
    RETURN member_ids;
  END IF;

  RETURN ARRAY[]::UUID[];
END;
$$;

REVOKE ALL ON FUNCTION public.delete_platform_academy(UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.delete_platform_academy(UUID) TO service_role;

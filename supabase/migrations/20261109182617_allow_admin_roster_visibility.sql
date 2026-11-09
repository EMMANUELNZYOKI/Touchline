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
      AND a.status = 'active'
      AND (
        theirs.status = 'active'
        OR private.has_academy_role(mine.academy_id, ARRAY['academy_admin']::TEXT[])
      )
  );
$$;

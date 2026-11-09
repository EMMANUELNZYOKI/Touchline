-- Defense in depth: even if a caller acquires EXECUTE through a future role grant,
-- anonymous requests must never receive evaluated-player IDs.
CREATE OR REPLACE FUNCTION public.get_evaluated_player_ids()
RETURNS TABLE (player_id uuid)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT DISTINCT pe.player_id
  FROM public.player_evaluations AS pe
  WHERE auth.uid() IS NOT NULL;
$$;

REVOKE ALL ON FUNCTION public.get_evaluated_player_ids() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_evaluated_player_ids() TO authenticated;

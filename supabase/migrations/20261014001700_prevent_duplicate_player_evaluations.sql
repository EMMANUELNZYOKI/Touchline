-- A player may be evaluated only once across the academy.
-- Existing data was checked for duplicate player_id values before creating this index.
CREATE UNIQUE INDEX IF NOT EXISTS player_evaluations_player_id_unique_idx
  ON public.player_evaluations (player_id);

-- Coaches' RLS policy intentionally hides other coaches' evaluation details. This RPC
-- reveals only which players have an evaluation, not scores, notes, or evaluator identity.
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

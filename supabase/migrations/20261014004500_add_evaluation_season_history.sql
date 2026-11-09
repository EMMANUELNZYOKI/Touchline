-- Preserve the evaluation period with each snapshot so players can be reevaluated
-- in later seasons and their development can be compared over time.
ALTER TABLE public.player_evaluations
  ADD COLUMN IF NOT EXISTS season text,
  ADD COLUMN IF NOT EXISTS season_year integer;

UPDATE public.player_evaluations AS pe
SET season = COALESCE(NULLIF(p.season, ''), 'UNSPECIFIED'),
    season_year = EXTRACT(YEAR FROM pe.created_at)::integer
FROM public.players AS p
WHERE p.id = pe.player_id
  AND (pe.season IS NULL OR pe.season_year IS NULL);

ALTER TABLE public.player_evaluations
  ALTER COLUMN season SET DEFAULT 'UNSPECIFIED',
  ALTER COLUMN season SET NOT NULL,
  ALTER COLUMN season_year SET DEFAULT EXTRACT(YEAR FROM CURRENT_DATE)::integer,
  ALTER COLUMN season_year SET NOT NULL;

-- Replace the previous academy-wide one-evaluation limit with one per player,
-- per named season, per calendar year. This supports progress comparisons.
DROP INDEX IF EXISTS public.player_evaluations_player_id_unique_idx;
CREATE UNIQUE INDEX IF NOT EXISTS player_evaluations_player_period_unique_idx
  ON public.player_evaluations (player_id, season, season_year);

-- A player is considered evaluated for the currently selected season in the current
-- calendar year. Return only IDs; coach RLS continues to protect scores and notes.
CREATE OR REPLACE FUNCTION public.get_evaluated_player_ids()
RETURNS TABLE (player_id uuid)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT DISTINCT pe.player_id
  FROM public.player_evaluations AS pe
  JOIN public.players AS p ON p.id = pe.player_id
  WHERE auth.uid() IS NOT NULL
    AND pe.season = COALESCE(NULLIF(p.season, ''), 'UNSPECIFIED')
    AND pe.season_year = EXTRACT(YEAR FROM CURRENT_DATE)::integer;
$$;

REVOKE ALL ON FUNCTION public.get_evaluated_player_ids() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_evaluated_player_ids() TO authenticated;

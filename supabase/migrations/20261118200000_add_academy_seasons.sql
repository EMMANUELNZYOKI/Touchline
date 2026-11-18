-- Explicit academy seasons replace the old player-text/calendar-year evaluation period.
CREATE TABLE IF NOT EXISTS public.academy_seasons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id UUID NOT NULL REFERENCES public.academies(id) ON DELETE CASCADE,
  name TEXT NOT NULL CHECK (length(btrim(name)) BETWEEN 1 AND 120),
  starts_on DATE NOT NULL,
  ends_on DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived')),
  is_current BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT academy_seasons_valid_dates CHECK (ends_on >= starts_on)
);

CREATE INDEX IF NOT EXISTS academy_seasons_academy_dates_idx
  ON public.academy_seasons (academy_id, starts_on DESC, ends_on DESC);
CREATE UNIQUE INDEX IF NOT EXISTS academy_seasons_one_current_idx
  ON public.academy_seasons (academy_id) WHERE is_current;

-- Every existing academy receives a safe initial season so no evaluation history is lost.
INSERT INTO public.academy_seasons (academy_id, name, starts_on, ends_on, status, is_current)
SELECT a.id,
       'Initial season',
       make_date(EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER, 1, 1),
       make_date(EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER, 12, 31),
       'active',
       TRUE
FROM public.academies AS a
WHERE NOT EXISTS (
  SELECT 1 FROM public.academy_seasons AS s WHERE s.academy_id = a.id
);

ALTER TABLE public.player_evaluations
  ADD COLUMN IF NOT EXISTS season_id UUID;

UPDATE public.player_evaluations AS e
SET season_id = s.id
FROM public.academy_seasons AS s
WHERE s.academy_id = e.academy_id
  AND s.is_current = TRUE
  AND e.season_id IS NULL;

-- Preserve any legacy duplicate rows as separate historical snapshots instead of
-- deleting them when the new player + season rule is introduced.
DO $$
DECLARE
  duplicate_row RECORD;
  legacy_season UUID;
BEGIN
  FOR duplicate_row IN
    SELECT e.id, e.academy_id, e.player_id,
           ROW_NUMBER() OVER (PARTITION BY e.player_id ORDER BY e.created_at DESC, e.id DESC) AS row_number
    FROM public.player_evaluations AS e
  LOOP
    IF duplicate_row.row_number > 1 THEN
      INSERT INTO public.academy_seasons (academy_id, name, starts_on, ends_on, status, is_current)
      VALUES (
        duplicate_row.academy_id,
        'Legacy historical season ' || duplicate_row.row_number,
        CURRENT_DATE - INTERVAL '2 years',
        CURRENT_DATE - INTERVAL '1 year',
        'completed',
        FALSE
      )
      RETURNING id INTO legacy_season;

      UPDATE public.player_evaluations
      SET season_id = legacy_season
      WHERE id = duplicate_row.id;
    END IF;
  END LOOP;
END;
$$;

ALTER TABLE public.player_evaluations
  ALTER COLUMN season_id SET NOT NULL;

ALTER TABLE public.player_evaluations
  ADD CONSTRAINT player_evaluations_season_id_fkey
  FOREIGN KEY (season_id) REFERENCES public.academy_seasons(id) ON DELETE RESTRICT;

DROP INDEX IF EXISTS public.player_evaluations_player_id_unique_idx;
DROP INDEX IF EXISTS public.player_evaluations_player_period_unique_idx;
CREATE UNIQUE INDEX IF NOT EXISTS player_evaluations_player_season_unique_idx
  ON public.player_evaluations (player_id, season_id);
CREATE INDEX IF NOT EXISTS player_evaluations_season_idx
  ON public.player_evaluations (academy_id, season_id, created_at DESC);

ALTER TABLE public.academy_seasons ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS academy_seasons_read_member ON public.academy_seasons;
CREATE POLICY academy_seasons_read_member
  ON public.academy_seasons FOR SELECT TO authenticated
  USING (private.has_academy_role(academy_id));

DROP POLICY IF EXISTS academy_seasons_manage_admin_manager ON public.academy_seasons;
CREATE POLICY academy_seasons_manage_admin_manager
  ON public.academy_seasons FOR ALL TO authenticated
  USING (private.has_academy_role(academy_id, ARRAY['academy_admin', 'academy_manager']::TEXT[]))
  WITH CHECK (private.has_academy_role(academy_id, ARRAY['academy_admin', 'academy_manager']::TEXT[]));

-- Switch seasons atomically while retaining all prior history.
CREATE OR REPLACE FUNCTION public.set_current_academy_season(p_season_id UUID)
RETURNS VOID
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  target_academy UUID;
BEGIN
  SELECT academy_id INTO target_academy
  FROM public.academy_seasons
  WHERE id = p_season_id;

  IF target_academy IS NULL THEN
    RAISE EXCEPTION 'Season not found';
  END IF;
  IF NOT private.has_academy_role(target_academy, ARRAY['academy_admin', 'academy_manager']::TEXT[]) THEN
    RAISE EXCEPTION 'Only the academy owner or manager can activate a season';
  END IF;

  UPDATE public.academy_seasons
  SET is_current = FALSE,
      status = CASE WHEN status = 'archived' THEN 'archived' ELSE 'completed' END,
      updated_at = NOW()
  WHERE academy_id = target_academy AND id <> p_season_id;

  UPDATE public.academy_seasons
  SET is_current = TRUE,
      status = 'active',
      updated_at = NOW()
  WHERE id = p_season_id;
END;
$$;

REVOKE ALL ON FUNCTION public.set_current_academy_season(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_current_academy_season(UUID) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_evaluated_player_ids()
RETURNS TABLE (player_id UUID)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT DISTINCT pe.player_id
  FROM public.player_evaluations AS pe
  JOIN public.academy_seasons AS s ON s.id = pe.season_id
  WHERE private.has_academy_role(pe.academy_id)
    AND s.status <> 'archived'
    AND ((s.is_current = TRUE AND s.ends_on >= CURRENT_DATE)
      OR CURRENT_DATE BETWEEN s.starts_on AND s.ends_on);
$$;

REVOKE ALL ON FUNCTION public.get_evaluated_player_ids() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_evaluated_player_ids() TO authenticated;

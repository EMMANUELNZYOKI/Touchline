-- Player registration is owned by Super Admins; coaches may read the full roster
-- and create/update only their own evaluations.
ALTER TABLE public.players ALTER COLUMN date_of_birth DROP NOT NULL;
ALTER TABLE public.players ALTER COLUMN gender DROP NOT NULL;
ALTER TABLE public.players ALTER COLUMN position DROP NOT NULL;
ALTER TABLE public.players ADD COLUMN IF NOT EXISTS season TEXT;
ALTER TABLE public.players ADD COLUMN IF NOT EXISTS team_category TEXT;
ALTER TABLE public.players ADD COLUMN IF NOT EXISTS secondary_position TEXT;
ALTER TABLE public.player_evaluations ADD COLUMN IF NOT EXISTS technical_skills JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.player_evaluations ADD COLUMN IF NOT EXISTS tactical_skills JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.player_evaluations ADD COLUMN IF NOT EXISTS physical_skills JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.player_evaluations ADD COLUMN IF NOT EXISTS personality_skills JSONB NOT NULL DEFAULT '{}'::jsonb;

DROP POLICY IF EXISTS "Coaches manage own players" ON public.players;
DROP POLICY IF EXISTS "Super admin view all players" ON public.players;
DROP POLICY IF EXISTS "Players visible to authenticated users" ON public.players;
DROP POLICY IF EXISTS "Super admins manage players" ON public.players;
CREATE POLICY "Players visible to authenticated users" ON public.players
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Super admins manage players" ON public.players
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'super_admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'super_admin'));

DROP POLICY IF EXISTS "Coaches manage own evaluations" ON public.player_evaluations;
DROP POLICY IF EXISTS "Super admin view all evaluations" ON public.player_evaluations;
CREATE POLICY "Coaches manage own evaluations" ON public.player_evaluations
  FOR ALL TO authenticated USING (auth.uid() = coach_id) WITH CHECK (auth.uid() = coach_id);
CREATE POLICY "Super admin view all evaluations" ON public.player_evaluations
  FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'super_admin'));

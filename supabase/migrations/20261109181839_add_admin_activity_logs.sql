CREATE TABLE IF NOT EXISTS public.admin_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  action TEXT NOT NULL CHECK (action IN ('player_created', 'player_updated', 'player_deleted', 'coach_status_changed')),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('player', 'coach')),
  entity_id UUID NOT NULL,
  summary TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS admin_activity_logs_created_at_idx
  ON public.admin_activity_logs (created_at DESC);

CREATE INDEX IF NOT EXISTS admin_activity_logs_entity_idx
  ON public.admin_activity_logs (entity_type, entity_id, created_at DESC);

ALTER TABLE public.admin_activity_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Super admins read admin activity" ON public.admin_activity_logs;
CREATE POLICY "Super admins read admin activity"
  ON public.admin_activity_logs
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'super_admin'
    )
  );

DROP POLICY IF EXISTS "Super admins write admin activity" ON public.admin_activity_logs;
CREATE POLICY "Super admins write admin activity"
  ON public.admin_activity_logs
  FOR INSERT TO authenticated
  WITH CHECK (
    actor_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'super_admin'
    )
  );

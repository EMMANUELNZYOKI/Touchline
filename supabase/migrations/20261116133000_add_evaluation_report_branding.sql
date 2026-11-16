ALTER TABLE public.academies
  ADD COLUMN IF NOT EXISTS report_tagline TEXT NOT NULL DEFAULT 'Transforming Lives Through Football',
  ADD COLUMN IF NOT EXISTS contact_email TEXT,
  ADD COLUMN IF NOT EXISTS contact_phone TEXT;

DROP POLICY IF EXISTS academies_update_member_admin ON public.academies;
CREATE POLICY academies_update_member_admin
  ON public.academies FOR UPDATE TO authenticated
  USING (public.has_academy_role(id, ARRAY['academy_admin']::TEXT[]))
  WITH CHECK (public.has_academy_role(id, ARRAY['academy_admin']::TEXT[]));

GRANT UPDATE (name, slug, report_tagline, contact_email, contact_phone, logo_path)
  ON public.academies TO authenticated;

ALTER TABLE public.academies
  ADD COLUMN IF NOT EXISTS logo_path TEXT;

INSERT INTO storage.buckets (id, name, public)
VALUES ('academy-assets', 'academy-assets', FALSE)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS academy_assets_read_member ON storage.objects;
CREATE POLICY academy_assets_read_member
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'academy-assets'
    AND (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
    AND public.has_academy_role(((storage.foldername(name))[1])::UUID)
  );

DROP POLICY IF EXISTS academy_assets_insert_admin ON storage.objects;
CREATE POLICY academy_assets_insert_admin
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'academy-assets'
    AND (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
    AND public.has_academy_role(((storage.foldername(name))[1])::UUID, ARRAY['academy_admin']::TEXT[])
  );

DROP POLICY IF EXISTS academy_assets_update_admin ON storage.objects;
CREATE POLICY academy_assets_update_admin
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'academy-assets'
    AND (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
    AND public.has_academy_role(((storage.foldername(name))[1])::UUID, ARRAY['academy_admin']::TEXT[])
  )
  WITH CHECK (
    bucket_id = 'academy-assets'
    AND (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
    AND public.has_academy_role(((storage.foldername(name))[1])::UUID, ARRAY['academy_admin']::TEXT[])
  );

DROP POLICY IF EXISTS academy_assets_delete_admin ON storage.objects;
CREATE POLICY academy_assets_delete_admin
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'academy-assets'
    AND (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
    AND public.has_academy_role(((storage.foldername(name))[1])::UUID, ARRAY['academy_admin']::TEXT[])
  );

-- The tenant hardening migration moved active RLS checks to private.has_academy_role.
-- Keep the original SECURITY DEFINER helper executable for legacy policies and
-- already-created objects that still reference public.has_academy_role.
GRANT EXECUTE ON FUNCTION public.has_academy_role(UUID, TEXT[]) TO authenticated;

-- Academy branding was added after tenant hardening; use the private helper
-- consistently so logo access follows the same tenant-isolation rules.
DROP POLICY IF EXISTS academy_assets_read_member ON storage.objects;
CREATE POLICY academy_assets_read_member
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'academy-assets'
    AND (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
    AND private.has_academy_role(((storage.foldername(name))[1])::UUID)
  );

DROP POLICY IF EXISTS academy_assets_insert_admin ON storage.objects;
CREATE POLICY academy_assets_insert_admin
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'academy-assets'
    AND (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
    AND private.has_academy_role(((storage.foldername(name))[1])::UUID, ARRAY['academy_admin']::TEXT[])
  );

DROP POLICY IF EXISTS academy_assets_update_admin ON storage.objects;
CREATE POLICY academy_assets_update_admin
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'academy-assets'
    AND (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
    AND private.has_academy_role(((storage.foldername(name))[1])::UUID, ARRAY['academy_admin']::TEXT[])
  )
  WITH CHECK (
    bucket_id = 'academy-assets'
    AND (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
    AND private.has_academy_role(((storage.foldername(name))[1])::UUID, ARRAY['academy_admin']::TEXT[])
  );

DROP POLICY IF EXISTS academy_assets_delete_admin ON storage.objects;
CREATE POLICY academy_assets_delete_admin
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'academy-assets'
    AND (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
    AND private.has_academy_role(((storage.foldername(name))[1])::UUID, ARRAY['academy_admin']::TEXT[])
  );

-- Public onboarding is completed only through an authenticated server function.
-- This database RPC is executable by service_role only and atomically creates
-- the academy, owner membership, profile, and starter trial subscription.
CREATE OR REPLACE FUNCTION public.complete_academy_onboarding(
  p_owner_user_id UUID,
  p_name TEXT,
  p_slug TEXT,
  p_full_name TEXT,
  p_email TEXT,
  p_phone TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  new_academy_id UUID;
BEGIN
  IF p_owner_user_id IS NULL
     OR p_name IS NULL OR char_length(btrim(p_name)) NOT BETWEEN 2 AND 160
     OR p_slug IS NULL OR p_slug <> lower(p_slug)
     OR p_slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$'
     OR char_length(p_slug) > 80
     OR p_full_name IS NULL OR char_length(btrim(p_full_name)) NOT BETWEEN 2 AND 120
     OR p_email IS NULL OR char_length(btrim(p_email)) > 255
     OR p_phone IS NOT NULL AND char_length(p_phone) > 40 THEN
    RAISE EXCEPTION 'Invalid academy onboarding details';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.academy_memberships AS m
    WHERE m.user_id = p_owner_user_id
  ) THEN
    RAISE EXCEPTION 'This account already has an academy membership';
  END IF;

  INSERT INTO public.profiles (id, full_name, email, role, phone, is_active)
  VALUES (p_owner_user_id, btrim(p_full_name), lower(btrim(p_email)), 'coach', NULLIF(btrim(p_phone), ''), TRUE)
  ON CONFLICT (id) DO UPDATE
    SET full_name = EXCLUDED.full_name,
        email = EXCLUDED.email,
        phone = EXCLUDED.phone;

  INSERT INTO public.academies (name, slug, status)
  VALUES (btrim(p_name), p_slug, 'active')
  RETURNING id INTO new_academy_id;

  INSERT INTO public.academy_memberships (academy_id, user_id, role, status)
  VALUES (new_academy_id, p_owner_user_id, 'academy_admin', 'active');

  INSERT INTO public.academy_subscriptions (
    academy_id, plan_key, status, trial_ends_at, updated_at
  )
  VALUES (
    new_academy_id, 'starter', 'trialing', NOW() + INTERVAL '14 days', NOW()
  );

  RETURN new_academy_id;
END;
$$;

REVOKE ALL ON FUNCTION public.complete_academy_onboarding(UUID, TEXT, TEXT, TEXT, TEXT, TEXT)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.complete_academy_onboarding(UUID, TEXT, TEXT, TEXT, TEXT, TEXT)
  TO service_role;

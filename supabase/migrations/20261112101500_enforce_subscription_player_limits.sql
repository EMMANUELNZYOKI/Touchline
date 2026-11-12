-- Enforce the player capacity defined by the academy's active package.
-- Pro has a NULL player_limit and is therefore unlimited.
CREATE OR REPLACE FUNCTION private.enforce_academy_player_limit()
RETURNS TRIGGER
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  package_limit INTEGER;
  current_players INTEGER;
BEGIN
  SELECT sp.player_limit
  INTO package_limit
  FROM public.academy_subscriptions AS s
  JOIN public.subscription_plans AS sp ON sp.plan_key = s.plan_key
  WHERE s.academy_id = NEW.academy_id
    AND s.status = 'active';

  IF package_limit IS NULL THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' AND OLD.academy_id = NEW.academy_id THEN
    RETURN NEW;
  END IF;

  SELECT COUNT(*)::INTEGER
  INTO current_players
  FROM public.players
  WHERE academy_id = NEW.academy_id;

  IF current_players >= package_limit THEN
    RAISE EXCEPTION 'The selected subscription package allows up to % players', package_limit
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION private.enforce_academy_player_limit() FROM PUBLIC, anon, authenticated;
DROP TRIGGER IF EXISTS enforce_academy_player_limit ON public.players;
CREATE TRIGGER enforce_academy_player_limit
  BEFORE INSERT OR UPDATE OF academy_id ON public.players
  FOR EACH ROW
  EXECUTE FUNCTION private.enforce_academy_player_limit();

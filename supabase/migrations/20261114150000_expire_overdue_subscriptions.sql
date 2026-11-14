-- Expire paid periods without deleting academy data or payment history.
-- past_due keeps the workspace available in read-only mode and allows renewal.
CREATE OR REPLACE FUNCTION public.expire_overdue_subscriptions()
RETURNS INTEGER
LANGUAGE PLPGSQL
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  expired_count INTEGER;
BEGIN
  UPDATE public.academy_subscriptions
  SET status = 'past_due', updated_at = NOW()
  WHERE status = 'active'
    AND current_period_end IS NOT NULL
    AND current_period_end <= NOW();

  GET DIAGNOSTICS expired_count = ROW_COUNT;
  RETURN expired_count;
END;
$$;

REVOKE ALL ON FUNCTION public.expire_overdue_subscriptions() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.expire_overdue_subscriptions() TO service_role;

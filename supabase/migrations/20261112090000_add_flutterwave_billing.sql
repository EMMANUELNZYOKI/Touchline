-- Durable payment attempts and webhook deduplication for Flutterwave billing.
CREATE TABLE IF NOT EXISTS public.academy_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  academy_id UUID NOT NULL REFERENCES public.academies(id) ON DELETE CASCADE,
  provider TEXT NOT NULL DEFAULT 'flutterwave',
  tx_ref TEXT NOT NULL UNIQUE,
  provider_transaction_id TEXT,
  amount NUMERIC(14, 2) NOT NULL CHECK (amount > 0),
  currency TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'successful', 'failed', 'cancelled')),
  payment_type TEXT NOT NULL DEFAULT 'subscription',
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS academy_payments_academy_created_idx
  ON public.academy_payments (academy_id, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS academy_payments_provider_transaction_idx
  ON public.academy_payments (provider, provider_transaction_id)
  WHERE provider_transaction_id IS NOT NULL;
CREATE TABLE IF NOT EXISTS public.payment_webhook_events (
  provider TEXT NOT NULL,
  event_id TEXT NOT NULL,
  event_type TEXT,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (provider, event_id)
);
ALTER TABLE public.academy_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_webhook_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY academy_payments_read_member
  ON public.academy_payments FOR SELECT TO authenticated
  USING (private.has_academy_role(academy_id, ARRAY['academy_admin', 'coach']::TEXT[]));
REVOKE ALL ON public.payment_webhook_events FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.academy_payments FROM anon;
COMMENT ON TABLE public.academy_payments IS
  'Minimal Flutterwave payment records; never store card data or raw webhook payloads.';
COMMENT ON TABLE public.payment_webhook_events IS
  'Provider event IDs used to make webhook processing idempotent.';

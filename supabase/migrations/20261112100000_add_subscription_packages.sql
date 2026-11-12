-- Touchline package catalog. Create matching Flutterwave payment plans, then
-- update flutterwave_plan_id for each row before enabling paid checkout.
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  plan_key TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  amount NUMERIC(14, 2) NOT NULL CHECK (amount > 0),
  currency TEXT NOT NULL DEFAULT 'KES',
  player_limit INTEGER,
  feature_summary TEXT[] NOT NULL DEFAULT '{}',
  flutterwave_plan_id TEXT,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
INSERT INTO public.subscription_plans (
  plan_key, name, description, amount, currency, player_limit, feature_summary, display_order
)
VALUES
  ('starter', 'Starter', 'For small academies getting organized.', 3000, 'KES', 30,
    ARRAY['Up to 30 players', 'Player profiles and evaluations', 'Coach accounts', 'Academy dashboard'], 1),
  ('growth', 'Growth', 'More capacity and features for growing academies.', 6000, 'KES', 100,
    ARRAY['Up to 100 players', 'Everything in Starter', 'More coach capacity', 'Reports and activity history'], 2),
  ('pro', 'Pro', 'Highest limits with priority support.', 9000, 'KES', NULL,
    ARRAY['Unlimited players', 'Everything in Growth', 'Advanced academy capacity', 'Priority support'], 3)
ON CONFLICT (plan_key) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  amount = EXCLUDED.amount,
  currency = EXCLUDED.currency,
  player_limit = EXCLUDED.player_limit,
  feature_summary = EXCLUDED.feature_summary,
  display_order = EXCLUDED.display_order,
  updated_at = NOW();
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY subscription_plans_read_authenticated
  ON public.subscription_plans FOR SELECT TO authenticated
  USING (active = TRUE);
REVOKE INSERT, UPDATE, DELETE ON public.subscription_plans FROM anon, authenticated;
ALTER TABLE public.academy_payments
  ADD COLUMN IF NOT EXISTS plan_key TEXT NOT NULL DEFAULT 'starter';

-- Existing trial records retain starter as their package key. Paid checkouts
-- change this value only after a verified Flutterwave payment.
COMMENT ON TABLE public.subscription_plans IS
  'Touchline package catalog. Flutterwave plan IDs are configured here after the provider plans are created.';

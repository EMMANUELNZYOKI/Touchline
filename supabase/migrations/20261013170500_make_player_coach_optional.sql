-- Super Admins register players before assigning a coach. Keep coach_id for optional assignment,
-- but allow new player records to remain unassigned while coaches evaluate the full roster.
ALTER TABLE public.players
  ALTER COLUMN coach_id DROP NOT NULL;

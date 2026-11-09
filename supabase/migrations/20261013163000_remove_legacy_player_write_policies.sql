-- Remove legacy write policies that would otherwise bypass the new role rules.
DROP POLICY IF EXISTS "Coaches can insert their own players" ON public.players;
DROP POLICY IF EXISTS "Coaches can update their own players" ON public.players;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.players;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.player_evaluations;

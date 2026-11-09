-- Supabase project defaults can grant newly created functions to anon explicitly.
-- Keep the evaluated-player status available only to signed-in users.
REVOKE ALL ON FUNCTION public.get_evaluated_player_ids() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_evaluated_player_ids() TO authenticated;

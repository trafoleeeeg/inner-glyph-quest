-- Revoke UPDATE on game-state columns from authenticated/anon roles
REVOKE UPDATE (xp, level, xp_to_next, energy, max_energy, coins, streak, longest_streak, total_missions_completed, total_dreams_logged, followers_count, following_count, posts_count, last_active_date) ON public.profiles FROM authenticated, anon;

-- Ensure anon has no access to public_profiles
REVOKE ALL ON public.public_profiles FROM anon;
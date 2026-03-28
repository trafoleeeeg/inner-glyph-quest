-- 1) Prevent direct client tampering with mission completion XP fields
DROP POLICY IF EXISTS "Users can insert own completions" ON public.mission_completions;
CREATE POLICY "No direct mission completion inserts"
ON public.mission_completions
FOR INSERT
TO authenticated
WITH CHECK (false);

-- 2) Keep rewards log write-protected explicitly (defense in depth)
CREATE POLICY "No direct rewards inserts"
ON public.rewards_log
FOR INSERT
TO authenticated
WITH CHECK (false);

CREATE POLICY "No direct rewards deletes"
ON public.rewards_log
FOR DELETE
TO authenticated
USING (false);

-- 3) Restrict full profile reads and expose a safe public profile surface
DROP POLICY IF EXISTS "Anyone authenticated can view profiles" ON public.profiles;

CREATE OR REPLACE VIEW public.public_profiles AS
SELECT
  user_id,
  display_name,
  avatar_url,
  level,
  bio
FROM public.profiles;

REVOKE ALL ON TABLE public.public_profiles FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.public_profiles TO authenticated;
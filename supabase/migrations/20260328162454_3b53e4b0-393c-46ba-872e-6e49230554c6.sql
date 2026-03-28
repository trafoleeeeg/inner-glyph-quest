-- Replace SECURITY DEFINER view with a dedicated public-safe table for social profile access
DROP VIEW IF EXISTS public.public_profiles;

CREATE TABLE IF NOT EXISTS public.public_profiles (
  user_id uuid PRIMARY KEY,
  display_name text NOT NULL DEFAULT 'Нейронавт',
  avatar_url text,
  level integer NOT NULL DEFAULT 1,
  bio text,
  total_missions_completed integer NOT NULL DEFAULT 0,
  total_dreams_logged integer NOT NULL DEFAULT 0,
  streak integer NOT NULL DEFAULT 0,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.public_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated can view public profiles" ON public.public_profiles;
CREATE POLICY "Authenticated can view public profiles"
ON public.public_profiles
FOR SELECT
TO authenticated
USING (true);

-- Explicit privilege hardening: read-only for clients
REVOKE ALL ON TABLE public.public_profiles FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.public_profiles TO authenticated;

-- Ensure mission completions are not writable directly by clients
REVOKE INSERT ON TABLE public.mission_completions FROM anon, authenticated;

-- Sync function from private profiles table to public-safe table
CREATE OR REPLACE FUNCTION public.sync_public_profile_from_profiles()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    DELETE FROM public.public_profiles WHERE user_id = OLD.user_id;
    RETURN OLD;
  END IF;

  INSERT INTO public.public_profiles (
    user_id,
    display_name,
    avatar_url,
    level,
    bio,
    total_missions_completed,
    total_dreams_logged,
    streak,
    updated_at
  )
  VALUES (
    NEW.user_id,
    NEW.display_name,
    NEW.avatar_url,
    NEW.level,
    NEW.bio,
    NEW.total_missions_completed,
    NEW.total_dreams_logged,
    NEW.streak,
    now()
  )
  ON CONFLICT (user_id)
  DO UPDATE SET
    display_name = EXCLUDED.display_name,
    avatar_url = EXCLUDED.avatar_url,
    level = EXCLUDED.level,
    bio = EXCLUDED.bio,
    total_missions_completed = EXCLUDED.total_missions_completed,
    total_dreams_logged = EXCLUDED.total_dreams_logged,
    streak = EXCLUDED.streak,
    updated_at = now();

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_public_profile_after_insert_update ON public.profiles;
CREATE TRIGGER sync_public_profile_after_insert_update
AFTER INSERT OR UPDATE OF display_name, avatar_url, level, bio, total_missions_completed, total_dreams_logged, streak
ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.sync_public_profile_from_profiles();

DROP TRIGGER IF EXISTS sync_public_profile_after_delete ON public.profiles;
CREATE TRIGGER sync_public_profile_after_delete
AFTER DELETE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.sync_public_profile_from_profiles();

-- Backfill current data
INSERT INTO public.public_profiles (
  user_id,
  display_name,
  avatar_url,
  level,
  bio,
  total_missions_completed,
  total_dreams_logged,
  streak,
  updated_at
)
SELECT
  p.user_id,
  p.display_name,
  p.avatar_url,
  p.level,
  p.bio,
  p.total_missions_completed,
  p.total_dreams_logged,
  p.streak,
  now()
FROM public.profiles p
ON CONFLICT (user_id)
DO UPDATE SET
  display_name = EXCLUDED.display_name,
  avatar_url = EXCLUDED.avatar_url,
  level = EXCLUDED.level,
  bio = EXCLUDED.bio,
  total_missions_completed = EXCLUDED.total_missions_completed,
  total_dreams_logged = EXCLUDED.total_dreams_logged,
  streak = EXCLUDED.streak,
  updated_at = now();
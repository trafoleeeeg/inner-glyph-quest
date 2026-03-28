
-- Revoke broad UPDATE on profiles from authenticated and anon
REVOKE UPDATE ON public.profiles FROM anon, authenticated;

-- Grant UPDATE only on safe columns
GRANT UPDATE (display_name, avatar_url, bio) ON public.profiles TO authenticated;

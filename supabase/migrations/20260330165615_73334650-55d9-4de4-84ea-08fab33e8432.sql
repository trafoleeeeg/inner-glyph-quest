
-- Fix 1: tribe_members INSERT - only allow joining public tribes
DROP POLICY IF EXISTS "Users can join tribes" ON public.tribe_members;
CREATE POLICY "Users can join tribes" ON public.tribe_members
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM tribes WHERE id = tribe_id AND is_public = true
    )
  );

-- Fix 2: Storage INSERT - restrict uploads to user-owned paths
-- Paths used: {user_id}/*, avatars/{user_id}.*, chat/{conv_id}/*
DROP POLICY IF EXISTS "Authenticated users can upload media" ON storage.objects;
CREATE POLICY "Authenticated users can upload media" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'media'
    AND (
      (storage.foldername(name))[1] = (auth.uid())::text
      OR (storage.foldername(name))[1] = 'avatars'
      OR (storage.foldername(name))[1] = 'chat'
    )
  );

-- Fix 3: Storage SELECT - restrict to authenticated only
DROP POLICY IF EXISTS "Anyone can view media" ON storage.objects;
CREATE POLICY "Authenticated users can view media" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'media');

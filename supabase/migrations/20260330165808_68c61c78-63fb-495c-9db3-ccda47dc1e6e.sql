
-- Add UPDATE policy for storage objects - restrict to owner paths
CREATE POLICY "Users can update own media" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'media'
    AND (
      (storage.foldername(name))[1] = (auth.uid())::text
      OR ((storage.foldername(name))[1] = 'avatars')
      OR ((storage.foldername(name))[1] = 'chat')
    )
  );

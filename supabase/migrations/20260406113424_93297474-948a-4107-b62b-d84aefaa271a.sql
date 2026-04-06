
-- Drop old permissive INSERT/UPDATE policies on storage.objects
DROP POLICY IF EXISTS "Users can upload media" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own media" ON storage.objects;

-- New INSERT policy: only allow uploads under {user_id}/ prefix
CREATE POLICY "Users can upload to own folder" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'media'
    AND (storage.foldername(name))[1] = (auth.uid())::text
  );

-- New UPDATE policy: only allow updates under {user_id}/ prefix
CREATE POLICY "Users can update own folder" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'media'
    AND (storage.foldername(name))[1] = (auth.uid())::text
  );

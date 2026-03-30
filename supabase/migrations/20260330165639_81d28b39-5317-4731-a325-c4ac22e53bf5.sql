
-- Revert SELECT to public - media content (avatars, post images) is intentionally public
DROP POLICY IF EXISTS "Authenticated users can view media" ON storage.objects;
CREATE POLICY "Anyone can view media" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'media');

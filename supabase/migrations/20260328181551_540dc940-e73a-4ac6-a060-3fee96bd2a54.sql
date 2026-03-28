
DROP POLICY "Anyone can view public tribes" ON public.tribes;
CREATE POLICY "Visibility-aware tribe select" ON public.tribes
  FOR SELECT TO authenticated
  USING (
    is_public = true
    OR auth.uid() = creator_id
    OR EXISTS (
      SELECT 1 FROM public.tribe_members
      WHERE tribe_id = tribes.id
        AND user_id = auth.uid()
    )
  );

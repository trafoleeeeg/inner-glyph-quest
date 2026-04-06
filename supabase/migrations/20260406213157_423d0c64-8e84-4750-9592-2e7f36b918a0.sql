
DROP POLICY IF EXISTS "Conversation creators can add participants" ON public.conversation_participants;
CREATE POLICY "Conversation creators can add participants" ON public.conversation_participants
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.conversations
      WHERE id = conversation_id AND created_by = auth.uid()
    )
    OR public.is_conversation_participant(auth.uid(), conversation_id)
  );

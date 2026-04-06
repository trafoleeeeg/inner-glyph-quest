
-- Create security definer function to check conversation membership
CREATE OR REPLACE FUNCTION public.is_conversation_participant(_user_id uuid, _conversation_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.conversation_participants
    WHERE user_id = _user_id AND conversation_id = _conversation_id
  )
$$;

-- Fix conversation_participants policies
DROP POLICY IF EXISTS "Participants can view participants" ON public.conversation_participants;
CREATE POLICY "Participants can view participants" ON public.conversation_participants
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR public.is_conversation_participant(auth.uid(), conversation_id)
  );

DROP POLICY IF EXISTS "Conversation creators can add participants" ON public.conversation_participants;
CREATE POLICY "Conversation creators can add participants" ON public.conversation_participants
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    OR public.is_conversation_participant(auth.uid(), conversation_id)
  );

-- Fix conversations policies
DROP POLICY IF EXISTS "Participants can view conversations" ON public.conversations;
CREATE POLICY "Participants can view conversations" ON public.conversations
  FOR SELECT TO authenticated
  USING (
    created_by = auth.uid()
    OR public.is_conversation_participant(auth.uid(), id)
  );

DROP POLICY IF EXISTS "Owner can update conversations" ON public.conversations;
CREATE POLICY "Owner can update conversations" ON public.conversations
  FOR UPDATE TO authenticated
  USING (
    created_by = auth.uid()
    OR public.is_conversation_participant(auth.uid(), id)
  );

-- Fix messages policies
DROP POLICY IF EXISTS "Participants can view messages" ON public.messages;
CREATE POLICY "Participants can view messages" ON public.messages
  FOR SELECT TO authenticated
  USING (public.is_conversation_participant(auth.uid(), conversation_id));

DROP POLICY IF EXISTS "Participants can send messages" ON public.messages;
CREATE POLICY "Participants can send messages" ON public.messages
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = sender_id
    AND public.is_conversation_participant(auth.uid(), conversation_id)
  );

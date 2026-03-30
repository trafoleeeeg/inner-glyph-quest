
-- Fix 1: tribe_challenge_participants INSERT policy - require tribe membership
DROP POLICY IF EXISTS "Users can join challenges" ON public.tribe_challenge_participants;
CREATE POLICY "Users can join challenges" ON public.tribe_challenge_participants
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM tribe_challenges tc
      JOIN tribe_members tm ON tm.tribe_id = tc.tribe_id
      WHERE tc.id = tribe_challenge_participants.challenge_id
        AND tm.user_id = auth.uid()
    )
  );

-- Fix 2: user_roles - the current policy is actually correct for admin management
-- but we should document that initial admin seeding must be done via service role.
-- No policy change needed - admins assigning roles to other users is intentional.

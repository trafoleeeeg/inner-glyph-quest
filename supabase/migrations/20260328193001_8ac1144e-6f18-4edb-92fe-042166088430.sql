
-- Weekly reports table
CREATE TABLE public.weekly_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  week_start DATE NOT NULL,
  stats JSONB NOT NULL DEFAULT '{}'::jsonb,
  ai_summary TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, week_start)
);

ALTER TABLE public.weekly_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own reports" ON public.weekly_reports
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own reports" ON public.weekly_reports
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Tribe challenges table
CREATE TABLE public.tribe_challenges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tribe_id UUID NOT NULL REFERENCES public.tribes(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  challenge_type TEXT NOT NULL DEFAULT 'habits',
  start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  end_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '7 days'),
  created_by UUID NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.tribe_challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view tribe challenges" ON public.tribe_challenges
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM tribe_members WHERE tribe_id = tribe_challenges.tribe_id AND user_id = auth.uid())
  );

CREATE POLICY "Members can create challenges" ON public.tribe_challenges
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM tribe_members WHERE tribe_id = tribe_challenges.tribe_id AND user_id = auth.uid())
    AND auth.uid() = created_by
  );

-- Tribe challenge participants
CREATE TABLE public.tribe_challenge_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  challenge_id UUID NOT NULL REFERENCES public.tribe_challenges(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(challenge_id, user_id)
);

ALTER TABLE public.tribe_challenge_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view participants" ON public.tribe_challenge_participants
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can join challenges" ON public.tribe_challenge_participants
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own score" ON public.tribe_challenge_participants
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

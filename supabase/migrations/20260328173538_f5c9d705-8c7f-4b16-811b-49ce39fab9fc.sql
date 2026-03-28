
-- Heuristics table
CREATE TABLE public.heuristics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'habit',
  tags TEXT[] DEFAULT '{}',
  upvotes INTEGER NOT NULL DEFAULT 0,
  downloads INTEGER NOT NULL DEFAULT 0,
  is_public BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.heuristics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view public heuristics" ON public.heuristics FOR SELECT TO authenticated USING (is_public = true OR user_id = auth.uid());
CREATE POLICY "Users can create own heuristics" ON public.heuristics FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own heuristics" ON public.heuristics FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own heuristics" ON public.heuristics FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Heuristic upvotes
CREATE TABLE public.heuristic_upvotes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  heuristic_id UUID NOT NULL REFERENCES public.heuristics(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(heuristic_id, user_id)
);

ALTER TABLE public.heuristic_upvotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view upvotes" ON public.heuristic_upvotes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can upvote" ON public.heuristic_upvotes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can remove upvote" ON public.heuristic_upvotes FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Tribes
CREATE TABLE public.tribes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT NOT NULL DEFAULT '🔥',
  color TEXT NOT NULL DEFAULT 'hsl(180, 100%, 50%)',
  creator_id UUID NOT NULL,
  members_count INTEGER NOT NULL DEFAULT 1,
  collective_xp INTEGER NOT NULL DEFAULT 0,
  goal TEXT,
  is_public BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.tribes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view public tribes" ON public.tribes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can create tribes" ON public.tribes FOR INSERT TO authenticated WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "Creators can update own tribes" ON public.tribes FOR UPDATE TO authenticated USING (auth.uid() = creator_id);
CREATE POLICY "Creators can delete own tribes" ON public.tribes FOR DELETE TO authenticated USING (auth.uid() = creator_id);

-- Tribe members
CREATE TABLE public.tribe_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tribe_id UUID NOT NULL REFERENCES public.tribes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tribe_id, user_id)
);

ALTER TABLE public.tribe_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view tribe members" ON public.tribe_members FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can join tribes" ON public.tribe_members FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can leave tribes" ON public.tribe_members FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- AI insights log
CREATE TABLE public.ai_insights (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  insight_type TEXT NOT NULL DEFAULT 'pattern',
  content TEXT NOT NULL,
  data_summary JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own insights" ON public.ai_insights FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create own insights" ON public.ai_insights FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

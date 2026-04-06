
CREATE TABLE public.ai_memory_nodes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  importance integer DEFAULT 1,
  category text DEFAULT 'general'
);

CREATE INDEX idx_ai_memory_nodes_user ON public.ai_memory_nodes(user_id);
CREATE INDEX idx_ai_memory_nodes_created_at ON public.ai_memory_nodes(created_at DESC);

ALTER TABLE public.ai_memory_nodes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own memory nodes" ON public.ai_memory_nodes FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create own memory nodes" ON public.ai_memory_nodes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own memory nodes" ON public.ai_memory_nodes FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own memory nodes" ON public.ai_memory_nodes FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.ai_psychologist_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  session_start timestamptz NOT NULL DEFAULT now(),
  session_end timestamptz,
  summary text,
  mood_before integer,
  mood_after integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_ai_sessions_user ON public.ai_psychologist_sessions(user_id);
ALTER TABLE public.ai_psychologist_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own sessions" ON public.ai_psychologist_sessions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can create own sessions" ON public.ai_psychologist_sessions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own sessions" ON public.ai_psychologist_sessions FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own sessions" ON public.ai_psychologist_sessions FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.personality_tests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  icon text DEFAULT '🧠',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.personality_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id uuid NOT NULL REFERENCES public.personality_tests(id) ON DELETE CASCADE,
  question_text text NOT NULL,
  options jsonb NOT NULL,
  order_index integer NOT NULL DEFAULT 0
);

CREATE TABLE public.personality_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  test_id uuid NOT NULL REFERENCES public.personality_tests(id) ON DELETE CASCADE,
  result_type text NOT NULL,
  summary text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, test_id)
);

ALTER TABLE public.personality_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personality_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personality_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view tests" ON public.personality_tests FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anyone can view questions" ON public.personality_questions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can view own results" ON public.personality_results FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own results" ON public.personality_results FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own results" ON public.personality_results FOR UPDATE TO authenticated USING (auth.uid() = user_id);

INSERT INTO public.personality_tests (id, title, description, icon) VALUES ('11111111-1111-1111-1111-111111111111', 'Кто ты по жизни?', 'Узнай свой истинный архетип через серию простых вопросов.', '🔮') ON CONFLICT DO NOTHING;
INSERT INTO public.personality_questions (test_id, question_text, options, order_index) VALUES 
  ('11111111-1111-1111-1111-111111111111', 'Как ты относишься к риску?', '[{"id":"a","text":"Обожаю, это моя стихия","points_to":"Бунтарь"},{"id":"b","text":"Риск должен быть просчитан","points_to":"Стратег"},{"id":"c","text":"Стараюсь избегать","points_to":"Хранитель"}]'::jsonb, 1),
  ('11111111-1111-1111-1111-111111111111', 'В шумной компании ты обычно...', '[{"id":"a","text":"В центре внимания","points_to":"Бунтарь"},{"id":"b","text":"Наблюдаю за всеми","points_to":"Стратег"},{"id":"c","text":"Общаюсь тет-а-тет с одним человеком","points_to":"Хранитель"}]'::jsonb, 2);

INSERT INTO public.public_profiles (user_id, display_name, avatar_url, bio, level, streak, total_dreams_logged, total_missions_completed)
VALUES ('00000000-0000-0000-0000-000000000000', 'ИИ Психолог', '🤖', 'Ваш личный ИИ-ассистент и психолог.', 999, 999, 0, 0)
ON CONFLICT (user_id) DO NOTHING;

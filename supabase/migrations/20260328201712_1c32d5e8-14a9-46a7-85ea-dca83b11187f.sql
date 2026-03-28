CREATE TABLE public.life_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  answers jsonb NOT NULL DEFAULT '{}'::jsonb,
  ai_recommendations jsonb DEFAULT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.life_profiles ENABLE ROW LEVEL SECURITY;

CREATE UNIQUE INDEX life_profiles_user_id_idx ON public.life_profiles (user_id);

CREATE POLICY "Users can view own life profile" ON public.life_profiles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own life profile" ON public.life_profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own life profile" ON public.life_profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);
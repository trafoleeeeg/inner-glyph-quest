-- Add stagnation index tracking to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS stagnation_index numeric NOT NULL DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS glyph_integrity numeric NOT NULL DEFAULT 100;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_stagnation_calc timestamp with time zone;

-- Synthetic agent profiles table
CREATE TABLE IF NOT EXISTS public.synthetic_agents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  display_name text NOT NULL,
  avatar_url text,
  bio text,
  level integer NOT NULL DEFAULT 1,
  streak integer NOT NULL DEFAULT 0,
  total_missions_completed integer NOT NULL DEFAULT 0,
  personality_type text NOT NULL DEFAULT 'predator',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.synthetic_agents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view agents" ON public.synthetic_agents
  FOR SELECT TO authenticated USING (true);

-- Synthetic posts table  
CREATE TABLE IF NOT EXISTS public.synthetic_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES public.synthetic_agents(id) ON DELETE CASCADE,
  content text NOT NULL,
  post_type text NOT NULL DEFAULT 'motivation',
  likes_count integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.synthetic_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view synthetic posts" ON public.synthetic_posts
  FOR SELECT TO authenticated USING (true);

-- Function to calculate stagnation index
CREATE OR REPLACE FUNCTION public.calculate_stagnation_index(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_profile record;
  v_completion_speed numeric;
  v_failure_rate numeric;
  v_idle_days integer;
  v_active_missions integer;
  v_completions_today integer;
  v_completions_week integer;
  v_total_possible_week integer;
  v_stagnation numeric;
  v_glyph_integrity numeric;
  v_phase text;
BEGIN
  SELECT * INTO v_profile FROM profiles WHERE user_id = p_user_id;
  IF NOT FOUND THEN RETURN jsonb_build_object('error', 'Profile not found'); END IF;

  SELECT count(*) INTO v_active_missions FROM missions WHERE user_id = p_user_id AND is_active = true;
  
  SELECT count(*) INTO v_completions_today FROM mission_completions 
  WHERE user_id = p_user_id AND completed_at >= CURRENT_DATE;
  
  SELECT count(*) INTO v_completions_week FROM mission_completions 
  WHERE user_id = p_user_id AND completed_at >= (now() - interval '7 days');
  
  v_total_possible_week := v_active_missions * 7;
  
  v_completion_speed := CASE 
    WHEN v_active_missions = 0 THEN 1
    WHEN v_completions_today >= v_active_missions THEN 0.3
    ELSE 1 - (v_completions_today::numeric / GREATEST(v_active_missions, 1))
  END;
  
  v_failure_rate := CASE 
    WHEN v_total_possible_week = 0 THEN 0.5
    ELSE 1 - (v_completions_week::numeric / GREATEST(v_total_possible_week, 1))
  END;
  
  SELECT COALESCE(CURRENT_DATE - MAX(completed_at::date), 30) INTO v_idle_days
  FROM mission_completions WHERE user_id = p_user_id;
  
  v_stagnation := LEAST(100, GREATEST(0,
    30 * v_completion_speed +
    40 * v_failure_rate +
    30 * LEAST(v_idle_days::numeric / 7, 1)
  ));
  
  v_glyph_integrity := GREATEST(0, 100 - v_stagnation);
  
  v_phase := CASE
    WHEN v_stagnation < 25 THEN 'flow'
    WHEN v_stagnation < 50 THEN 'stable'
    WHEN v_stagnation < 75 THEN 'starvation'
    ELSE 'overload'
  END;
  
  PERFORM set_config('app.bypass_profile_protection', 'true', true);
  UPDATE profiles SET 
    stagnation_index = v_stagnation,
    glyph_integrity = v_glyph_integrity,
    last_stagnation_calc = now()
  WHERE user_id = p_user_id;
  
  RETURN jsonb_build_object(
    'stagnation_index', round(v_stagnation, 1),
    'glyph_integrity', round(v_glyph_integrity, 1),
    'phase', v_phase,
    'completions_today', v_completions_today,
    'completions_week', v_completions_week,
    'active_missions', v_active_missions,
    'idle_days', v_idle_days,
    'failure_rate', round(v_failure_rate * 100, 1),
    'compression_speed', round(v_completion_speed * 100, 1)
  );
END;
$$;
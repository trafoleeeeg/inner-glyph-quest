
-- Internal drives / sub-personalities (Meta-Diplomat system)
CREATE TABLE public.inner_drives (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT '⚡',
  color TEXT NOT NULL DEFAULT 'primary',
  strength INTEGER NOT NULL DEFAULT 50 CHECK (strength >= 0 AND strength <= 100),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.inner_drives ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own drives" ON public.inner_drives FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own drives" ON public.inner_drives FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own drives" ON public.inner_drives FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own drives" ON public.inner_drives FOR DELETE USING (auth.uid() = user_id);

-- Energy decay function (virtual metabolism)
CREATE OR REPLACE FUNCTION public.apply_energy_decay()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Decay energy by 5 for users who haven't been active today
  UPDATE profiles
  SET energy = GREATEST(energy - 5, 0),
      updated_at = now()
  WHERE last_active_date IS NULL 
     OR last_active_date < CURRENT_DATE;
END;
$$;

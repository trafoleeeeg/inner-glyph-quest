CREATE OR REPLACE FUNCTION public.protect_profile_gamification()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
BEGIN
  IF current_setting('app.bypass_profile_protection', true) = 'true' THEN
    RETURN NEW;
  END IF;
  
  NEW.xp := OLD.xp;
  NEW.level := OLD.level;
  NEW.xp_to_next := OLD.xp_to_next;
  NEW.coins := OLD.coins;
  NEW.streak := OLD.streak;
  NEW.longest_streak := OLD.longest_streak;
  NEW.energy := OLD.energy;
  NEW.max_energy := OLD.max_energy;
  NEW.total_missions_completed := OLD.total_missions_completed;
  NEW.total_dreams_logged := OLD.total_dreams_logged;
  NEW.followers_count := OLD.followers_count;
  NEW.following_count := OLD.following_count;
  NEW.posts_count := OLD.posts_count;
  NEW.last_active_date := OLD.last_active_date;
  NEW.stagnation_index := OLD.stagnation_index;
  NEW.glyph_integrity := OLD.glyph_integrity;
  NEW.last_stagnation_calc := OLD.last_stagnation_calc;
  
  RETURN NEW;
END;
$$;
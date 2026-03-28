
-- 1. Protect gamification fields on profiles with a trigger
CREATE OR REPLACE FUNCTION public.protect_profile_gamification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- If bypass flag is set (from our RPCs), allow all updates
  IF current_setting('app.bypass_profile_protection', true) = 'true' THEN
    RETURN NEW;
  END IF;
  
  -- Otherwise, only allow safe fields to change
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
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER protect_profile_gamification_trigger
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_profile_gamification();

-- 2. RPC: Complete mission (server-side gamification logic)
CREATE OR REPLACE FUNCTION public.complete_mission(p_mission_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id uuid;
  v_mission record;
  v_profile record;
  v_today text;
  v_already_done boolean;
  v_week_count int;
  v_devaluation numeric;
  v_effective_xp int;
  v_is_critical boolean;
  v_streak_mult numeric;
  v_bonus_xp int := 0;
  v_has_mystery boolean;
  v_mystery_amount int := 0;
  v_total_xp int;
  v_coins int;
  v_new_xp int;
  v_leveled_up boolean;
  v_new_level int;
  v_remaining_xp int;
  v_new_xp_to_next int;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Get mission
  SELECT * INTO v_mission FROM missions WHERE id = p_mission_id AND user_id = v_user_id AND is_active = true;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Mission not found or not yours';
  END IF;

  -- Check if already completed today
  v_today := to_char(now() AT TIME ZONE 'UTC', 'YYYY-MM-DD');
  SELECT EXISTS(
    SELECT 1 FROM mission_completions 
    WHERE mission_id = p_mission_id AND user_id = v_user_id 
    AND completed_at >= (v_today || 'T00:00:00')::timestamptz
    AND completed_at <= (v_today || 'T23:59:59')::timestamptz
  ) INTO v_already_done;
  
  IF v_already_done THEN
    RAISE EXCEPTION 'Already completed today';
  END IF;

  -- Get profile
  SELECT * INTO v_profile FROM profiles WHERE user_id = v_user_id;

  -- Devaluation (weekly count)
  SELECT count(*) INTO v_week_count FROM mission_completions 
  WHERE mission_id = p_mission_id AND user_id = v_user_id 
  AND completed_at >= (now() - interval '7 days');
  
  v_devaluation := LEAST(v_week_count * 0.1, 0.7);
  v_effective_xp := GREATEST(floor(v_mission.xp_reward * (1 - v_devaluation))::int, floor(v_mission.xp_reward * 0.3)::int);

  -- Random elements  
  v_is_critical := random() < 0.15;
  v_streak_mult := LEAST(1 + (v_profile.streak * 0.1), 2.0);
  v_has_mystery := random() < 0.1;

  IF v_is_critical THEN v_bonus_xp := v_bonus_xp + v_effective_xp; END IF;
  v_bonus_xp := v_bonus_xp + floor(v_effective_xp * (v_streak_mult - 1))::int;
  IF v_has_mystery THEN 
    v_mystery_amount := floor(random() * 30 + 20)::int;
    v_bonus_xp := v_bonus_xp + v_mystery_amount; 
  END IF;

  v_total_xp := v_effective_xp + v_bonus_xp;
  v_coins := floor(v_total_xp / 10)::int;
  v_new_xp := v_profile.xp + v_total_xp;
  v_leveled_up := v_new_xp >= v_profile.xp_to_next;
  v_new_level := CASE WHEN v_leveled_up THEN v_profile.level + 1 ELSE v_profile.level END;
  v_remaining_xp := CASE WHEN v_leveled_up THEN v_new_xp - v_profile.xp_to_next ELSE v_new_xp END;
  v_new_xp_to_next := CASE WHEN v_leveled_up THEN floor(100 * power(1.25, v_new_level - 1))::int ELSE v_profile.xp_to_next END;

  -- Insert completion
  INSERT INTO mission_completions (user_id, mission_id, xp_earned, bonus_xp)
  VALUES (v_user_id, p_mission_id, v_effective_xp, v_bonus_xp);

  -- Update profile (bypass trigger protection)
  PERFORM set_config('app.bypass_profile_protection', 'true', true);
  UPDATE profiles SET
    xp = v_remaining_xp, xp_to_next = v_new_xp_to_next, level = v_new_level,
    total_missions_completed = total_missions_completed + 1,
    energy = LEAST(energy + 5, max_energy),
    coins = coins + v_coins
  WHERE user_id = v_user_id;

  -- Log reward if special
  IF v_is_critical OR v_has_mystery THEN
    INSERT INTO rewards_log (user_id, reward_type, xp_amount, coins_amount, description)
    VALUES (v_user_id, 
      CASE WHEN v_is_critical THEN 'critical_hit' ELSE 'mystery_box' END,
      v_bonus_xp, v_coins,
      CASE WHEN v_is_critical THEN 'Резонанс! x2 сжатие' ELSE 'Аномалия данных!' END);
  END IF;

  RETURN jsonb_build_object(
    'baseXP', v_effective_xp, 'bonusXP', v_bonus_xp, 'totalXP', v_total_xp,
    'isCriticalHit', v_is_critical, 'hasMysteryBox', v_has_mystery,
    'mysteryAmount', v_mystery_amount, 'streakMultiplier', v_streak_mult,
    'coinsEarned', v_coins, 'leveledUp', v_leveled_up,
    'newLevel', CASE WHEN v_leveled_up THEN v_new_level ELSE null END
  );
END;
$$;

-- 3. RPC: Submit mood checkin
CREATE OR REPLACE FUNCTION public.submit_mood_checkin(p_mood int, p_energy int, p_note text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE v_user_id uuid;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  
  INSERT INTO mood_entries (user_id, mood, energy_level, note) VALUES (v_user_id, p_mood, p_energy, p_note);
  
  PERFORM set_config('app.bypass_profile_protection', 'true', true);
  UPDATE profiles SET xp = xp + 15 WHERE user_id = v_user_id;
END;
$$;

-- 4. RPC: Submit dream entry
CREATE OR REPLACE FUNCTION public.submit_dream_entry(p_title text, p_description text DEFAULT NULL, p_lucidity int DEFAULT 1)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE v_user_id uuid;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  
  INSERT INTO dream_entries (user_id, title, description, lucidity) VALUES (v_user_id, p_title, p_description, p_lucidity);
  
  PERFORM set_config('app.bypass_profile_protection', 'true', true);
  UPDATE profiles SET xp = xp + 25, total_dreams_logged = total_dreams_logged + 1 WHERE user_id = v_user_id;
END;
$$;

-- 5. RPC: Award XP for activity (desires, etc)
CREATE OR REPLACE FUNCTION public.award_activity_xp(p_amount int, p_activity text DEFAULT 'activity')
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE v_user_id uuid;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF p_amount < 0 OR p_amount > 100 THEN RAISE EXCEPTION 'Invalid XP amount'; END IF;
  
  PERFORM set_config('app.bypass_profile_protection', 'true', true);
  UPDATE profiles SET xp = xp + p_amount WHERE user_id = v_user_id;
END;
$$;

-- 6. RPC: Send notification (validated)
CREATE OR REPLACE FUNCTION public.send_notification(
  p_target_user_id uuid, p_type text, p_title text, 
  p_body text DEFAULT NULL, p_related_post_id uuid DEFAULT NULL, p_related_user_id uuid DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE v_user_id uuid;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  -- Don't notify yourself
  IF p_target_user_id = v_user_id THEN RETURN; END IF;
  -- Validate target exists
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE user_id = p_target_user_id) THEN RETURN; END IF;
  
  INSERT INTO notifications (user_id, type, title, body, related_post_id, related_user_id)
  VALUES (p_target_user_id, p_type, p_title, p_body, p_related_post_id, p_related_user_id);
END;
$$;

-- 7. Fix RLS policies

-- Remove overly permissive notifications INSERT
DROP POLICY IF EXISTS "Authenticated can insert notifications" ON notifications;

-- Remove direct rewards_log INSERT (now handled by RPCs)
DROP POLICY IF EXISTS "Users can insert own rewards" ON rewards_log;


-- Add Elo system columns to missions
ALTER TABLE public.missions 
  ADD COLUMN IF NOT EXISTS difficulty_multiplier numeric NOT NULL DEFAULT 1.0,
  ADD COLUMN IF NOT EXISTS consecutive_successes integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS consecutive_failures integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS glyph_type text NOT NULL DEFAULT 'cognitive_constraint',
  ADD COLUMN IF NOT EXISTS elo_rating integer NOT NULL DEFAULT 1000;

-- Update complete_mission to handle Elo adaptive difficulty
CREATE OR REPLACE FUNCTION public.complete_mission(p_mission_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
  v_new_consec_success int;
  v_new_consec_fail int;
  v_new_difficulty numeric;
  v_elo_shifted boolean := false;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO v_mission FROM missions WHERE id = p_mission_id AND user_id = v_user_id AND is_active = true;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Mission not found or not yours';
  END IF;

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

  SELECT * INTO v_profile FROM profiles WHERE user_id = v_user_id;

  -- Devaluation
  SELECT count(*) INTO v_week_count FROM mission_completions 
  WHERE mission_id = p_mission_id AND user_id = v_user_id 
  AND completed_at >= (now() - interval '7 days');
  
  v_devaluation := LEAST(v_week_count * 0.1, 0.7);
  v_effective_xp := GREATEST(floor(v_mission.xp_reward * v_mission.difficulty_multiplier * (1 - v_devaluation))::int, floor(v_mission.xp_reward * 0.3)::int);

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

  -- ELO: Update consecutive successes, reset failures
  v_new_consec_success := v_mission.consecutive_successes + 1;
  v_new_consec_fail := 0;
  v_new_difficulty := v_mission.difficulty_multiplier;

  -- Red Queen Shift: 5 consecutive successes = +15% difficulty
  IF v_new_consec_success >= 5 THEN
    v_new_difficulty := LEAST(v_mission.difficulty_multiplier * 1.15, 3.0);
    v_new_consec_success := 0;
    v_elo_shifted := true;
  END IF;

  -- Update mission Elo stats
  UPDATE missions SET 
    consecutive_successes = v_new_consec_success,
    consecutive_failures = v_new_consec_fail,
    difficulty_multiplier = v_new_difficulty,
    elo_rating = elo_rating + 16
  WHERE id = p_mission_id;

  -- Insert completion
  INSERT INTO mission_completions (user_id, mission_id, xp_earned, bonus_xp)
  VALUES (v_user_id, p_mission_id, v_effective_xp, v_bonus_xp);

  -- Update profile
  PERFORM set_config('app.bypass_profile_protection', 'true', true);
  UPDATE profiles SET
    xp = v_remaining_xp, xp_to_next = v_new_xp_to_next, level = v_new_level,
    total_missions_completed = total_missions_completed + 1,
    energy = LEAST(energy + 5, max_energy),
    coins = coins + v_coins
  WHERE user_id = v_user_id;

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
    'newLevel', CASE WHEN v_leveled_up THEN v_new_level ELSE null END,
    'eloShifted', v_elo_shifted,
    'newDifficulty', v_new_difficulty
  );
END;
$function$;

-- Function to apply daily failure tracking and membrane recovery
CREATE OR REPLACE FUNCTION public.apply_daily_failure_check()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_mission record;
  v_yesterday text;
  v_was_completed boolean;
BEGIN
  v_yesterday := to_char((now() - interval '1 day') AT TIME ZONE 'UTC', 'YYYY-MM-DD');
  
  -- For each active mission, check if it was completed yesterday
  FOR v_mission IN 
    SELECT m.* FROM missions m 
    WHERE m.is_active = true AND m.is_daily = true
  LOOP
    SELECT EXISTS(
      SELECT 1 FROM mission_completions 
      WHERE mission_id = v_mission.id AND user_id = v_mission.user_id
      AND completed_at >= (v_yesterday || 'T00:00:00')::timestamptz
      AND completed_at <= (v_yesterday || 'T23:59:59')::timestamptz
    ) INTO v_was_completed;
    
    IF NOT v_was_completed THEN
      -- Increment failure counter, reset success counter
      UPDATE missions SET 
        consecutive_failures = consecutive_failures + 1,
        consecutive_successes = 0
      WHERE id = v_mission.id;
      
      -- Membrane Recovery Protocol: 3 consecutive failures
      IF v_mission.consecutive_failures + 1 >= 3 THEN
        -- Reduce difficulty by 50%
        UPDATE missions SET 
          difficulty_multiplier = GREATEST(difficulty_multiplier * 0.5, 0.3),
          consecutive_failures = 0,
          elo_rating = GREATEST(elo_rating - 48, 400)
        WHERE id = v_mission.id;
      END IF;
    END IF;
  END LOOP;
END;
$function$;

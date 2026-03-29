-- Function to track user activity: updates last_active_date, manages streaks
CREATE OR REPLACE FUNCTION public.track_user_activity()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_profile record;
  v_today date := CURRENT_DATE;
  v_yesterday date := CURRENT_DATE - 1;
  v_new_streak int;
  v_new_longest int;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  SELECT * INTO v_profile FROM profiles WHERE user_id = v_user_id;
  IF NOT FOUND THEN RETURN jsonb_build_object('error', 'no_profile'); END IF;

  -- Already tracked today
  IF v_profile.last_active_date = v_today THEN
    RETURN jsonb_build_object('tracked', false, 'streak', v_profile.streak);
  END IF;

  -- Calculate streak
  IF v_profile.last_active_date = v_yesterday THEN
    v_new_streak := v_profile.streak + 1;
  ELSIF v_profile.last_active_date IS NULL THEN
    v_new_streak := 1;
  ELSE
    v_new_streak := 1; -- streak broken
  END IF;

  v_new_longest := GREATEST(v_profile.longest_streak, v_new_streak);

  PERFORM set_config('app.bypass_profile_protection', 'true', true);
  UPDATE profiles SET
    last_active_date = v_today,
    streak = v_new_streak,
    longest_streak = v_new_longest,
    updated_at = now()
  WHERE user_id = v_user_id;

  RETURN jsonb_build_object(
    'tracked', true,
    'streak', v_new_streak,
    'longest_streak', v_new_longest,
    'previous_date', v_profile.last_active_date
  );
END;
$$;
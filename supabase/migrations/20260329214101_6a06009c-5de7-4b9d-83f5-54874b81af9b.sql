
-- Activity log for tracking all user actions
CREATE TABLE public.activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  action_type text NOT NULL DEFAULT 'general',
  action_detail text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index for fast queries
CREATE INDEX idx_activity_log_user_id ON public.activity_log(user_id);
CREATE INDEX idx_activity_log_created_at ON public.activity_log(created_at DESC);
CREATE INDEX idx_activity_log_action_type ON public.activity_log(action_type);

-- RLS
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

-- Users can insert own logs
CREATE POLICY "Users can insert own activity"
ON public.activity_log FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can view own logs
CREATE POLICY "Users can view own activity"
ON public.activity_log FOR SELECT TO authenticated
USING (auth.uid() = user_id);

-- Admins can view all logs
CREATE POLICY "Admins can view all activity"
ON public.activity_log FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- RPC function to log activity (callable from client)
CREATE OR REPLACE FUNCTION public.log_activity(
  p_action_type text,
  p_action_detail text DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_user_id uuid;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  
  INSERT INTO activity_log (user_id, action_type, action_detail, metadata)
  VALUES (v_user_id, p_action_type, p_action_detail, p_metadata);
END;
$$;


-- Add subtask support and recurring task fields
ALTER TABLE public.user_tasks 
  ADD COLUMN IF NOT EXISTS parent_task_id uuid REFERENCES public.user_tasks(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS is_recurring boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS recurrence_rule text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS linked_mission_id uuid REFERENCES public.missions(id) ON DELETE SET NULL;

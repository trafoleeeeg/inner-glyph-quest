import { supabase } from "@/integrations/supabase/client";

export type ActivityType = 
  | 'login'
  | 'mission_complete'
  | 'mood_checkin'
  | 'dream_logged'
  | 'post_created'
  | 'message_sent'
  | 'profile_updated'
  | 'habit_created'
  | 'habit_deleted'
  | 'task_completed'
  | 'post_liked'
  | 'comment_added'
  | 'tribe_joined'
  | 'page_view';

export const logActivity = async (
  actionType: ActivityType,
  actionDetail?: string,
  metadata?: Record<string, any>
) => {
  try {
    await supabase.rpc("log_activity", {
      p_action_type: actionType,
      p_action_detail: actionDetail || null,
      p_metadata: metadata || {},
    });
  } catch {
    // Silent fail — don't block UX for logging
  }
};

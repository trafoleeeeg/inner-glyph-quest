import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const handleAiMessage = async (conversationId: string, userId: string, messageContent: string) => {
  try {
    const { data, error } = await supabase.functions.invoke("ai-psychologist", {
      body: {
        conversation_id: conversationId,
        user_id: userId,
        message: messageContent,
      },
    });

    if (error) {
      console.error("AI psychologist error:", error);
      toast.error("ИИ-психолог временно недоступен");
    }
  } catch (err) {
    console.error("Error calling AI psychologist:", err);
  }
};

import { supabase } from "@/integrations/supabase/client";

const AI_USER_ID = "00000000-0000-0000-0000-000000000000";

export const handleAiMessage = async (conversationId: string, userId: string, messageContent: string) => {
  try {
    const keywords = ["я", "мне", "чувствую", "хочу", "проблема", "страх", "радость", "мысль"];
    const words = messageContent.toLowerCase().replace(/[.,!?]/g, "").split(/\s+/);
    
    let extractedFact = "";
    if (words.some(w => keywords.includes(w))) {
      extractedFact = `Пользователь сказал: "${messageContent}"`;
    }

    if (extractedFact) {
      await (supabase as any).from("ai_memory_nodes").insert({
        user_id: userId,
        content: extractedFact,
        category: "conversation_fact",
        importance: 1,
      });
    }

    const { data: pastMemories } = await (supabase as any)
      .from("ai_memory_nodes")
      .select("content, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(5);

    let responseText = "Понимаю. Расскажи подробнее, что ты при этом чувствуешь?";
    if (messageContent.toLowerCase().includes("привет")) {
      responseText = "Привет! Я твой ИИ-психолог. Как прошел твой день?";
    } else if (messageContent.toLowerCase().includes("плохо") || messageContent.toLowerCase().includes("грустно")) {
      responseText = "Мне жаль это слышать. Попробуй описать, что именно вызвало эти чувства?";
    } else if (pastMemories && pastMemories.length > 3) {
      responseText = "Интересно. Я помню, мы уже обсуждали подобные вещи. Давай попробуем найти закономерность. Что ты об этом думаешь?";
    }

    setTimeout(async () => {
      await supabase.from("messages").insert({
        conversation_id: conversationId, sender_id: AI_USER_ID, content: responseText, message_type: "text"
      });
      await supabase.from("conversations").update({ updated_at: new Date().toISOString() }).eq("id", conversationId);
    }, 1500);

  } catch (err) {
    console.error("Error in AI Psychologist service:", err);
  }
};

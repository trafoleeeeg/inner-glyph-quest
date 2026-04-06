import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const AI_USER_ID = "00000000-0000-0000-0000-000000000000";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { conversation_id, user_id, message } = await req.json();
    if (!conversation_id || !user_id || !message) {
      return new Response(JSON.stringify({ error: "Missing fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch recent conversation history for context
    const { data: recentMessages } = await supabaseAdmin
      .from("messages")
      .select("sender_id, content, message_type")
      .eq("conversation_id", conversation_id)
      .eq("message_type", "text")
      .order("created_at", { ascending: false })
      .limit(20);

    const history = (recentMessages || []).reverse().map((m: any) => ({
      role: m.sender_id === AI_USER_ID ? "assistant" : "user",
      content: m.content || "",
    }));

    // Fetch AI memory for this user
    const { data: memories } = await supabaseAdmin
      .from("ai_memory_nodes")
      .select("content, category")
      .eq("user_id", user_id)
      .order("created_at", { ascending: false })
      .limit(10);

    const memoryContext = memories?.length
      ? `\n\nИзвестные факты о пользователе:\n${memories.map((m: any) => `- ${m.content}`).join("\n")}`
      : "";

    const systemPrompt = `Ты — ИИ-психолог в приложении для саморазвития. Твоя задача — поддерживать пользователя, помогать разобраться в эмоциях и мыслях, задавать уточняющие вопросы.

Правила:
- Отвечай на русском языке
- Будь эмпатичным, тёплым и внимательным
- Задавай открытые вопросы чтобы лучше понять ситуацию
- Не ставь диагнозы, но помогай осознавать паттерны
- Отвечай кратко (2-4 предложения), если пользователь не просит подробнее
- Запоминай контекст разговора${memoryContext}`;

    // Call Lovable AI
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...history,
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errText);

      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Слишком много запросов, попробуй позже" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "Превышен лимит AI" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const responseText = aiData.choices?.[0]?.message?.content || "Не удалось сгенерировать ответ.";

    // Save AI response as message using service role (bypasses RLS)
    await supabaseAdmin.from("messages").insert({
      conversation_id,
      sender_id: AI_USER_ID,
      content: responseText,
      message_type: "text",
    });

    await supabaseAdmin.from("conversations").update({
      updated_at: new Date().toISOString(),
    }).eq("id", conversation_id);

    // Extract and save memory if relevant keywords found
    const keywords = ["я", "мне", "чувствую", "хочу", "проблема", "страх", "радость", "мысль", "боюсь", "люблю", "ненавижу"];
    const words = message.toLowerCase().replace(/[.,!?]/g, "").split(/\s+/);
    if (words.some((w: string) => keywords.includes(w))) {
      await supabaseAdmin.from("ai_memory_nodes").insert({
        user_id,
        content: `Пользователь сказал: "${message}"`,
        category: "conversation_fact",
        importance: 1,
      });
    }

    return new Response(JSON.stringify({ success: true, response: responseText }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-psychologist error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

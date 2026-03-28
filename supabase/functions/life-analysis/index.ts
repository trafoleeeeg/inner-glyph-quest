import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { spheres, hobbies, goals } = await req.json();
    
    if (!spheres || typeof spheres !== "object") {
      return new Response(JSON.stringify({ error: "Invalid spheres data" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const prompt = `Ты — AI-коуч по формированию привычек. Пользователь оценил свои сферы жизни от 1 до 5:
${Object.entries(spheres).map(([k, v]) => `- ${k}: ${v}/5`).join("\n")}

Увлечения: ${hobbies || "не указаны"}
Цели: ${goals || "не указаны"}

На основе этих данных предложи 5-7 конкретных ежедневных привычек, которые помогут улучшить слабые сферы. Для каждой привычки укажи:
1. Название (короткое, до 5 слов)
2. Описание (1 предложение, зачем это нужно)
3. Категорию: health, mind, social, career, creative, spiritual
4. Иконку-эмодзи

Ответь ТОЛЬКО вызовом функции.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "Ты помогаешь людям формировать полезные привычки. Отвечай только на русском языке." },
          { role: "user", content: prompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "suggest_habits",
              description: "Return habit suggestions based on life analysis",
              parameters: {
                type: "object",
                properties: {
                  habits: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string" },
                        description: { type: "string" },
                        category: { type: "string", enum: ["health", "mind", "social", "career", "creative", "spiritual"] },
                        icon: { type: "string" },
                      },
                      required: ["title", "description", "category", "icon"],
                      additionalProperties: false,
                    },
                  },
                  summary: { type: "string", description: "Brief analysis of user's life balance in Russian" },
                },
                required: ["habits", "summary"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "suggest_habits" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Слишком много запросов, попробуйте позже" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Требуется пополнение баланса" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    
    if (toolCall?.function?.arguments) {
      const result = JSON.parse(toolCall.function.arguments);
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "No suggestions generated" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("life-analysis error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

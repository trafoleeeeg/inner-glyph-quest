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

    // Find weakest spheres
    const sortedSpheres = Object.entries(spheres).sort((a, b) => Number(a[1]) - Number(b[1]));
    const weakest = sortedSpheres.slice(0, 3).map(([k, v]) => `${k}: ${v}/5`).join(", ");
    const strongest = sortedSpheres.slice(-2).map(([k, v]) => `${k}: ${v}/5`).join(", ");

    const prompt = `Ты — AI-стратег по трансформации личности. Твоя задача — не просто предложить привычки, а ВЗЛОМАТЬ систему мотивации человека и дать ему новую идентичность.

ДАННЫЕ ПОЛЬЗОВАТЕЛЯ:
Сферы жизни (от 1 до 5):
${Object.entries(spheres).map(([k, v]) => `- ${k}: ${v}/5`).join("\n")}

Самые слабые: ${weakest}
Самые сильные: ${strongest}

Увлечения: ${hobbies || "не указаны"}
Цели: ${goals || "не указаны"}

ТВОЯ СТРАТЕГИЯ:

1. ДИАГНОСТИКА: Определи корневую проблему. Обычно слабые сферы — это симптом, а не причина. Найди, что блокирует рост.

2. НОВАЯ ИДЕНТИЧНОСТЬ: Вместо «делай X минут в день» — формулируй как трансформацию:
   - НЕ «Бегай 30 минут» → А «Стань человеком, который двигается каждый день»
   - НЕ «Читай книги» → А «Стань тем, кто каждый день инвестирует в свой разум»
   - НЕ «Медитируй» → А «Научись управлять своим состоянием»

3. ПРИЧИННО-СЛЕДСТВЕННЫЕ СВЯЗИ: Для каждой привычки объясни МЕХАНИЗМ:
   «Эта привычка → влияет на [сферу] → потому что [конкретный механизм]»

4. СТРАТЕГИЧЕСКАЯ СИСТЕМА: Привычки должны усиливать друг друга. Например:
   - Утренняя рутина → даёт энергию → позволяет лучше работать → улучшает карьеру → даёт уверенность → улучшает отношения

5. НИКАКОГО МУСОРА: Запрещены бессмысленные действия типа «фотографировать предмет», «выпить воды», «записать мысль». Только то, что РЕАЛЬНО двигает к целям.

6. УЧИТЫВАЙ УВЛЕЧЕНИЯ: Если человек любит музыку — встрой это в систему привычек. Используй его сильные стороны как рычаг для слабых.

ПРАВИЛА ФОРМУЛИРОВКИ:
- Название: 3-5 слов, звучит как часть идентичности
- Описание: 1 предложение — ПОЧЕМУ эта привычка важна для ЭТОГО человека + какую сферу прокачивает
- Привычки 5-15 минут в день, реально выполнимые
- 5-7 привычек, формирующих СИСТЕМУ

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
          { role: "system", content: "Ты — стратег по трансформации личности. Твоя цель — создать систему привычек, которая изменит жизнь человека. Отвечай только на русском." },
          { role: "user", content: prompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "suggest_habits",
              description: "Return a strategic habit system based on life analysis",
              parameters: {
                type: "object",
                properties: {
                  habits: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string", description: "Short identity-based habit name (3-5 words)" },
                        description: { type: "string", description: "Why this habit matters for THIS person + which sphere it improves" },
                        category: { type: "string", enum: ["health", "mind", "social", "career", "creative", "spiritual"] },
                        icon: { type: "string" },
                      },
                      required: ["title", "description", "category", "icon"],
                      additionalProperties: false,
                    },
                  },
                  summary: { type: "string", description: "Strategic diagnosis: what's the root problem and how this habit system solves it (2-3 sentences, Russian)" },
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

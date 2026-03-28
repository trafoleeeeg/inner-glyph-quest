import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new Error("Not authenticated");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();

    const [moods, dreams, completions, drives, profile] = await Promise.all([
      supabase.from("mood_entries").select("mood, energy_level, note, created_at").eq("user_id", user.id).gte("created_at", twoWeeksAgo).order("created_at", { ascending: false }).limit(30),
      supabase.from("dream_entries").select("title, description, lucidity, created_at").eq("user_id", user.id).gte("created_at", twoWeeksAgo).order("created_at", { ascending: false }).limit(10),
      supabase.from("mission_completions").select("xp_earned, completed_at, missions(title, category)").eq("user_id", user.id).gte("completed_at", twoWeeksAgo).order("completed_at", { ascending: false }).limit(30),
      supabase.from("inner_drives").select("name, strength, description").eq("user_id", user.id),
      supabase.from("profiles").select("level, xp, energy, streak, total_missions_completed, total_dreams_logged").eq("user_id", user.id).single(),
    ]);

    const dataSummary = {
      moods: (moods.data || []).map(m => ({ mood: m.mood, energy: m.energy_level, note: m.note, date: m.created_at })),
      dreams: (dreams.data || []).map(d => ({ title: d.title, lucidity: d.lucidity, date: d.created_at })),
      completions: (completions.data || []).length,
      drives: (drives.data || []).map(d => ({ name: d.name, strength: d.strength })),
      profile: profile.data,
    };

    const systemPrompt = `Ты — AI-аналитик приложения Inner Glyph Quest для саморазвития. 
Анализируй данные пользователя и давай персонализированные инсайты на русском языке.
Формат ответа: 3-5 коротких инсайтов, каждый начинается с эмодзи.
Фокус: паттерны настроения, связь снов с энергией, баланс драйвов, рекомендации.
Будь конкретным, используй числа из данных. Не более 500 символов суммарно.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Данные пользователя за 2 недели:\n${JSON.stringify(dataSummary, null, 2)}` },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Слишком много запросов, попробуйте позже" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Необходимо пополнить баланс AI" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiData = await response.json();
    const content = aiData.choices?.[0]?.message?.content || "Недостаточно данных для анализа";

    // Save insight
    await supabase.from("ai_insights").insert({
      user_id: user.id,
      insight_type: "pattern",
      content,
      data_summary: dataSummary,
    });

    return new Response(JSON.stringify({ insight: content }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-insights error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ARCHETYPE_PROFILES: Record<string, { name: string; driver: string; restriction: string; assign: string }> = {
  analyzer: {
    name: "Анализатор (Псевдопродуктивный)",
    driver: "Доминирование Интерпретатора. Гиперактивность аналитических сетей при подавлении моторной инициации. Бесконечная подготовка маскируется под работу.",
    restriction: "ЗАПРЕЩЕНЫ: трекеры планирования, ведение дневников, таймеры с доступом в сеть. Анализатору НЕЛЬЗЯ давать инструменты для рефлексии — это его ловушка.",
    assign: "НАЗНАЧИТЬ: Жёсткий Информационный Блэкаут + Слепое Исполнение. Обязательный запуск через физический сброс для прерывания руминации.",
  },
  perfectionist: {
    name: "Перфекционист (Избегающий)",
    driver: "Гиперреактивность миндалины. Неидеальный результат воспринимается как физическая угрозу. Паралич перед задачами из-за страха ошибки.",
    restriction: "ЗАПРЕЩЕНЫ: глифы с оценкой качества. Никакого рейтингования результата — только оценка факта завершения времени.",
    assign: "НАЗНАЧИТЬ: Принудительное Несовершенство (жёсткие таймлайны) + Когнитивная Выгрузка перед стартом.",
  },
  escapist: {
    name: "Эскапист (Гедонист)",
    driver: "Дефицит D2-рецепторов дофамина. Истощённая система вознаграждения ищет любые доступные стимулы — соцсети, видео, еда, алкоголь.",
    restriction: "ЗАПРЕЩЕНА: Прогрессивная Перегрузка на старте (сломает слабую мембрану). Начинать с ультра-коротких сессий.",
    assign: "НАЗНАЧИТЬ: Таймер Смерти (начиная с 10 минут) + Резкая Сенсорная Стимуляция при желании отвлечься.",
  },
  crisis_creator: {
    name: "Создатель Кризисов (Адреналиновый)",
    driver: "Базовое гипоарозальное состояние. Зависимость от оси ГГЯ — кортизол/адреналин как единственный источник мотивации. Ждёт до последней ночи.",
    restriction: "ЗАПРЕЩЕНЫ: мягкие напоминания и бессрочные задачи. Этому типу нужен жёсткий кортизоловый пик.",
    assign: "НАЗНАЧИТЬ: Депозит Намерения с реальным штрафом + искусственные жёсткие дедлайны.",
  },
  rebel: {
    name: "Бунтарь (Ловец новизны)",
    driver: "Ускоренная габитуация. Нейроны требуют постоянного эффекта новизны. Энтузиазм на старте сменяется отторжением при рутине.",
    restriction: "ЗАПРЕЩЕНЫ: статичные привычки в одно время. Повторяющиеся чек-листы обнулят дофамин.",
    assign: "НАЗНАЧИТЬ: Фантомный Конкурент + Изменчивая Переменная Рутина. Максимальная непредсказуемость условий.",
  },
};

const GLYPH_CATEGORIES = `
КАТЕГОРИИ ГЛИФОВ (Анти-Булшит Привычки):

1. COGNITIVE CONSTRAINT (Когнитивные Ограничители):
- Таймер Смерти: фокус на одном окне/задаче, любое переключение = потеря
- Информационный Блэкаут: отключение интернета на период работы
- Депозит Намерения: что-то ценное ставится на кон (время, привилегии)
- Когнитивная Выгрузка: 5 минут записать все тревоги перед работой
- Принудительное Несовершенство: жёсткий таймлайн, результат сдаётся как есть

2. PHYSICAL SHOCK (Физическое Заземление):
- Холодовой Шок: холодная вода/лёд для перезагрузки вегетативной системы
- Изометрическая Боль: планка/стульчик до отказа — возвращает сознание в тело
- Соматическая Встряска 10-1: интенсивное встряхивание + обратный отсчёт
- Гиперкапническая Задержка: задержка дыхания для отключения Интерпретатора
- Резкая Сенсорная Стимуляция: острый/кислый раздражитель для прерывания диссоциации

3. DYNAMIC COMPLEXITY (Управляемое Усложнение):
- Изменчивая Рутина: никогда одно время/место/условия — сохранять новизну
- Прогрессивная Перегрузка: каждые 3-5 дней увеличивать требования на 15%
- Искусственные Ограничения: усложнение среды (писать без Backspace и т.д.)
- Слепое Исполнение: скрыть все метрики прогресса — только процесс
- Фантомный Конкурент: виртуальный противник на 5% впереди
`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { answers, archetype, goals, membrane, somatic, interpreter_speed } = await req.json();

    if (!archetype || !answers) {
      return new Response(JSON.stringify({ error: "Missing diagnostic data" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const archetypeProfile = ARCHETYPE_PROFILES[archetype] || ARCHETYPE_PROFILES.escapist;

    const prompt = `Ты — нейробиологический движок персонализации привычек. Твоя задача — НЕ предлагать мягкие советы, а НАЗНАЧИТЬ жёсткие поведенческие протоколы (Глифы), которые алгоритмически ломают паттерны прокрастинации конкретного пользователя.

ДИАГНОСТИКА ПОЛЬЗОВАТЕЛЯ:
━━━━━━━━━━━━━━━━━━━━━━━
Архетип: ${archetypeProfile.name}
Нейробиологический драйвер: ${archetypeProfile.driver}

Ответы диагностики:
- Вектор боли (Q1): ${answers.q1}
- Страх будущего (Q2): ${answers.q2}  
- Паттерн откладывания (Q3): ${answers.q3}
- Куда уходит время (Q4): ${answers.q4}
- Фокус (Q5): ${membrane || answers.q5}
- Реакция на сложность (Q6): ${answers.q6}
- Почему бросает привычки (Q7): ${interpreter_speed?.habit_fail || answers.q7}
- Паттерн начала (Q8): ${interpreter_speed?.start_pattern || answers.q8}
- Утренняя энергия (Q9): ${somatic?.morning || answers.q9}
- Телесное состояние (Q10): ${somatic?.body || answers.q10}

Цели пользователя: ${goals || "не указаны"}

ПРАВИЛА НАЗНАЧЕНИЯ:
${archetypeProfile.assign}
${archetypeProfile.restriction}

${GLYPH_CATEGORIES}

ПРОТОКОЛ ФОРМИРОВАНИЯ ОТВЕТА:

1. ДИАГНОЗ: Определи корневую причину прокрастинации этого конкретного человека. Не общие фразы — конкретный механизм сбоя (какая часть мозга барахлит и почему).

2. НАЗНАЧЕНИЕ ГЛИФОВ: Для каждого глифа объясни:
   - МЕХАНИЗМ: почему именно этот протокол нужен ЭТОМУ архетипу
   - НЕЙРОБИОЛОГИЯ: какой нейронный контур он перезагружает
   - ДЛИТЕЛЬНОСТЬ: конкретное время (5-45 мин)

3. СТРОГИЕ ЗАПРЕТЫ: Глифы, которые КОНТРПРОДУКТИВНЫ для этого архетипа.

4. ЦЕПОЧКА ВЫПОЛНЕНИЯ: В каком порядке выполнять глифы (например: физический сброс → когнитивный блок → работа).

ПРАВИЛА:
- 5-7 глифов, формирующих СИСТЕМУ
- Никаких бессмысленных действий (фотографировать предмет, пить воду)
- Каждый глиф — конкретный протокол с точным временем
- Название: 2-4 слова, жёсткое и конкретное
- Описание: механизм + почему именно для этого архетипа + конкретное время
- glyph_type: одна из категорий (cognitive_constraint, physical_shock, dynamic_complexity)

Ответь ТОЛЬКО вызовом функции.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "Ты — нейробиологический движок мотивации. Назначаешь жёсткие поведенческие протоколы на основе архетипа прокрастинатора. Никаких мягких советов. Отвечай только на русском." },
          { role: "user", content: prompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "assign_glyphs",
              description: "Assign behavioral protocols (glyphs) based on procrastinator archetype diagnosis",
              parameters: {
                type: "object",
                properties: {
                  habits: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string", description: "Short glyph protocol name (2-4 words)" },
                        description: { type: "string", description: "Mechanism + why for this archetype + exact duration" },
                        category: { type: "string", enum: ["health", "mind", "social", "career", "creative", "spiritual"] },
                        icon: { type: "string" },
                        glyph_type: { type: "string", enum: ["cognitive_constraint", "physical_shock", "dynamic_complexity"] },
                      },
                      required: ["title", "description", "category", "icon", "glyph_type"],
                      additionalProperties: false,
                    },
                  },
                  summary: { type: "string", description: "Neurobiological diagnosis: root cause of this person's procrastination pattern and how the glyph system attacks it (3-4 sentences, Russian)" },
                },
                required: ["habits", "summary"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "assign_glyphs" } },
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

    return new Response(JSON.stringify({ error: "No protocols generated" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("life-analysis error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

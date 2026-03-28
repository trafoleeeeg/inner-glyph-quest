import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, ArrowRight, Sparkles, Loader2, Check, Zap, Brain, Shield, Flame, Sword } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import BottomNav from "@/components/BottomNav";

// ============ ARCHETYPE SYSTEM from the document ============

// Screen 1: Pain Vector (Vpain)
const PAIN_QUESTIONS = {
  q1: {
    label: "Что тебя бесит больше всего?",
    options: [
      { id: "time_waste", text: "Трачу время впустую — день прошёл, а ничего не сделал", icon: "⏳" },
      { id: "career_stall", text: "Карьера не двигается — потенциал есть, а результатов нет", icon: "📉" },
      { id: "health_decline", text: "Здоровье ухудшается — знаю что делать, но не делаю", icon: "🫠" },
      { id: "chaos", text: "Полный хаос — не контролирую свою жизнь", icon: "🌪️" },
    ],
  },
  q2: {
    label: "Какое будущее пугает тебя больше?",
    options: [
      { id: "missed_career", text: "Так и не реализовал свой потенциал", icon: "💀" },
      { id: "health_ruin", text: "Разрушил здоровье бездействием", icon: "🏥" },
      { id: "loneliness", text: "Остался один из-за своих привычек", icon: "🏚️" },
      { id: "mediocrity", text: "Прожил обычную серую жизнь", icon: "👤" },
    ],
  },
};

// Screen 2: Entropy Type (Eleak) — determines archetype
const ENTROPY_QUESTIONS = {
  q3: {
    label: "Когда горит дедлайн, ты обычно…",
    options: [
      { id: "escape_noise", text: "Сбегаю в ленту TikTok/YouTube/Reddit", icon: "📱", archetype: "escapist" },
      { id: "pseudo_productive", text: "Начинаю «готовиться» — читаю статьи, настраиваю Notion", icon: "📋", archetype: "analyzer" },
      { id: "last_minute", text: "Жду до последней ночи — и тогда делаю на кураже", icon: "⚡", archetype: "crisis_creator" },
      { id: "avoid_physical", text: "Физически не могу заставить себя начать — как паралич", icon: "🧊", archetype: "perfectionist" },
    ],
  },
  q4: {
    label: "На что уходит больше всего «слитого» времени?",
    options: [
      { id: "scrolling", text: "Бесконечная лента (соцсети, видео)", icon: "🔄", archetype: "escapist" },
      { id: "planning", text: "Планирование и организация (без действий)", icon: "📝", archetype: "analyzer" },
      { id: "new_projects", text: "Новые идеи и проекты (бросаю старые)", icon: "🚀", archetype: "rebel" },
      { id: "news_debates", text: "Чтение новостей, споров, философствование", icon: "📰", archetype: "analyzer" },
    ],
  },
};

// Screen 3: Membrane Permeability (Mperm)
const MEMBRANE_QUESTIONS = {
  q5: {
    label: "Сколько ты можешь читать скучный текст без перерыва?",
    options: [
      { id: "under2", text: "Меньше 2 минут", icon: "💨", value: "weak" },
      { id: "2to10", text: "2–10 минут", icon: "⏱️", value: "medium" },
      { id: "10to30", text: "10–30 минут", icon: "📖", value: "strong" },
      { id: "over30", text: "Больше 30 минут, если тема важная", icon: "🧘", value: "very_strong" },
    ],
  },
  q6: {
    label: "Что происходит, когда задача кажется сложной?",
    options: [
      { id: "distract", text: "Отвлекаюсь на что-то лёгкое", icon: "🐿️", value: "weak_focus" },
      { id: "doubt", text: "Зависаю в сомнениях — «а вдруг я не справлюсь»", icon: "🤔", value: "high_initiation" },
      { id: "simplify", text: "Пытаюсь разбить на части, но бросаю", icon: "✂️", value: "medium" },
      { id: "adrenaline", text: "Жду пока не станет критично, потом делаю", icon: "🔥", value: "crisis_dependent" },
    ],
  },
};

// Screen 4: Interpreter Speed (Qvel)
const INTERPRETER_QUESTIONS = {
  q7: {
    label: "Почему ты бросаешь привычки?",
    options: [
      { id: "crisis_ends", text: "Пропадает ощущение срочности", icon: "📉" },
      { id: "forget", text: "Просто забываю или отвлекаюсь", icon: "🫧" },
      { id: "bored", text: "Становится скучно — уже не интересно", icon: "🥱" },
      { id: "perfect_fail", text: "Пропустил один день и забил совсем", icon: "💔" },
    ],
  },
  q8: {
    label: "Как ты начинаешь новое дело?",
    options: [
      { id: "concept_love", text: "Обожаю придумывать, но быстро теряю интерес к рутине", icon: "💡" },
      { id: "slow_warm", text: "Долго раскачиваюсь, но потом вхожу в поток", icon: "🐢" },
      { id: "need_push", text: "Нужен внешний пинок или дедлайн", icon: "🦵" },
      { id: "plan_never_start", text: "Планирую идеально, но так и не начинаю", icon: "📊" },
    ],
  },
};

// Screen 5: Somatic Context (Csom)
const SOMATIC_QUESTIONS = {
  q9: {
    label: "Как ты себя чувствуешь утром?",
    options: [
      { id: "no_energy", text: "Нет энергии — утро = страдание", icon: "😴", value: "high_deficit" },
      { id: "ok_after_coffee", text: "Нормально после кофе/душа", icon: "☕", value: "medium" },
      { id: "depends", text: "Зависит от дня — нестабильно", icon: "🎲", value: "unstable" },
      { id: "good", text: "Обычно бодро", icon: "☀️", value: "low_deficit" },
    ],
  },
  q10: {
    label: "Как ты чувствуешь своё тело в течение дня?",
    options: [
      { id: "blur_boundaries", text: "Границы стёрты — живу/работаю/сплю в одном месте", icon: "🏠", value: "dissociated" },
      { id: "sedentary", text: "Сижу весь день — тело как будто не моё", icon: "🪑", value: "sedentary" },
      { id: "some_movement", text: "Иногда двигаюсь, но мало", icon: "🚶", value: "some" },
      { id: "active", text: "Регулярно тренируюсь", icon: "🏃", value: "active" },
    ],
  },
};

interface HabitSuggestion {
  title: string;
  description: string;
  category: string;
  icon: string;
  glyph_type?: string;
}

const ARCHETYPE_INFO: Record<string, { name: string; emoji: string; description: string; icon: React.ReactNode }> = {
  analyzer: {
    name: "Анализатор",
    emoji: "🔍",
    description: "Ты прячешься за подготовкой. Бесконечное планирование, чтение, настройка инструментов — твой мозг убеждает тебя, что это работа. Но это ловушка Интерпретатора.",
    icon: <Brain className="w-5 h-5" />,
  },
  perfectionist: {
    name: "Перфекционист",
    emoji: "🎯",
    description: "Страх неидеального результата парализует тебя. Миндалина запускает реакцию избегания при одной мысли о том, что результат будет «недостаточно хорош».",
    icon: <Shield className="w-5 h-5" />,
  },
  escapist: {
    name: "Эскапист",
    emoji: "📱",
    description: "Твоя дофаминовая система истощена. Ты заглушаешь тревогу дешёвыми стимулами — лента, видео, еда. Мозг отчаянно ищет хоть какой-то дофамин.",
    icon: <Zap className="w-5 h-5" />,
  },
  crisis_creator: {
    name: "Создатель Кризисов",
    emoji: "🔥",
    description: "Твой мозг не генерирует мотивацию без адреналина. Ты ждёшь, пока ситуация станет критической — и тогда кортизол заставляет тебя действовать.",
    icon: <Flame className="w-5 h-5" />,
  },
  rebel: {
    name: "Бунтарь",
    emoji: "⚔️",
    description: "Тебе быстро становится скучно. Новый проект — восторг. Рутинная фаза — отторжение. Твои нейроны требуют постоянной новизны.",
    icon: <Sword className="w-5 h-5" />,
  },
};

function detectArchetype(answers: Record<string, string>): string {
  const scores: Record<string, number> = { analyzer: 0, perfectionist: 0, escapist: 0, crisis_creator: 0, rebel: 0 };

  // Q3 direct archetype signal (strongest)
  const q3 = answers.q3;
  if (q3 === "escape_noise") scores.escapist += 3;
  if (q3 === "pseudo_productive") scores.analyzer += 3;
  if (q3 === "last_minute") scores.crisis_creator += 3;
  if (q3 === "avoid_physical") scores.perfectionist += 3;

  // Q4 entropy direction
  const q4 = answers.q4;
  if (q4 === "scrolling") scores.escapist += 2;
  if (q4 === "planning" || q4 === "news_debates") scores.analyzer += 2;
  if (q4 === "new_projects") scores.rebel += 2;

  // Q6 difficulty reaction
  const q6 = answers.q6;
  if (q6 === "distract") scores.escapist += 1;
  if (q6 === "doubt") scores.perfectionist += 1;
  if (q6 === "adrenaline") scores.crisis_creator += 1;

  // Q7 why habits fail
  const q7 = answers.q7;
  if (q7 === "crisis_ends") scores.crisis_creator += 1;
  if (q7 === "bored") scores.rebel += 2;
  if (q7 === "perfect_fail") scores.perfectionist += 1;
  if (q7 === "forget") scores.escapist += 1;

  // Q8 start pattern
  const q8 = answers.q8;
  if (q8 === "concept_love") scores.rebel += 2;
  if (q8 === "need_push") scores.crisis_creator += 1;
  if (q8 === "plan_never_start") scores.analyzer += 2;
  if (q8 === "slow_warm") scores.perfectionist += 1;

  return Object.entries(scores).sort((a, b) => b[1] - a[1])[0][0];
}

const LifeAnalysisPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [goals, setGoals] = useState("");
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<HabitSuggestion[]>([]);
  const [summary, setSummary] = useState("");
  const [archetype, setArchetype] = useState<string | null>(null);
  const [addedHabits, setAddedHabits] = useState<Set<number>>(new Set());

  const selectAnswer = (qKey: string, optionId: string) => {
    setAnswers(prev => ({ ...prev, [qKey]: optionId }));
  };

  const analyze = async () => {
    setLoading(true);
    try {
      const detectedArchetype = detectArchetype(answers);
      setArchetype(detectedArchetype);

      const { data, error } = await supabase.functions.invoke("life-analysis", {
        body: {
          answers,
          archetype: detectedArchetype,
          goals,
          membrane: answers.q5,
          somatic: { morning: answers.q9, body: answers.q10 },
          interpreter_speed: { habit_fail: answers.q7, start_pattern: answers.q8 },
        },
      });
      if (error) throw error;
      const habits = data.habits || [];
      setSuggestions(habits);
      setSummary(data.summary || "");

      // Auto-add all habits as missions
      if (user && habits.length > 0) {
        const missionsToInsert = habits.map((h: HabitSuggestion) => ({
          user_id: user.id,
          title: h.title,
          description: h.description,
          category: h.category === "health" ? "health" : "habit",
          icon: h.icon,
          xp_reward: 25,
          is_daily: true,
          is_active: true,
        }));
        const { error: insertError } = await supabase.from("missions").insert(missionsToInsert);
        if (!insertError) {
          setAddedHabits(new Set(habits.map((_: any, i: number) => i)));
          toast.success(`${habits.length} глифов назначено!`);
        }
      }

      // Save life profile
      if (user) {
        await supabase.from("life_profiles").upsert({
          user_id: user.id,
          answers: { ...answers, goals, archetype: detectedArchetype },
          ai_recommendations: data,
        }, { onConflict: "user_id" });
      }

      setStep(6); // results
    } catch (e: any) {
      toast.error(e.message || "Не удалось получить рекомендации");
    } finally {
      setLoading(false);
    }
  };

  const QuestionScreen = ({
    title,
    subtitle,
    questions,
  }: {
    title: string;
    subtitle: string;
    questions: { key: string; label: string; options: { id: string; text: string; icon: string }[] }[];
  }) => (
    <motion.div key={title} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-5">
      <div className="text-center space-y-2">
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </div>
      {questions.map(q => (
        <div key={q.key} className="space-y-2">
          <p className="text-sm font-medium text-foreground">{q.label}</p>
          <div className="space-y-2">
            {q.options.map(opt => (
              <motion.button
                key={opt.id}
                whileTap={{ scale: 0.98 }}
                onClick={() => selectAnswer(q.key, opt.id)}
                className={`w-full text-left p-3 rounded-xl border transition-all flex items-start gap-3 ${
                  answers[q.key] === opt.id
                    ? "border-primary/50 bg-primary/10"
                    : "border-border/30 bg-muted/10 hover:border-primary/20"
                }`}
              >
                <span className="text-lg flex-shrink-0">{opt.icon}</span>
                <span className="text-xs text-foreground/90">{opt.text}</span>
              </motion.button>
            ))}
          </div>
        </div>
      ))}
    </motion.div>
  );

  const canProceed = (s: number) => {
    if (s === 0) return answers.q1 && answers.q2;
    if (s === 1) return answers.q3 && answers.q4;
    if (s === 2) return answers.q5 && answers.q6;
    if (s === 3) return answers.q7 && answers.q8;
    if (s === 4) return answers.q9 && answers.q10;
    return true;
  };

  const SCREEN_TITLES = [
    "Шаг 1: Вектор боли",
    "Шаг 2: Паттерн откладывания",
    "Шаг 3: Фокус и внимание",
    "Шаг 4: Привычки и мотивация",
    "Шаг 5: Тело и энергия",
    "Цели",
  ];

  const steps = [
    // Screen 1: Pain Vector
    <QuestionScreen
      key="pain"
      title="Вектор боли"
      subtitle="Что мешает тебе жить так, как ты хочешь?"
      questions={[
        { key: "q1", label: PAIN_QUESTIONS.q1.label, options: PAIN_QUESTIONS.q1.options.map(o => ({ id: o.id, text: o.text, icon: o.icon })) },
        { key: "q2", label: PAIN_QUESTIONS.q2.label, options: PAIN_QUESTIONS.q2.options.map(o => ({ id: o.id, text: o.text, icon: o.icon })) },
      ]}
    />,

    // Screen 2: Entropy Type
    <QuestionScreen
      key="entropy"
      title="Паттерн откладывания"
      subtitle="Как именно ты прокрастинируешь?"
      questions={[
        { key: "q3", label: ENTROPY_QUESTIONS.q3.label, options: ENTROPY_QUESTIONS.q3.options.map(o => ({ id: o.id, text: o.text, icon: o.icon })) },
        { key: "q4", label: ENTROPY_QUESTIONS.q4.label, options: ENTROPY_QUESTIONS.q4.options.map(o => ({ id: o.id, text: o.text, icon: o.icon })) },
      ]}
    />,

    // Screen 3: Membrane
    <QuestionScreen
      key="membrane"
      title="Фокус и внимание"
      subtitle="Как устроена твоя концентрация?"
      questions={[
        { key: "q5", label: MEMBRANE_QUESTIONS.q5.label, options: MEMBRANE_QUESTIONS.q5.options.map(o => ({ id: o.id, text: o.text, icon: o.icon })) },
        { key: "q6", label: MEMBRANE_QUESTIONS.q6.label, options: MEMBRANE_QUESTIONS.q6.options.map(o => ({ id: o.id, text: o.text, icon: o.icon })) },
      ]}
    />,

    // Screen 4: Interpreter
    <QuestionScreen
      key="interpreter"
      title="Привычки и мотивация"
      subtitle="Почему привычки не задерживаются?"
      questions={[
        { key: "q7", label: INTERPRETER_QUESTIONS.q7.label, options: INTERPRETER_QUESTIONS.q7.options.map(o => ({ id: o.id, text: o.text, icon: o.icon })) },
        { key: "q8", label: INTERPRETER_QUESTIONS.q8.label, options: INTERPRETER_QUESTIONS.q8.options.map(o => ({ id: o.id, text: o.text, icon: o.icon })) },
      ]}
    />,

    // Screen 5: Somatic
    <QuestionScreen
      key="somatic"
      title="Тело и энергия"
      subtitle="Насколько ты связан со своим телом?"
      questions={[
        { key: "q9", label: SOMATIC_QUESTIONS.q9.label, options: SOMATIC_QUESTIONS.q9.options.map(o => ({ id: o.id, text: o.text, icon: o.icon })) },
        { key: "q10", label: SOMATIC_QUESTIONS.q10.label, options: SOMATIC_QUESTIONS.q10.options.map(o => ({ id: o.id, text: o.text, icon: o.icon })) },
      ]}
    />,

    // Screen 6: Goals (free text)
    <motion.div key="goals" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-5">
      <div className="text-center space-y-2">
        <h2 className="text-lg font-semibold text-foreground">Что хочешь изменить?</h2>
        <p className="text-xs text-muted-foreground">Расскажи своими словами — алгоритм подберёт протоколы под тебя</p>
      </div>
      <Textarea
        value={goals}
        onChange={e => setGoals(e.target.value)}
        placeholder="Например: перестать откладывать работу, начать тренироваться, убрать залипание в телефоне, высыпаться..."
        className="min-h-[120px] text-sm"
      />
    </motion.div>,

    // Screen 7: Results
    <motion.div key="results" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-5">
      {/* Archetype reveal */}
      {archetype && ARCHETYPE_INFO[archetype] && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-2xl p-5 border-2 border-destructive/30 bg-gradient-to-br from-destructive/10 to-destructive/5 text-center space-y-3"
        >
          <div className="text-4xl">{ARCHETYPE_INFO[archetype].emoji}</div>
          <h3 className="text-base font-bold text-foreground">
            Твой архетип: {ARCHETYPE_INFO[archetype].name}
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {ARCHETYPE_INFO[archetype].description}
          </p>
        </motion.div>
      )}

      {/* AI Summary */}
      {summary && (
        <div className="rounded-xl p-4 border border-primary/20 bg-primary/5">
          <p className="text-xs text-foreground/80 leading-relaxed">{summary}</p>
        </div>
      )}

      {/* Assigned Glyphs */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Zap className="w-4 h-4 text-accent" /> Назначенные протоколы
        </h3>
        {suggestions.map((habit, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass-card rounded-xl p-4 border border-border/30 flex items-center gap-3"
          >
            <span className="text-2xl">{habit.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">{habit.title}</p>
              <p className="text-[10px] text-muted-foreground leading-relaxed">{habit.description}</p>
              {habit.glyph_type && (
                <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-accent/10 text-accent text-[9px] font-mono">
                  {habit.glyph_type}
                </span>
              )}
            </div>
            {addedHabits.has(i) && (
              <div className="w-7 h-7 rounded-lg bg-accent/15 flex items-center justify-center">
                <Check className="w-4 h-4 text-accent" />
              </div>
            )}
          </motion.div>
        ))}
      </div>
      <div className="text-center space-y-3">
        <p className="text-xs text-accent font-medium">✅ Все протоколы назначены</p>
        <Button onClick={() => navigate("/")} className="w-full" variant="default">
          Начать трансформацию →
        </Button>
      </div>
    </motion.div>,
  ];

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-lg mx-auto px-4 pt-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => step > 0 ? setStep(step - 1) : navigate(-1)}
            className="w-8 h-8 rounded-lg bg-muted/30 border border-border/30 flex items-center justify-center text-muted-foreground">
            <ArrowLeft className="w-4 h-4" />
          </motion.button>
          <div className="flex-1">
            <h1 className="text-base font-semibold text-foreground">🧬 Диагностика</h1>
            <p className="text-[10px] text-muted-foreground">
              {step <= 5 ? SCREEN_TITLES[Math.min(step, 5)] : "Результаты"}
              {step <= 5 && ` • ${step + 1} из 6`}
            </p>
          </div>
        </div>

        {/* Progress */}
        {step <= 5 && (
          <div className="flex gap-1">
            {[0, 1, 2, 3, 4, 5].map(i => (
              <div key={i} className={`h-1 flex-1 rounded-full transition-all ${
                i <= step ? "bg-primary" : "bg-muted/30"
              }`} />
            ))}
          </div>
        )}

        {/* Content */}
        <AnimatePresence mode="wait">
          {steps[step]}
        </AnimatePresence>

        {/* Navigation */}
        {step <= 5 && (
          <div className="flex gap-3">
            {step > 0 && (
              <Button variant="outline" onClick={() => setStep(step - 1)} className="flex-1">
                Назад
              </Button>
            )}
            {step < 5 ? (
              <Button onClick={() => setStep(step + 1)} disabled={!canProceed(step)} className="flex-1">
                Далее <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <Button onClick={analyze} disabled={loading} className="flex-1">
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Sparkles className="w-4 h-4 mr-1" />}
                {loading ? "Анализирую паттерны..." : "Запустить диагностику"}
              </Button>
            )}
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
};

export default LifeAnalysisPage;

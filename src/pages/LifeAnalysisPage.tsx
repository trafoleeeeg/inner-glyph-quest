import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, ArrowRight, Sparkles, Loader2, Plus, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import BottomNav from "@/components/BottomNav";

const SPHERES = [
  { key: "health", label: "Здоровье", emoji: "💪", desc: "Физическая форма, сон, питание" },
  { key: "career", label: "Карьера", emoji: "💼", desc: "Работа, навыки, финансы" },
  { key: "relationships", label: "Отношения", emoji: "❤️", desc: "Семья, друзья, партнёр" },
  { key: "mind", label: "Развитие", emoji: "🧠", desc: "Обучение, чтение, рост" },
  { key: "creative", label: "Творчество", emoji: "🎨", desc: "Хобби, самовыражение" },
  { key: "spiritual", label: "Гармония", emoji: "🧘", desc: "Внутренний покой, осознанность" },
];

const HOBBY_TAGS = [
  "Спорт", "Музыка", "Чтение", "Игры", "Путешествия", "Кулинария",
  "Рисование", "Фотография", "Программирование", "Танцы", "Медитация", "Йога",
  "Бег", "Плавание", "Писательство", "Кино", "Настолки", "Волонтёрство",
];

interface HabitSuggestion {
  title: string;
  description: string;
  category: string;
  icon: string;
}

const LifeAnalysisPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [spheres, setSpheres] = useState<Record<string, number>>(
    Object.fromEntries(SPHERES.map(s => [s.key, 3]))
  );
  const [selectedHobbies, setSelectedHobbies] = useState<string[]>([]);
  const [goals, setGoals] = useState("");
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<HabitSuggestion[]>([]);
  const [summary, setSummary] = useState("");
  const [addedHabits, setAddedHabits] = useState<Set<number>>(new Set());

  const toggleHobby = (hobby: string) => {
    setSelectedHobbies(prev =>
      prev.includes(hobby) ? prev.filter(h => h !== hobby) : [...prev, hobby]
    );
  };

  const analyze = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("life-analysis", {
        body: { spheres, hobbies: selectedHobbies.join(", "), goals },
      });
      if (error) throw error;
      setSuggestions(data.habits || []);
      setSummary(data.summary || "");
      setStep(3);
    } catch (e: any) {
      toast.error(e.message || "Не удалось получить рекомендации");
    } finally {
      setLoading(false);
    }
  };

  const addHabit = async (habit: HabitSuggestion, index: number) => {
    if (!user) return;
    try {
      const { error } = await supabase.from("missions").insert({
        user_id: user.id,
        title: habit.title,
        description: habit.description,
        category: habit.category === "health" ? "health" : "habit",
        icon: habit.icon,
        xp_reward: 25,
        is_daily: true,
        is_active: true,
      });
      if (error) throw error;
      setAddedHabits(prev => new Set([...prev, index]));
      toast.success(`Привычка «${habit.title}» добавлена!`);
    } catch {
      toast.error("Не удалось добавить привычку");
    }
  };

  const steps = [
    // Step 0: Spheres
    <motion.div key="spheres" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-5">
      <div className="text-center space-y-2">
        <h2 className="text-lg font-semibold text-foreground">Оцени свою жизнь</h2>
        <p className="text-xs text-muted-foreground">Насколько ты доволен каждой сферой? (1 — плохо, 5 — отлично)</p>
      </div>
      <div className="space-y-4">
        {SPHERES.map(s => (
          <div key={s.key} className="glass-card rounded-xl p-4 border border-border/30">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-lg">{s.emoji}</span>
                <div>
                  <p className="text-sm font-medium text-foreground">{s.label}</p>
                  <p className="text-[10px] text-muted-foreground">{s.desc}</p>
                </div>
              </div>
              <span className="text-lg font-bold font-mono text-primary">{spheres[s.key]}</span>
            </div>
            <Slider
              value={[spheres[s.key]]}
              onValueChange={([v]) => setSpheres(prev => ({ ...prev, [s.key]: v }))}
              min={1} max={5} step={1}
              className="mt-1"
            />
          </div>
        ))}
      </div>
    </motion.div>,

    // Step 1: Hobbies
    <motion.div key="hobbies" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-5">
      <div className="text-center space-y-2">
        <h2 className="text-lg font-semibold text-foreground">Чем ты увлекаешься?</h2>
        <p className="text-xs text-muted-foreground">Выбери то, что тебе близко</p>
      </div>
      <div className="flex flex-wrap gap-2 justify-center">
        {HOBBY_TAGS.map(hobby => (
          <motion.button
            key={hobby}
            whileTap={{ scale: 0.95 }}
            onClick={() => toggleHobby(hobby)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              selectedHobbies.includes(hobby)
                ? "bg-primary/20 text-primary border border-primary/30"
                : "bg-muted/30 text-muted-foreground border border-border/30 hover:border-primary/20"
            }`}
          >
            {hobby}
          </motion.button>
        ))}
      </div>
    </motion.div>,

    // Step 2: Goals
    <motion.div key="goals" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-5">
      <div className="text-center space-y-2">
        <h2 className="text-lg font-semibold text-foreground">Что хочешь изменить?</h2>
        <p className="text-xs text-muted-foreground">Расскажи своими словами — AI подберёт привычки под тебя</p>
      </div>
      <Textarea
        value={goals}
        onChange={e => setGoals(e.target.value)}
        placeholder="Например: хочу больше энергии, начать бегать, читать каждый день, меньше сидеть в телефоне..."
        className="min-h-[120px] text-sm"
      />
    </motion.div>,

    // Step 3: Results
    <motion.div key="results" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-5">
      <div className="text-center space-y-2">
        <h2 className="text-lg font-semibold text-foreground flex items-center justify-center gap-2">
          <Sparkles className="w-5 h-5 text-accent" /> Рекомендации для тебя
        </h2>
        {summary && <p className="text-xs text-muted-foreground">{summary}</p>}
      </div>
      <div className="space-y-3">
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
              <p className="text-[10px] text-muted-foreground">{habit.description}</p>
            </div>
            <Button
              size="sm"
              variant={addedHabits.has(i) ? "secondary" : "default"}
              onClick={() => addHabit(habit, i)}
              disabled={addedHabits.has(i)}
              className="flex-shrink-0"
            >
              {addedHabits.has(i) ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            </Button>
          </motion.div>
        ))}
      </div>
      <Button onClick={() => navigate("/")} className="w-full" variant="outline">
        Вернуться на главную
      </Button>
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
            <h1 className="text-base font-semibold text-foreground">🧭 Узнай себя</h1>
            <p className="text-[10px] text-muted-foreground">Шаг {Math.min(step + 1, 3)} из 3</p>
          </div>
        </div>

        {/* Progress */}
        <div className="flex gap-1">
          {[0, 1, 2].map(i => (
            <div key={i} className={`h-1 flex-1 rounded-full transition-all ${
              i <= step ? "bg-primary" : "bg-muted/30"
            }`} />
          ))}
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {steps[step]}
        </AnimatePresence>

        {/* Navigation */}
        {step < 3 && (
          <div className="flex gap-3">
            {step > 0 && (
              <Button variant="outline" onClick={() => setStep(step - 1)} className="flex-1">
                Назад
              </Button>
            )}
            {step < 2 ? (
              <Button onClick={() => setStep(step + 1)} className="flex-1">
                Далее <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <Button onClick={analyze} disabled={loading} className="flex-1">
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Sparkles className="w-4 h-4 mr-1" />}
                {loading ? "Анализирую..." : "Получить рекомендации"}
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

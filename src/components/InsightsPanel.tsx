import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Lightbulb, TrendingUp, TrendingDown, AlertTriangle, Sparkles, ChevronDown, ChevronUp } from "lucide-react";

interface Insight {
  id: string;
  type: "pattern" | "warning" | "breakthrough" | "correlation";
  icon: React.ReactNode;
  title: string;
  body: string;
  color: string;
}

const InsightsPanel = () => {
  const { user } = useAuth();
  const [insights, setInsights] = useState<Insight[]>([]);
  const [expanded, setExpanded] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    generateInsights();
  }, [user]);

  const generateInsights = async () => {
    if (!user) return;
    const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();

    const [moodsRes, completionsRes, dreamsRes] = await Promise.all([
      supabase.from("mood_entries").select("mood, energy_level, note, created_at").eq("user_id", user.id).gte("created_at", twoWeeksAgo).order("created_at"),
      supabase.from("mission_completions").select("completed_at, xp_earned, mission_id").eq("user_id", user.id).gte("completed_at", twoWeeksAgo).order("completed_at"),
      supabase.from("dream_entries").select("lucidity, created_at, title").eq("user_id", user.id).gte("created_at", twoWeeksAgo).order("created_at"),
    ]);

    const moods = moodsRes.data || [];
    const completions = completionsRes.data || [];
    const dreams = dreamsRes.data || [];
    const generated: Insight[] = [];

    if (moods.length >= 3) {
      const recent = moods.slice(-5);
      const older = moods.slice(0, Math.max(moods.length - 5, 1));
      const recentAvg = recent.reduce((s, m) => s + m.mood, 0) / recent.length;
      const olderAvg = older.reduce((s, m) => s + m.mood, 0) / older.length;
      const diff = recentAvg - olderAvg;

      if (diff > 0.5) {
        generated.push({
          id: "mood_up", type: "breakthrough",
          icon: <TrendingUp className="w-4 h-4" />,
          title: "Настроение растёт",
          body: `Твоё самочувствие улучшилось на ${Math.abs(diff).toFixed(1)} пунктов. Отличный тренд — продолжай в том же духе!`,
          color: "text-accent",
        });
      } else if (diff < -0.5) {
        generated.push({
          id: "mood_down", type: "warning",
          icon: <TrendingDown className="w-4 h-4" />,
          title: "Самочувствие снижается",
          body: `Настроение упало на ${Math.abs(diff).toFixed(1)} пунктов. Возможно, стоит обратить внимание на отдых и сон.`,
          color: "text-streak",
        });
      }
    }

    if (moods.length >= 3) {
      const lowEnergyMoods = moods.filter(m => m.energy_level <= 2);
      const highEnergyMoods = moods.filter(m => m.energy_level >= 4);
      if (lowEnergyMoods.length > 0 && highEnergyMoods.length > 0) {
        const lowMoodAvg = lowEnergyMoods.reduce((s, m) => s + m.mood, 0) / lowEnergyMoods.length;
        const highMoodAvg = highEnergyMoods.reduce((s, m) => s + m.mood, 0) / highEnergyMoods.length;
        if (highMoodAvg - lowMoodAvg > 1) {
          generated.push({
            id: "energy_mood", type: "correlation",
            icon: <Lightbulb className="w-4 h-4" />,
            title: "Связь найдена",
            body: `Когда энергия высокая (≥4), настроение в среднем ${highMoodAvg.toFixed(1)}, при низкой (≤2) — ${lowMoodAvg.toFixed(1)}. Энергия напрямую влияет на самочувствие.`,
            color: "text-energy",
          });
        }
      }
    }

    if (completions.length > 0 && moods.length > 0) {
      const moodsByDate: Record<string, number[]> = {};
      moods.forEach(m => {
        const d = m.created_at.split("T")[0];
        if (!moodsByDate[d]) moodsByDate[d] = [];
        moodsByDate[d].push(m.mood);
      });
      const compDates = new Set(completions.map(c => c.completed_at.split("T")[0]));
      
      const activeDayMoods: number[] = [];
      const inactiveDayMoods: number[] = [];
      Object.entries(moodsByDate).forEach(([date, dayMoods]) => {
        const avg = dayMoods.reduce((a, b) => a + b, 0) / dayMoods.length;
        if (compDates.has(date)) activeDayMoods.push(avg);
        else inactiveDayMoods.push(avg);
      });

      if (activeDayMoods.length > 0 && inactiveDayMoods.length > 0) {
        const activeAvg = activeDayMoods.reduce((a, b) => a + b, 0) / activeDayMoods.length;
        const inactiveAvg = inactiveDayMoods.reduce((a, b) => a + b, 0) / inactiveDayMoods.length;
        if (activeAvg - inactiveAvg > 0.3) {
          generated.push({
            id: "active_mood", type: "pattern",
            icon: <Sparkles className="w-4 h-4" />,
            title: "Привычки работают",
            body: `В дни с выполненными привычками настроение: ${activeAvg.toFixed(1)} vs ${inactiveAvg.toFixed(1)} в дни отдыха. Действие = хорошее самочувствие.`,
            color: "text-primary",
          });
        }
      }
    }

    if (dreams.length >= 3) {
      const avgLucidity = dreams.reduce((s, d) => s + d.lucidity, 0) / dreams.length;
      if (avgLucidity >= 3) {
        generated.push({
          id: "lucidity", type: "breakthrough",
          icon: <Lightbulb className="w-4 h-4" />,
          title: "Качество снов растёт",
          body: `Средняя осознанность снов: ${avgLucidity.toFixed(1)}/5. Высокая осознанность = более глубокий отдых.`,
          color: "text-dream",
        });
      }
    }

    if (completions.length === 0 && moods.length === 0) {
      generated.push({
        id: "inactive", type: "warning",
        icon: <AlertTriangle className="w-4 h-4" />,
        title: "Нет данных",
        body: "За последние 14 дней нет записей. Начни отмечать настроение и выполнять привычки — так ты увидишь свои паттерны.",
        color: "text-destructive",
      });
    }

    if (generated.length === 0 && (moods.length > 0 || completions.length > 0)) {
      generated.push({
        id: "collecting", type: "pattern",
        icon: <Sparkles className="w-4 h-4" />,
        title: "Собираем данные",
        body: `Уже есть: ${moods.length} записей настроения, ${completions.length} выполненных привычек, ${dreams.length} снов. Скоро появятся первые инсайты!`,
        color: "text-muted-foreground",
      });
    }

    setInsights(generated);
    setLoading(false);
  };

  if (loading || insights.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-2xl border border-primary/15 overflow-hidden"
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-primary/5 transition-colors"
      >
        <div className="flex items-center gap-2">
          <motion.div
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          >
            <Lightbulb className="w-4 h-4 text-primary" />
          </motion.div>
          <span className="text-sm font-semibold text-foreground">Инсайты и паттерны</span>
          <span className="text-[9px] font-mono text-primary bg-primary/10 px-1.5 py-0.5 rounded">
            {insights.length}
          </span>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="px-4 pb-4 space-y-2"
          >
            {insights.map((insight, i) => (
              <motion.div
                key={insight.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex items-start gap-3 p-3 rounded-xl bg-muted/20 border border-border/20"
              >
                <div className={`w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center shrink-0 ${insight.color}`}>
                  {insight.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-semibold ${insight.color} mb-0.5`}>{insight.title}</p>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">{insight.body}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default InsightsPanel;

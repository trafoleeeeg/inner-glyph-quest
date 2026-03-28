import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar } from "recharts";
import { ChevronDown, ChevronUp, Info } from "lucide-react";

const LIFE_AREAS = [
  { key: "body", label: "Тело", emoji: "🧘", tip: "Физические привычки и здоровье" },
  { key: "mind", label: "Разум", emoji: "🧠", tip: "Выполненные задачи и привычки" },
  { key: "emotions", label: "Эмоции", emoji: "❤️", tip: "Записи настроения" },
  { key: "social", label: "Общение", emoji: "👥", tip: "Посты и взаимодействия" },
  { key: "growth", label: "Рост", emoji: "🌱", tip: "Цели и их достижение" },
  { key: "dreams", label: "Сны", emoji: "🌙", tip: "Записанные сновидения" },
];

const LifeOverview = () => {
  const { user } = useAuth();
  const [data, setData] = useState<{ area: string; value: number; count: number; maxForClear: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
      const [moods, completions, dreams, desires, posts, healthMissions] = await Promise.all([
        supabase.from("mood_entries").select("mood, energy_level").eq("user_id", user.id).gte("created_at", twoWeeksAgo),
        supabase.from("mission_completions").select("*", { count: "exact", head: true }).eq("user_id", user.id).gte("completed_at", twoWeeksAgo),
        supabase.from("dream_entries").select("*", { count: "exact", head: true }).eq("user_id", user.id).gte("created_at", twoWeeksAgo),
        supabase.from("desires").select("*", { count: "exact", head: true }).eq("user_id", user.id).eq("is_fulfilled", false),
        supabase.from("posts").select("*", { count: "exact", head: true }).eq("user_id", user.id).gte("created_at", twoWeeksAgo),
        supabase.from("missions").select("category").eq("user_id", user.id).eq("category", "health"),
      ]);

      const moodData = moods.data || [];
      const avgMood = moodData.length > 0 ? moodData.reduce((s, m) => s + m.mood, 0) / moodData.length : 0;
      const avgEnergy = moodData.length > 0 ? moodData.reduce((s, m) => s + m.energy_level, 0) / moodData.length : 0;

      const raw = [
        { score: Math.min(((healthMissions.data?.length || 0) * 15 + avgEnergy * 10), 100), count: healthMissions.data?.length || 0, maxForClear: 14 },
        { score: Math.min(((completions.count || 0) * 5), 100), count: completions.count || 0, maxForClear: 20 },
        { score: Math.min((avgMood * 20 + moodData.length * 3), 100), count: moodData.length, maxForClear: 14 },
        { score: Math.min(((posts.count || 0) * 10), 100), count: posts.count || 0, maxForClear: 10 },
        { score: Math.min(((desires.count || 0) * 15 + (completions.count || 0) * 3), 100), count: desires.count || 0, maxForClear: 5 },
        { score: Math.min(((dreams.count || 0) * 14), 100), count: dreams.count || 0, maxForClear: 7 },
      ];

      setData(LIFE_AREAS.map((a, i) => ({
        area: a.label,
        value: Math.round(raw[i].score),
        count: raw[i].count,
        maxForClear: raw[i].maxForClear,
      })));
      setLoading(false);
    };
    fetchData();
  }, [user]);

  const overallBalance = data.length > 0
    ? Math.round(data.reduce((s, d) => s + d.value, 0) / data.length)
    : 0;

  const totalClarity = useMemo(() => {
    if (data.length === 0) return 0;
    const sum = data.reduce((acc, d) => acc + Math.min(d.count / d.maxForClear, 1), 0);
    return Math.round((sum / data.length) * 100);
  }, [data]);

  const sorted = [...data].sort((a, b) => a.value - b.value);
  const weakest = sorted[0];

  if (loading) {
    return (
      <div className="glass-card rounded-2xl p-6 border border-border/30">
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-2xl p-5 border border-border/30 space-y-4">
      {/* Header with explanation */}
      <div>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <span>🔭</span> Обзор жизни
          </h3>
          <div className="flex items-center gap-3 text-right">
            <div>
              <p className="text-lg font-bold font-mono text-primary">{overallBalance}%</p>
              <p className="text-[8px] text-muted-foreground font-mono">баланс</p>
            </div>
            <div>
              <p className="text-lg font-bold font-mono text-accent">{totalClarity}%</p>
              <p className="text-[8px] text-muted-foreground font-mono">ясность</p>
            </div>
          </div>
        </div>
        <p className="text-[10px] text-muted-foreground mt-1 leading-relaxed">
          Показывает 6 сфер твоей жизни за 2 недели. <strong className="text-foreground/70">Баланс</strong> — насколько каждая сфера развита. <strong className="text-foreground/70">Ясность</strong> — как часто ты их отслеживаешь. Чем чаще записываешь — тем яснее картина.
        </p>
      </div>

      {/* Radar Chart */}
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data} cx="50%" cy="50%" outerRadius="72%">
            <PolarGrid stroke="hsl(var(--border))" strokeOpacity={0.5} />
            <PolarAngleAxis
              dataKey="area"
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10, fontFamily: "var(--font-mono)" }}
            />
            <Radar
              name="Баланс"
              dataKey="value"
              stroke="hsl(var(--primary))"
              fill="hsl(var(--primary))"
              fillOpacity={0.12}
              strokeWidth={2}
              dot={{ r: 3, fill: "hsl(var(--primary))", strokeWidth: 0 }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Area cards with clarity bars */}
      <div className="grid grid-cols-3 gap-2">
        {data.map((d, i) => {
          const area = LIFE_AREAS[i];
          const clarity = Math.min(d.count / d.maxForClear, 1);
          const isWeak = d.value === weakest?.value && d.value < 50;
          return (
            <motion.div
              key={d.area}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`p-2.5 rounded-xl text-center border transition-colors ${
                isWeak ? "border-destructive/20 bg-destructive/5" : "border-border/20 bg-muted/10"
              }`}
            >
              <span className="text-base">{area.emoji}</span>
              <p className={`text-sm font-bold font-mono mt-0.5 ${isWeak ? "text-destructive" : "text-foreground"}`}>
                {d.value}%
              </p>
              <p className="text-[8px] text-muted-foreground font-mono uppercase">{d.area}</p>
              {/* Clarity mini-bar */}
              <div className="h-1 bg-muted/30 rounded-full mt-1 overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-accent/60"
                  initial={{ width: 0 }}
                  animate={{ width: `${clarity * 100}%` }}
                  transition={{ duration: 0.8, delay: 0.3 + i * 0.05 }}
                />
              </div>
              <p className="text-[7px] text-muted-foreground/50 font-mono mt-0.5">
                {d.count}/{d.maxForClear}
              </p>
            </motion.div>
          );
        })}
      </div>

      {/* Toggle details */}
      <button
        onClick={() => setShowDetails(!showDetails)}
        className="flex items-center gap-1 mx-auto text-[10px] text-muted-foreground hover:text-foreground transition-colors font-mono"
      >
        {showDetails ? "Скрыть подробности" : "Что это значит?"}
        {showDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </button>

      {showDetails && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="p-3 rounded-xl bg-muted/20 border border-border/20 space-y-2"
        >
          <div className="flex items-start gap-2">
            <Info className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />
            <div className="text-[10px] text-muted-foreground leading-relaxed space-y-1.5">
              <p>
                <strong className="text-foreground">Диаграмма</strong> — радар показывает силу каждой сферы. Чем больше область, тем лучше баланс.
              </p>
              <p>
                <strong className="text-foreground">Числа</strong> — процент развития сферы (баланс) и количество записей (ясность).
              </p>
              <p>
                <strong className="text-foreground">Зелёная полоска</strong> под каждой сферой — как часто ты её отслеживаешь. Чем полнее, тем лучше ты понимаешь эту часть жизни.
              </p>
              <p>
                <strong className="text-foreground">Красная рамка</strong> — сфера, которая просела больше всего. Уделите ей внимание.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Weak area warning */}
      {weakest && weakest.value < 30 && (
        <div className="p-3 rounded-xl bg-destructive/5 border border-destructive/10">
          <p className="text-[10px] text-destructive/80 font-mono">
            ⚠ Сфера «{weakest.area}» просела — {weakest.value}%. Попробуй уделить ей внимание.
          </p>
        </div>
      )}
    </div>
  );
};

export default LifeOverview;

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar } from "recharts";

const LIFE_AREAS = [
  { key: "body", label: "Тело", emoji: "🧘" },
  { key: "mind", label: "Разум", emoji: "🧠" },
  { key: "emotions", label: "Эмоции", emoji: "❤️" },
  { key: "social", label: "Связи", emoji: "👥" },
  { key: "growth", label: "Рост", emoji: "🌱" },
  { key: "dreams", label: "Сны", emoji: "🌙" },
];

const LifeBalanceChart = () => {
  const { user } = useAuth();
  const [data, setData] = useState<{ area: string; value: number; fullMark: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchBalance = async () => {
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

      // Normalize to 0-100 scale
      const bodyScore = Math.min(((healthMissions.data?.length || 0) * 15 + avgEnergy * 10), 100);
      const mindScore = Math.min(((completions.count || 0) * 5), 100);
      const emotionsScore = Math.min((avgMood * 20 + moodData.length * 3), 100);
      const socialScore = Math.min(((posts.count || 0) * 10), 100);
      const growthScore = Math.min(((desires.count || 0) * 15 + (completions.count || 0) * 3), 100);
      const dreamsScore = Math.min(((dreams.count || 0) * 14), 100);

      setData([
        { area: "Тело", value: Math.round(bodyScore), fullMark: 100 },
        { area: "Разум", value: Math.round(mindScore), fullMark: 100 },
        { area: "Эмоции", value: Math.round(emotionsScore), fullMark: 100 },
        { area: "Связи", value: Math.round(socialScore), fullMark: 100 },
        { area: "Рост", value: Math.round(growthScore), fullMark: 100 },
        { area: "Сны", value: Math.round(dreamsScore), fullMark: 100 },
      ]);
      setLoading(false);
    };
    fetchBalance();
  }, [user]);

  const overallBalance = data.length > 0
    ? Math.round(data.reduce((s, d) => s + d.value, 0) / data.length)
    : 0;

  // Find weakest and strongest areas
  const sorted = [...data].sort((a, b) => a.value - b.value);
  const weakest = sorted[0];
  const strongest = sorted[sorted.length - 1];

  if (loading) {
    return (
      <div className="glass-card rounded-2xl p-6 border border-accent/10">
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-accent/30 border-t-accent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-2xl p-5 border border-accent/10">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <span>⚖️</span> Баланс сфер жизни
          </h3>
          <p className="text-[10px] text-muted-foreground font-mono mt-0.5">
            за последние 2 недели
          </p>
        </div>
        <div className="text-right">
          <p className="text-xl font-bold font-mono text-accent">{overallBalance}%</p>
          <p className="text-[9px] text-muted-foreground font-mono">баланс</p>
        </div>
      </div>

      {/* Radar Chart */}
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data} cx="50%" cy="50%" outerRadius="75%">
            <PolarGrid
              stroke="hsl(220, 15%, 18%)"
              strokeOpacity={0.6}
            />
            <PolarAngleAxis
              dataKey="area"
              tick={{ fill: "hsl(220, 10%, 55%)", fontSize: 10, fontFamily: "var(--font-mono)" }}
            />
            <Radar
              name="Баланс"
              dataKey="value"
              stroke="hsl(140, 70%, 50%)"
              fill="hsl(140, 70%, 50%)"
              fillOpacity={0.15}
              strokeWidth={2}
              dot={{ r: 4, fill: "hsl(140, 70%, 50%)", strokeWidth: 0 }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Area breakdown */}
      <div className="grid grid-cols-3 gap-2 mt-3">
        {data.map((d, i) => {
          const area = LIFE_AREAS[i];
          const isWeak = d.value === weakest?.value && d.value < 50;
          const isStrong = d.value === strongest?.value && d.value > 30;
          return (
            <motion.div
              key={d.area}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`p-2.5 rounded-xl text-center border transition-colors ${
                isWeak ? "border-destructive/20 bg-destructive/5" : isStrong ? "border-accent/20 bg-accent/5" : "border-border/20 bg-muted/10"
              }`}
            >
              <span className="text-base">{area.emoji}</span>
              <p className={`text-sm font-bold font-mono mt-0.5 ${
                isWeak ? "text-destructive" : isStrong ? "text-accent" : "text-foreground"
              }`}>
                {d.value}%
              </p>
              <p className="text-[8px] text-muted-foreground font-mono uppercase">{d.area}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Insight */}
      {weakest && weakest.value < 30 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-3 p-3 rounded-xl bg-destructive/5 border border-destructive/10"
        >
          <p className="text-[10px] text-destructive/80 font-mono">
            ⚠ Зона «{weakest.area}» просела — {weakest.value}%. Уделите ей внимание для восстановления баланса.
          </p>
        </motion.div>
      )}

      {overallBalance >= 60 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-3 p-3 rounded-xl bg-accent/5 border border-accent/10"
        >
          <p className="text-[10px] text-accent/80 font-mono">
            ✓ Хороший баланс! Продолжай поддерживать все сферы для максимальной ясности.
          </p>
        </motion.div>
      )}
    </div>
  );
};

export default LifeBalanceChart;

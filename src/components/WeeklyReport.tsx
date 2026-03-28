import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { BarChart3, TrendingUp, TrendingDown, Trophy, X, Sparkles } from "lucide-react";

interface WeeklyReportProps {
  open: boolean;
  onClose: () => void;
}

interface WeekStats {
  missionsCompleted: number;
  moodAvg: number;
  dreamsLogged: number;
  streakMax: number;
  xpEarned: number;
  prevMissions: number;
  prevMoodAvg: number;
}

const WeeklyReport = ({ open, onClose }: WeeklyReportProps) => {
  const { user } = useAuth();
  const [stats, setStats] = useState<WeekStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open || !user) return;
    const fetchStats = async () => {
      setLoading(true);
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString();

      const [completions, prevCompletions, moods, prevMoods, dreams, rewards] = await Promise.all([
        supabase.from("mission_completions").select("*", { count: "exact", head: true }).eq("user_id", user.id).gte("completed_at", weekAgo),
        supabase.from("mission_completions").select("*", { count: "exact", head: true }).eq("user_id", user.id).gte("completed_at", twoWeeksAgo).lt("completed_at", weekAgo),
        supabase.from("mood_entries").select("mood").eq("user_id", user.id).gte("created_at", weekAgo),
        supabase.from("mood_entries").select("mood").eq("user_id", user.id).gte("created_at", twoWeeksAgo).lt("created_at", weekAgo),
        supabase.from("dream_entries").select("*", { count: "exact", head: true }).eq("user_id", user.id).gte("created_at", weekAgo),
        supabase.from("rewards_log").select("xp_amount").eq("user_id", user.id).gte("created_at", weekAgo),
      ]);

      const moodData = moods.data || [];
      const prevMoodData = prevMoods.data || [];
      const xpTotal = (rewards.data || []).reduce((s, r) => s + r.xp_amount, 0);

      setStats({
        missionsCompleted: completions.count || 0,
        moodAvg: moodData.length > 0 ? moodData.reduce((s, m) => s + m.mood, 0) / moodData.length : 0,
        dreamsLogged: dreams.count || 0,
        streakMax: 0,
        xpEarned: xpTotal,
        prevMissions: prevCompletions.count || 0,
        prevMoodAvg: prevMoodData.length > 0 ? prevMoodData.reduce((s, m) => s + m.mood, 0) / prevMoodData.length : 0,
      });
      setLoading(false);
    };
    fetchStats();
  }, [open, user]);

  const getDelta = (curr: number, prev: number) => {
    if (prev === 0) return curr > 0 ? 100 : 0;
    return Math.round(((curr - prev) / prev) * 100);
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-lg"
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="w-full max-w-sm mx-4 glass-card rounded-2xl p-6 border border-primary/10 space-y-5"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              <h3 className="text-base font-bold text-foreground">Итоги недели</h3>
            </div>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                <Sparkles className="w-6 h-6 text-primary mx-auto" />
              </motion.div>
              <p className="text-xs text-muted-foreground mt-2">Анализирую данные...</p>
            </div>
          ) : stats ? (
            <div className="space-y-3">
              {/* Stats cards */}
              {[
                {
                  label: "Привычки выполнены",
                  value: stats.missionsCompleted,
                  delta: getDelta(stats.missionsCompleted, stats.prevMissions),
                  icon: "⚡",
                },
                {
                  label: "Среднее настроение",
                  value: stats.moodAvg.toFixed(1),
                  delta: getDelta(stats.moodAvg, stats.prevMoodAvg),
                  icon: "😊",
                },
                {
                  label: "Снов записано",
                  value: stats.dreamsLogged,
                  delta: 0,
                  icon: "🌙",
                },
                {
                  label: "Опыт заработан",
                  value: stats.xpEarned,
                  delta: 0,
                  icon: "✨",
                },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-center gap-3 p-3 rounded-xl bg-muted/10"
                >
                  <span className="text-xl">{stat.icon}</span>
                  <div className="flex-1">
                    <p className="text-[10px] text-muted-foreground">{stat.label}</p>
                    <p className="text-sm font-bold text-foreground font-mono">{stat.value}</p>
                  </div>
                  {stat.delta !== 0 && (
                    <div className={`flex items-center gap-0.5 text-xs font-mono ${stat.delta > 0 ? "text-green-500" : "text-destructive"}`}>
                      {stat.delta > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {stat.delta > 0 ? "+" : ""}
                      {stat.delta}%
                    </div>
                  )}
                </motion.div>
              ))}

              {/* Best achievement */}
              {stats.missionsCompleted > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="p-3 rounded-xl bg-primary/5 border border-primary/10 text-center"
                >
                  <Trophy className="w-5 h-5 text-primary mx-auto mb-1" />
                  <p className="text-xs font-semibold text-foreground">
                    {stats.missionsCompleted >= 20
                      ? "Невероятная неделя! 🏆"
                      : stats.missionsCompleted >= 10
                        ? "Отличный прогресс!"
                        : "Хорошее начало!"}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {stats.missionsCompleted} привычек за неделю
                  </p>
                </motion.div>
              )}
            </div>
          ) : null}

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={onClose}
            className="w-full py-3 rounded-xl bg-primary/15 text-primary text-sm font-semibold hover:bg-primary/25 transition-colors"
          >
            Продолжить
          </motion.button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default WeeklyReport;

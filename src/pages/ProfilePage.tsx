import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import ParticleField from "@/components/ParticleField";
import { ArrowLeft, Trophy, Target, Moon, Brain, Flame, TrendingUp, Calendar } from "lucide-react";

interface MoodStat {
  avgMood: number;
  avgEnergy: number;
  count: number;
}

const ProfilePage = () => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const navigate = useNavigate();
  const [moodStats, setMoodStats] = useState<MoodStat>({ avgMood: 0, avgEnergy: 0, count: 0 });
  const [recentRewards, setRecentRewards] = useState<any[]>([]);
  const [weeklyCompletions, setWeeklyCompletions] = useState(0);

  useEffect(() => {
    if (!user) return;
    const fetchStats = async () => {
      // Mood stats (last 7 days)
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { data: moods } = await supabase
        .from("mood_entries")
        .select("mood, energy_level")
        .eq("user_id", user.id)
        .gte("created_at", weekAgo);
      
      if (moods && moods.length > 0) {
        setMoodStats({
          avgMood: +(moods.reduce((s, m) => s + m.mood, 0) / moods.length).toFixed(1),
          avgEnergy: +(moods.reduce((s, m) => s + m.energy_level, 0) / moods.length).toFixed(1),
          count: moods.length,
        });
      }

      // Weekly completions
      const { count } = await supabase
        .from("mission_completions")
        .select("*", { count: 'exact', head: true })
        .eq("user_id", user.id)
        .gte("completed_at", weekAgo);
      setWeeklyCompletions(count || 0);

      // Recent rewards
      const { data: rewards } = await supabase
        .from("rewards_log")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5);
      setRecentRewards(rewards || []);
    };
    fetchStats();
  }, [user]);

  if (!profile) return null;

  const moodEmoji = ['', '😫', '😕', '😐', '😊', '🔥'];
  const LEVEL_TITLES: Record<number, string> = {
    1: "Новичок", 2: "Пробуждённый", 3: "Исследователь", 4: "Адепт",
    5: "Мастер", 6: "Мудрец", 7: "Архитектор", 8: "Провидец",
    9: "Нейромант", 10: "Трансцендент",
  };

  const statCards = [
    { icon: Target, label: "Всего миссий", value: profile.total_missions_completed, color: "text-primary" },
    { icon: Moon, label: "Снов записано", value: profile.total_dreams_logged, color: "text-dream" },
    { icon: Flame, label: "Текущий стрик", value: `${profile.streak}д`, color: "text-streak" },
    { icon: Trophy, label: "Лучший стрик", value: `${profile.longest_streak}д`, color: "text-energy" },
    { icon: Calendar, label: "Миссий за неделю", value: weeklyCompletions, color: "text-accent" },
    { icon: Brain, label: "Чекинов за неделю", value: moodStats.count, color: "text-secondary" },
  ];

  return (
    <div className="min-h-screen bg-background cyber-grid relative">
      <ParticleField />
      <div className="relative z-10 max-w-2xl mx-auto px-4 py-6 space-y-5">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate("/")}
            className="w-9 h-9 rounded-xl bg-muted/50 border border-border/50 flex items-center justify-center text-muted-foreground hover:text-foreground transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
          </motion.button>
          <h1 className="text-lg font-bold text-foreground">Личный кабинет</h1>
        </motion.div>

        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card rounded-2xl p-6 gradient-border text-center"
        >
          {/* Avatar */}
          <motion.div
            className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/30 to-secondary/30 border border-primary/20 flex items-center justify-center mx-auto mb-3 glow-primary"
            animate={{
              boxShadow: [
                '0 0 20px hsl(180 100% 50% / 0.2)',
                '0 0 40px hsl(180 100% 50% / 0.3)',
                '0 0 20px hsl(180 100% 50% / 0.2)',
              ],
            }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <span className="text-3xl">🧠</span>
          </motion.div>
          <h2 className="text-xl font-bold text-foreground">{profile.display_name}</h2>
          <p className="text-xs font-mono text-primary mt-0.5">{LEVEL_TITLES[profile.level] || LEVEL_TITLES[10]}</p>
          <p className="text-[10px] font-mono text-muted-foreground mt-1">
            Уровень {profile.level} • {profile.xp}/{profile.xp_to_next} XP • {profile.coins} коинов
          </p>

          {/* Energy bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-[10px] font-mono mb-1">
              <span className="text-energy">⚡ Энергия</span>
              <span className="text-muted-foreground">{profile.energy}/{profile.max_energy}</span>
            </div>
            <div className="h-2 bg-muted/50 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${(profile.energy / profile.max_energy) * 100}%` }}
                transition={{ duration: 1 }}
                style={{
                  background: 'linear-gradient(90deg, hsl(45 100% 55%), hsl(25 95% 55%))',
                  boxShadow: '0 0 10px hsl(45 100% 55% / 0.5)',
                }}
              />
            </div>
          </div>
        </motion.div>

        {/* Mood summary */}
        {moodStats.count > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="glass-card rounded-2xl p-5 border border-energy/10"
          >
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-energy" />
              Аналитика за неделю
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center p-3 rounded-xl bg-energy/5 border border-energy/10">
                <span className="text-2xl">{moodEmoji[Math.round(moodStats.avgMood)] || '😐'}</span>
                <p className="text-lg font-bold font-mono text-energy mt-1">{moodStats.avgMood}</p>
                <p className="text-[9px] text-muted-foreground font-mono uppercase">Ср. настроение</p>
              </div>
              <div className="text-center p-3 rounded-xl bg-primary/5 border border-primary/10">
                <span className="text-2xl">⚡</span>
                <p className="text-lg font-bold font-mono text-primary mt-1">{moodStats.avgEnergy}</p>
                <p className="text-[9px] text-muted-foreground font-mono uppercase">Ср. энергия</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <span>📊</span> Статистика
          </h3>
          <div className="grid grid-cols-3 gap-2">
            {statCards.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.05 }}
                className="glass-card rounded-xl p-3 text-center border border-border/30"
                whileHover={{ y: -2 }}
              >
                <stat.icon className={`w-4 h-4 ${stat.color} mx-auto mb-1`} />
                <p className={`text-lg font-bold font-mono ${stat.color}`}>{stat.value}</p>
                <p className="text-[8px] text-muted-foreground font-mono uppercase tracking-wider leading-tight mt-0.5">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Recent Rewards */}
        {recentRewards.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-card rounded-2xl p-5 border border-secondary/10"
          >
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <span>🎁</span> Последние награды
            </h3>
            <div className="space-y-2">
              {recentRewards.map((r) => (
                <div key={r.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/20">
                  <span className="text-lg">
                    {r.reward_type === 'critical_hit' ? '⚡' : r.reward_type === 'mystery_box' ? '📦' : '🎖️'}
                  </span>
                  <div className="flex-1">
                    <p className="text-xs text-foreground">{r.description}</p>
                    <p className="text-[10px] text-muted-foreground font-mono">
                      {new Date(r.created_at).toLocaleDateString('ru-RU')}
                    </p>
                  </div>
                  <span className="text-xs font-mono text-accent">+{r.xp_amount} XP</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Motivation info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="glass-card rounded-2xl p-5 border border-primary/5"
        >
          <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
            <span>🧬</span> Система мотивации
          </h3>
          <div className="space-y-2 text-xs text-muted-foreground">
            <p>• <span className="text-primary">Переменные награды</span> — 15% шанс крита (x2 XP), 10% шанс Mystery Box</p>
            <p>• <span className="text-streak">Стрик бонусы</span> — множитель XP растёт с каждым днём активности</p>
            <p>• <span className="text-energy">Энергия</span> — восстанавливается при выполнении миссий</p>
            <p>• <span className="text-accent">Нейрокоины</span> — зарабатываются за каждое действие</p>
            <p>• <span className="text-secondary">Ачивки</span> — долгосрочные цели для постоянного прогресса</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ProfilePage;

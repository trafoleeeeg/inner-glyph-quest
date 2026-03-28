import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import ParticleField from "@/components/ParticleField";
import AnalyticsCharts from "@/components/AnalyticsCharts";
import { ArrowLeft, Trophy, Target, Moon, Brain, Flame, TrendingUp, Calendar, Coins, Settings } from "lucide-react";

const LEVEL_TITLES: Record<number, string> = {
  1: "Спящий агент", 2: "Пробуждённый", 3: "Дешифратор", 4: "Компрессор",
  5: "Мета-Дипломат", 6: "Архитектор", 7: "Провидец", 8: "Нейромант", 9: "Трансцендент", 10: "Демиург",
};

const ProfilePage = () => {
  const { user } = useAuth();
  const { profile, updateProfile } = useProfile();
  const navigate = useNavigate();
  const [moodStats, setMoodStats] = useState({ avgMood: 0, avgEnergy: 0, count: 0 });
  const [recentRewards, setRecentRewards] = useState<any[]>([]);
  const [weeklyCompletions, setWeeklyCompletions] = useState(0);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");

  useEffect(() => {
    if (!user) return;
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    Promise.all([
      supabase.from("mood_entries").select("mood, energy_level").eq("user_id", user.id).gte("created_at", weekAgo),
      supabase.from("mission_completions").select("*", { count: 'exact', head: true }).eq("user_id", user.id).gte("completed_at", weekAgo),
      supabase.from("rewards_log").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(5),
    ]).then(([moods, completions, rewards]) => {
      if (moods.data?.length) {
        setMoodStats({
          avgMood: +(moods.data.reduce((s, m) => s + m.mood, 0) / moods.data.length).toFixed(1),
          avgEnergy: +(moods.data.reduce((s, m) => s + m.energy_level, 0) / moods.data.length).toFixed(1),
          count: moods.data.length,
        });
      }
      setWeeklyCompletions(completions.count || 0);
      setRecentRewards(rewards.data || []);
    });
  }, [user]);

  const handleNameSave = async () => {
    if (nameInput.trim() && nameInput.trim().length <= 30) {
      await updateProfile({ display_name: nameInput.trim() } as any);
      setEditingName(false);
    }
  };

  if (!profile) return null;
  const moodEmoji = ['', '😫', '😕', '😐', '😊', '🔥'];

  const statCards = [
    { icon: Target, label: "Протоколов", value: profile.total_missions_completed, color: "text-primary" },
    { icon: Moon, label: "Синхронизаций", value: profile.total_dreams_logged, color: "text-dream" },
    { icon: Flame, label: "Поток", value: `${profile.streak}д`, color: "text-streak" },
    { icon: Trophy, label: "Макс. поток", value: `${profile.longest_streak}д`, color: "text-energy" },
    { icon: Calendar, label: "За неделю", value: weeklyCompletions, color: "text-accent" },
    { icon: Coins, label: "Коины", value: profile.coins, color: "text-energy" },
  ];

  return (
    <div className="min-h-screen bg-background cyber-grid relative">
      <ParticleField />
      <div className="relative z-10 max-w-2xl mx-auto px-4 py-6 space-y-5">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => navigate("/")}
            className="w-9 h-9 rounded-xl bg-muted/50 border border-border/50 flex items-center justify-center text-muted-foreground hover:text-foreground transition-all">
            <ArrowLeft className="w-4 h-4" />
          </motion.button>
          <h1 className="text-lg font-bold text-foreground">Матрица агента</h1>
        </motion.div>

        {/* Profile Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="glass-card rounded-2xl p-6 gradient-border text-center">
          <motion.div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/30 to-secondary/30 border border-primary/20 flex items-center justify-center mx-auto mb-3"
            animate={{ boxShadow: ['0 0 20px hsl(180 100% 50% / 0.2)', '0 0 40px hsl(180 100% 50% / 0.3)', '0 0 20px hsl(180 100% 50% / 0.2)'] }}
            transition={{ duration: 3, repeat: Infinity }}>
            <span className="text-3xl">🧠</span>
          </motion.div>
          
          {editingName ? (
            <div className="flex items-center gap-2 justify-center mb-1">
              <input value={nameInput} onChange={e => setNameInput(e.target.value)} maxLength={30}
                className="bg-muted/30 border border-primary/30 rounded-lg px-3 py-1 text-center text-sm text-foreground focus:outline-none" autoFocus />
              <button onClick={handleNameSave} className="text-xs text-primary hover:underline">✓</button>
              <button onClick={() => setEditingName(false)} className="text-xs text-muted-foreground hover:underline">✗</button>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2 mb-1">
              <h2 className="text-xl font-bold text-foreground">{profile.display_name}</h2>
              <button onClick={() => { setNameInput(profile.display_name); setEditingName(true); }} className="text-muted-foreground/50 hover:text-primary transition-colors">
                <Settings className="w-3 h-3" />
              </button>
            </div>
          )}
          <p className="text-xs font-mono text-primary">{LEVEL_TITLES[profile.level] || LEVEL_TITLES[10]}</p>
          <p className="text-[10px] font-mono text-muted-foreground mt-1">
            Калибровка {profile.level} • {profile.xp}/{profile.xp_to_next} негэнтропии
          </p>

          <div className="mt-4">
            <div className="flex items-center justify-between text-[10px] font-mono mb-1">
              <span className="text-energy">⚡ Ресурс Интерпретатора</span>
              <span className="text-muted-foreground">{profile.energy}/{profile.max_energy}</span>
            </div>
            <div className="h-2 bg-muted/50 rounded-full overflow-hidden">
              <motion.div className="h-full rounded-full" initial={{ width: 0 }}
                animate={{ width: `${(profile.energy / profile.max_energy) * 100}%` }}
                transition={{ duration: 1 }}
                style={{ background: 'linear-gradient(90deg, hsl(45 100% 55%), hsl(25 95% 55%))', boxShadow: '0 0 10px hsl(45 100% 55% / 0.5)' }} />
            </div>
          </div>
        </motion.div>

        {/* Mood summary */}
        {moodStats.count > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="glass-card rounded-2xl p-5 border border-energy/10">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-energy" /> Телеметрия за неделю
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center p-3 rounded-xl bg-energy/5 border border-energy/10">
                <span className="text-2xl">{moodEmoji[Math.round(moodStats.avgMood)] || '😐'}</span>
                <p className="text-lg font-bold font-mono text-energy mt-1">{moodStats.avgMood}</p>
                <p className="text-[9px] text-muted-foreground font-mono uppercase">Ср. сигнал</p>
              </div>
              <div className="text-center p-3 rounded-xl bg-primary/5 border border-primary/10">
                <span className="text-2xl">⚡</span>
                <p className="text-lg font-bold font-mono text-primary mt-1">{moodStats.avgEnergy}</p>
                <p className="text-[9px] text-muted-foreground font-mono uppercase">Ср. ресурс</p>
              </div>
            </div>
          </motion.div>
        )}

        <AnalyticsCharts />

        {/* Stats Grid */}
        <div>
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><span>📊</span> Метрики сжатия</h3>
          <div className="grid grid-cols-3 gap-2">
            {statCards.map((stat, i) => (
              <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.05 }}
                className="glass-card rounded-xl p-3 text-center border border-border/30" whileHover={{ y: -2 }}>
                <stat.icon className={`w-4 h-4 ${stat.color} mx-auto mb-1`} />
                <p className={`text-lg font-bold font-mono ${stat.color}`}>{stat.value}</p>
                <p className="text-[8px] text-muted-foreground font-mono uppercase tracking-wider leading-tight mt-0.5">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Rewards */}
        {recentRewards.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="glass-card rounded-2xl p-5 border border-secondary/10">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><span>🎁</span> Аномалии данных</h3>
            <div className="space-y-2">
              {recentRewards.map(r => (
                <div key={r.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/20">
                  <span className="text-lg">{r.reward_type === 'critical_hit' ? '⚡' : '📦'}</span>
                  <div className="flex-1">
                    <p className="text-xs text-foreground">{r.description}</p>
                    <p className="text-[10px] text-muted-foreground font-mono">{new Date(r.created_at).toLocaleDateString('ru-RU')}</p>
                  </div>
                  <span className="text-xs font-mono text-accent">+{r.xp_amount}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Philosophy */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
          className="glass-card rounded-2xl p-5 border border-primary/5">
          <h3 className="text-sm font-semibold mb-2 flex items-center gap-2"><span>🧬</span> Архитектура системы</h3>
          <div className="space-y-2 text-xs text-muted-foreground">
            <p>• <span className="text-primary">Девальвация</span> — повторение одних протоколов снижает негэнтропию. Ищи новые зоны.</p>
            <p>• <span className="text-streak">Непрерывный поток</span> — множитель растёт с каждым днём без пропусков</p>
            <p>• <span className="text-energy">Резонанс</span> — 15% шанс x2 при выполнении протокола</p>
            <p>• <span className="text-accent">Инсайты</span> — паттерны из твоих данных. Главная награда — ясность.</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ProfilePage;

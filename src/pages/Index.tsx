import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import XPBar from "@/components/XPBar";
import StatsRow from "@/components/StatsRow";
import MissionCard from "@/components/MissionCard";
import type { MissionData } from "@/components/MissionCard";
import MoodCheckin from "@/components/MoodCheckin";
import DreamJournal from "@/components/DreamJournal";
import AchievementsList from "@/components/AchievementsList";
import RewardPopup from "@/components/RewardPopup";
import ParticleField from "@/components/ParticleField";
import CreateMission from "@/components/CreateMission";
import InsightsPanel from "@/components/InsightsPanel";
import Onboarding from "@/components/Onboarding";

import LifeOverview from "@/components/LifeOverview";
import AIInsights from "@/components/AIInsights";
import DailyCheckin from "@/components/DailyCheckin";
import StreakShield from "@/components/StreakShield";
import WeeklyReport from "@/components/WeeklyReport";
import { toast } from "sonner";
import { Heart, HelpCircle, Compass } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import StreakBadges from "@/components/StreakBadges";
import PhantomCompetitor from "@/components/PhantomCompetitor";
import { useTutorial } from "@/components/TutorialOverlay";


const CHECKIN_KEY = "neuro_daily_checkin_";

const Index = () => {
  const { user } = useAuth();
  const { profile, refetch: refetchProfile } = useProfile();
  const navigate = useNavigate();
  const { startTutorial } = useTutorial();
  const [missions, setMissions] = useState<(MissionData & { completed: boolean })[]>([]);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [reward, setReward] = useState<any>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [missionCompletionCounts, setMissionCompletionCounts] = useState<Record<string, number>>({});
  const [lifeBalance, setLifeBalance] = useState(50);
  const [showWhyBlock, setShowWhyBlock] = useState(() => !localStorage.getItem("neuro_why_understood"));

  // Daily checkin state
  const [showDailyCheckin, setShowDailyCheckin] = useState(false);
  // Streak shield state
  const [showStreakShield, setShowStreakShield] = useState(false);
  // Weekly report state
  const [showWeeklyReport, setShowWeeklyReport] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem("neuro_onboarded")) setShowOnboarding(true);
  }, []);

  // Request browser notification permission
  useEffect(() => {
    if (!user || !profile) return;
    if ("Notification" in window && Notification.permission === "default") {
      // Ask after a short delay so it's not intrusive
      const timer = setTimeout(() => {
        Notification.requestPermission();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [user, profile]);

  // Schedule periodic in-app reminders via browser notifications
  useEffect(() => {
    if (!user || !profile) return;
    if (!("Notification" in window) || Notification.permission !== "granted") return;

    const checkAndNotify = () => {
      const today = new Date().toISOString().split("T")[0];
      const lastNotif = localStorage.getItem("neuro_last_notif_" + today);
      if (lastNotif) return;

      const hour = new Date().getHours();
      // Morning reminder (9-11) or evening reminder (19-21)
      if ((hour >= 9 && hour <= 11) || (hour >= 19 && hour <= 21)) {
        const checkinDone = localStorage.getItem(CHECKIN_KEY + today);
        if (!checkinDone) {
          new Notification("Время для чекина 🧠", {
            body: "Отметь настроение и энергию — это поможет найти закономерности",
            icon: "/placeholder.svg",
          });
          localStorage.setItem("neuro_last_notif_" + today, "1");
        }
      }
    };

    checkAndNotify();
    const interval = setInterval(checkAndNotify, 30 * 60 * 1000); // every 30 min
    return () => clearInterval(interval);
  }, [user, profile]);

  // Check if daily checkin needed
  useEffect(() => {
    if (!user || !profile) return;
    const today = new Date().toISOString().split("T")[0];
    const checkinDone = localStorage.getItem(CHECKIN_KEY + today);
    if (!checkinDone && !showOnboarding) {
      setShowDailyCheckin(true);
    }
    // Check if it's Sunday and no weekly report shown this week
    const dayOfWeek = new Date().getDay();
    const weekKey = `neuro_weekly_report_${today.slice(0, 7)}_w${Math.ceil(new Date().getDate() / 7)}`;
    if (dayOfWeek === 0 && !localStorage.getItem(weekKey)) {
      setTimeout(() => setShowWeeklyReport(true), 1000);
      localStorage.setItem(weekKey, "1");
    }
  }, [user, profile, showOnboarding]);

  const handleDailyCheckinComplete = () => {
    const today = new Date().toISOString().split("T")[0];
    localStorage.setItem(CHECKIN_KEY + today, "1");
    setShowDailyCheckin(false);
    refetchProfile();
  };

  const handleStreakProtect = async () => {
    if (!user || !profile) return;
    // Deduct coins via RPC
    try {
      await supabase.rpc("award_activity_xp", { p_amount: 0, p_activity: "streak_shield" });
      toast.success("Серия защищена! 🛡️", { description: "-50 монет" });
    } catch {
      toast.error("Не удалось защитить серию");
    }
    setShowStreakShield(false);
    refetchProfile();
  };

  useEffect(() => {
    if (!user) return;
    const fetchBalance = async () => {
      const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
      const [moods, completions, dreams, desires, posts] = await Promise.all([
        supabase.from("mood_entries").select("mood, energy_level").eq("user_id", user.id).gte("created_at", twoWeeksAgo),
        supabase.from("mission_completions").select("*", { count: "exact", head: true }).eq("user_id", user.id).gte("completed_at", twoWeeksAgo),
        supabase.from("dream_entries").select("*", { count: "exact", head: true }).eq("user_id", user.id).gte("created_at", twoWeeksAgo),
        supabase.from("desires").select("*", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("posts").select("*", { count: "exact", head: true }).eq("user_id", user.id).gte("created_at", twoWeeksAgo),
      ]);
      const moodData = moods.data || [];
      const avgEnergy = moodData.length > 0 ? moodData.reduce((s, m) => s + m.energy_level, 0) / moodData.length : 0;
      const avgMood = moodData.length > 0 ? moodData.reduce((s, m) => s + m.mood, 0) / moodData.length : 0;
      const scores = [
        Math.min(avgEnergy * 20, 100), Math.min((completions.count || 0) * 5, 100),
        Math.min(avgMood * 20 + moodData.length * 3, 100), Math.min((posts.count || 0) * 10, 100),
        Math.min((desires.count || 0) * 15 + (completions.count || 0) * 3, 100),
        Math.min((dreams.count || 0) * 14, 100),
      ];
      setLifeBalance(Math.round(scores.reduce((a, b) => a + b, 0) / scores.length));
    };
    fetchBalance();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const fetchMissions = async () => {
      const { data } = await supabase.from("missions").select("*").eq("user_id", user.id).eq("is_active", true);
      const missionData = data || [];
      if (missionData.length > 0) {
        const today = new Date().toISOString().split('T')[0];
        const { data: completions } = await supabase
          .from("mission_completions").select("mission_id").eq("user_id", user.id)
          .gte("completed_at", today + "T00:00:00").lte("completed_at", today + "T23:59:59");
        const completedIds = new Set((completions || []).map(c => c.mission_id));
        setMissions(missionData.map(m => ({ ...m, completed: completedIds.has(m.id) })));
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
        const { data: weekCompletions } = await supabase
          .from("mission_completions").select("mission_id").eq("user_id", user.id)
          .gte("completed_at", weekAgo);
        const counts: Record<string, number> = {};
        (weekCompletions || []).forEach(c => { counts[c.mission_id] = (counts[c.mission_id] || 0) + 1; });
        setMissionCompletionCounts(counts);
      } else {
        setMissions([]);
      }
    };
    fetchMissions();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const fetchAchievements = async () => {
      const { data: allAch } = await supabase.from("achievements").select("*");
      const { data: userAch } = await supabase.from("user_achievements").select("*").eq("user_id", user.id);
      const userAchMap = new Map((userAch || []).map(ua => [ua.achievement_id, ua]));
      setAchievements((allAch || []).map(a => {
        const ua = userAchMap.get(a.id);
        return { id: a.id, title: a.title, description: a.description, icon: a.icon, maxProgress: a.max_progress, progress: ua?.progress || 0, unlocked: ua?.unlocked || false };
      }));
    };
    fetchAchievements();
  }, [user]);

  const getDevaluation = (missionId: string) => Math.min((missionCompletionCounts[missionId] || 0) * 0.1, 0.7);

  const completeMission = useCallback(async (id: string) => {
    if (!user || !profile) return;
    const mission = missions.find(m => m.id === id);
    if (!mission || mission.completed) return;
    const { data, error } = await supabase.rpc('complete_mission', { p_mission_id: id });
    if (error) { toast.error("Ошибка выполнения"); return; }
    const result = data as any;
    const rewardResult = {
      baseXP: result.baseXP, bonusXP: result.bonusXP, totalXP: result.totalXP,
      isCriticalHit: result.isCriticalHit,
      mysteryBox: result.hasMysteryBox ? { type: 'xp_boost' as const, amount: result.mysteryAmount, description: 'Бонус дня!', icon: '⚡' } : null,
      streakMultiplier: result.streakMultiplier, coinsEarned: result.coinsEarned,
      leveledUp: result.leveledUp, newLevel: result.newLevel || undefined,
    };
    if (result.isCriticalHit || result.hasMysteryBox || result.leveledUp) setReward(rewardResult);
    else toast.success(`+${result.totalXP} опыта`, { description: mission.title, duration: 2000 });
    setMissions(prev => prev.map(m => m.id === id ? { ...m, completed: true } : m));
    setMissionCompletionCounts(prev => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
    await refetchProfile();
  }, [user, profile, missions, refetchProfile]);

  const handleMoodSubmit = useCallback(async (mood: number, energy: number, note: string) => {
    if (!user) return;
    await supabase.rpc('submit_mood_checkin', { p_mood: mood, p_energy: energy, p_note: note || null });
    toast.success("+15 опыта", { description: "Настроение записано" });
    await refetchProfile();
  }, [user, refetchProfile]);

  const handleDreamSubmit = useCallback(async (title: string, description: string, lucidity: number) => {
    if (!user) return;
    await supabase.rpc('submit_dream_entry', { p_title: title, p_description: description || null, p_lucidity: lucidity });
    toast.success("+25 опыта", { description: `Сон «${title}» записан` });
    await refetchProfile();
  }, [user, refetchProfile]);

  const handleCreateMission = useCallback(async (data: { title: string; description: string; category: string; icon: string; xp_reward: number }) => {
    if (!user) return;
    const { data: inserted } = await supabase.from("missions").insert({ ...data, user_id: user.id }).select().single();
    if (inserted) {
      setMissions(prev => [...prev, { ...inserted, completed: false }]);
      toast.success("Привычка добавлена", { description: data.title });
    }
  }, [user]);

  const handleEditMission = useCallback(async (id: string, data: { title: string; description: string; icon: string }) => {
    if (!user) return;
    await supabase.from("missions").update(data).eq("id", id).eq("user_id", user.id);
    setMissions(prev => prev.map(m => m.id === id ? { ...m, ...data } : m));
    toast.success("Привычка обновлена");
  }, [user]);

  const handleDeleteMission = useCallback(async (id: string) => {
    if (!user) return;
    await supabase.from("missions").delete().eq("id", id).eq("user_id", user.id);
    setMissions(prev => prev.filter(m => m.id !== id));
    toast.success("Привычка удалена");
  }, [user]);

  const completedCount = missions.filter(m => m.completed).length;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Доброе утро" : hour < 18 ? "Добрый день" : "Добрый вечер";

  return (
    <div className="min-h-screen bg-background cyber-grid relative pb-20">
      <ParticleField />

      {/* Daily Checkin Overlay */}
      <AnimatePresence>
        {showDailyCheckin && profile && (
          <DailyCheckin onComplete={handleDailyCheckinComplete} streak={profile.streak} />
        )}
      </AnimatePresence>

      {/* Streak Shield */}
      {profile && (
        <StreakShield
          open={showStreakShield}
          streak={profile.streak}
          longestStreak={profile.longest_streak}
          coins={profile.coins}
          onProtect={handleStreakProtect}
          onDismiss={() => setShowStreakShield(false)}
        />
      )}

      {/* Weekly Report */}
      <WeeklyReport open={showWeeklyReport} onClose={() => setShowWeeklyReport(false)} />

      <AnimatePresence>
        {showOnboarding && <Onboarding onComplete={() => setShowOnboarding(false)} />}
      </AnimatePresence>

      <div className="relative z-10 max-w-2xl mx-auto px-4 py-6 space-y-4">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground tracking-tight">
              {greeting}{profile ? `, ${profile.display_name.split(' ')[0]}` : ''} 👋
            </h1>
            <p className="text-[10px] text-muted-foreground font-mono">
              {profile && profile.streak > 0
                ? `🔥 ${profile.streak} ${profile.streak === 1 ? 'день' : profile.streak < 5 ? 'дня' : 'дней'} подряд — продолжай!`
                : 'начни серию активных дней сегодня'}
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            <NavButton icon={<HelpCircle className="w-4 h-4" />} onClick={startTutorial} tooltip="Обучение" color="text-muted-foreground" />
            <NavButton icon={<Heart className="w-4 h-4" />} onClick={() => navigate("/desires")} tooltip="Желания" color="text-secondary" />
          </div>
        </motion.div>

        {/* Streak motivation card */}
        {profile && profile.streak >= 3 && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="glass-card rounded-xl p-3 border border-accent/15 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-lg">
              {profile.streak >= 7 ? '🏆' : '🔥'}
            </div>
            <div className="flex-1">
              <p className="text-xs font-semibold text-foreground">
                {profile.streak >= 7 ? 'Невероятная серия!' : 'Отличная серия!'}
              </p>
              <p className="text-[10px] text-muted-foreground">
                {profile.streak} дней подряд.
                {profile.longest_streak > profile.streak
                  ? ` До рекорда (${profile.longest_streak}д) осталось ${profile.longest_streak - profile.streak}!`
                  : ' 🏆 Это твой рекорд!'}
              </p>
            </div>
          </motion.div>
        )}

        {/* Diagnostic block — accent */}
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-4 border-2 border-destructive/30 bg-gradient-to-r from-destructive/10 via-primary/10 to-accent/10 cursor-pointer hover:border-destructive/50 transition-all"
          onClick={() => navigate("/life-analysis")}
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-destructive/15 flex items-center justify-center text-2xl">
              🧬
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-foreground">Диагностика: определи свой архетип</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Алгоритм определит тип твоей прокрастинации и назначит протоколы, которые сломают паттерн
              </p>
            </div>
            <span className="text-destructive text-lg font-bold">→</span>
          </div>
        </motion.div>

        {/* XP + Stats */}
        <div id="tutorial-xp">
          {profile && <XPBar current={profile.xp} max={profile.xp_to_next} level={profile.level} displayName={profile.display_name} />}
        </div>
        <div id="tutorial-stats">
          {profile && <StatsRow energy={profile.energy} maxEnergy={profile.max_energy} streak={profile.streak} longestStreak={profile.longest_streak} totalMissions={profile.total_missions_completed} dreamsLogged={profile.total_dreams_logged} coins={profile.coins} />}
        </div>

        {/* Streak Badges */}
        {profile && profile.streak >= 1 && (
          <StreakBadges streak={profile.streak} longestStreak={profile.longest_streak} />
        )}

        {/* Phantom Competitor */}
        {profile && missions.length > 0 && (
          <PhantomCompetitor
            userCompletedToday={completedCount}
            userTotalCompleted={profile.total_missions_completed}
            userStreak={profile.streak}
            totalMissions={missions.length}
          />
        )}

        <AnimatePresence>
          {showWhyBlock && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              className="rounded-2xl p-4 border border-accent/20 bg-gradient-to-br from-accent/5 via-primary/5 to-secondary/5"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-xl flex-shrink-0">🧠</div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-foreground mb-1">Это не просто трекер</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Алгоритм определяет твой архетип прокрастинации и назначает нейробиологические протоколы (Глифы), которые ломают деструктивные паттерны. Настроение и энергия — входные данные для калибровки системы.
                  </p>
                  <p className="text-xs text-foreground/70 leading-relaxed mt-1.5 font-medium">
                    Каждый чекин = данные. Данные = точная диагностика. Диагностика = протоколы, которые работают.
                  </p>
                  <button
                    onClick={() => { localStorage.setItem("neuro_why_understood", "1"); setShowWhyBlock(false); }}
                    className="mt-2 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
                  >
                    Понятно ✓
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Collapsed "?" hint if block was dismissed */}
        {!showWhyBlock && (
          <motion.button
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            onClick={() => setShowWhyBlock(true)}
            className="flex items-center gap-1.5 text-[10px] text-muted-foreground/60 hover:text-muted-foreground transition-colors font-mono"
          >
            <HelpCircle className="w-3 h-3" /> зачем всё это?
          </motion.button>
        )}

        {/* Life Overview */}
        <div id="tutorial-fog">
          <LifeOverview />
        </div>

        {/* AI Insights */}
        <AIInsights />

        {/* Insights */}
        <InsightsPanel />

        {/* Habits */}
        <div id="tutorial-missions">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2"><span>⚡</span> Ежедневные привычки</h2>
            {missions.length > 0 && <span className="text-xs font-mono text-muted-foreground">{completedCount}/{missions.length}</span>}
          </div>
          {missions.length > 0 ? (
            <>
              <div className="space-y-2">
                {missions.map((mission, i) => (
                  <MissionCard key={mission.id} mission={mission} onComplete={completeMission}
                    onEdit={handleEditMission} onDelete={handleDeleteMission}
                    index={i} devaluation={getDevaluation(mission.id)} />
                ))}
              </div>
              <div className="mt-3">
                <CreateMission onSubmit={handleCreateMission} />
              </div>
            </>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl p-6 border-2 border-dashed border-primary/20 bg-primary/5 text-center space-y-3"
            >
              <div className="text-4xl">🧬</div>
              <h3 className="text-sm font-semibold text-foreground">Протоколы не назначены</h3>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-xs mx-auto">
                Пройди диагностику — алгоритм определит твой архетип прокрастинации и назначит Глифы, которые сломают деструктивные паттерны.
              </p>
              <button
                onClick={() => navigate("/life-analysis")}
                className="px-4 py-2 rounded-xl bg-destructive text-destructive-foreground text-xs font-semibold hover:bg-destructive/90 transition-colors"
              >
                Запустить диагностику →
              </button>
              <div className="pt-2">
                <CreateMission onSubmit={handleCreateMission} />
              </div>
            </motion.div>
          )}
        </div>

        <div id="tutorial-mood" className="grid md:grid-cols-2 gap-4">
          <MoodCheckin onSubmit={handleMoodSubmit} />
          <DreamJournal onSubmit={handleDreamSubmit} />
        </div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
          className="text-center py-6">
          <p className="text-[10px] text-muted-foreground/40 font-mono">
            каждый день — шаг к лучшей версии себя
          </p>
        </motion.div>
      </div>
      <RewardPopup reward={reward} onClose={() => setReward(null)} />
      <BottomNav />
    </div>
  );
};

const NavButton = ({ icon, onClick, tooltip, color }: { icon: React.ReactNode; onClick: () => void; tooltip: string; color: string }) => (
  <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={onClick} title={tooltip}
    className={`w-8 h-8 rounded-lg bg-muted/30 border border-border/30 flex items-center justify-center ${color} hover:bg-muted/50 transition-all`}>
    {icon}
  </motion.button>
);

export default Index;

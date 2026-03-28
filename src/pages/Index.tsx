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
import { toast } from "sonner";
import { Heart, Shield } from "lucide-react";
import BottomNav from "@/components/BottomNav";

const DEFAULT_MISSIONS = [
  { title: 'Утренняя калибровка', description: '10 минут тишины — перезагрузка фильтров', xp_reward: 30, category: 'habit', icon: '🧘' },
  { title: 'Дешифровать сон', description: 'Распаковать ночной архив', xp_reward: 25, category: 'dream', icon: '🌙' },
  { title: 'Сканировать состояние', description: 'Зафиксировать текущий сигнал', xp_reward: 15, category: 'mood', icon: '📡' },
  { title: 'Рассеять туман', description: '30 мин движения — расширить зону видимости', xp_reward: 35, category: 'health', icon: '🚶' },
  { title: 'Записать вектор', description: 'Куда направлен твой Интерпретатор?', xp_reward: 20, category: 'desire', icon: '✨' },
  { title: 'Холодная перезагрузка', description: 'Термошок — перекалибровка нервной системы', xp_reward: 40, category: 'health', icon: '🧊' },
];

const Index = () => {
  const { user, signOut } = useAuth();
  const { profile, refetch: refetchProfile } = useProfile();
  const navigate = useNavigate();
  const [missions, setMissions] = useState<(MissionData & { completed: boolean })[]>([]);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [reward, setReward] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [missionCompletionCounts, setMissionCompletionCounts] = useState<Record<string, number>>({});

  // Check onboarding
  useEffect(() => {
    if (!localStorage.getItem("neuro_onboarded")) {
      setShowOnboarding(true);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin")
      .then(({ data }) => setIsAdmin(!!(data && data.length > 0)));
  }, [user]);

  // Fetch missions + completion counts for devaluation
  useEffect(() => {
    if (!user) return;
    const fetchMissions = async () => {
      const { data } = await supabase.from("missions").select("*").eq("user_id", user.id).eq("is_active", true);
      if (data && data.length > 0) {
        const today = new Date().toISOString().split('T')[0];
        const { data: completions } = await supabase
          .from("mission_completions").select("mission_id").eq("user_id", user.id)
          .gte("completed_at", today + "T00:00:00").lte("completed_at", today + "T23:59:59");
        const completedIds = new Set((completions || []).map(c => c.mission_id));
        setMissions(data.map(m => ({ ...m, completed: completedIds.has(m.id) })));

        // Get total completion counts for devaluation (last 7 days)
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
        const { data: weekCompletions } = await supabase
          .from("mission_completions").select("mission_id").eq("user_id", user.id)
          .gte("completed_at", weekAgo);
        const counts: Record<string, number> = {};
        (weekCompletions || []).forEach(c => { counts[c.mission_id] = (counts[c.mission_id] || 0) + 1; });
        setMissionCompletionCounts(counts);
      } else {
        const toInsert = DEFAULT_MISSIONS.map(m => ({ ...m, user_id: user.id }));
        const { data: inserted } = await supabase.from("missions").insert(toInsert).select();
        if (inserted) setMissions(inserted.map(m => ({ ...m, completed: false })));
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

  // Calculate devaluation: entropy drops as mission is repeated
  const getDevaluation = (missionId: string) => {
    const count = missionCompletionCounts[missionId] || 0;
    // After 7 completions in a week, XP drops to 30%
    return Math.min(count * 0.1, 0.7);
  };

  const completeMission = useCallback(async (id: string) => {
    if (!user || !profile) return;
    const mission = missions.find(m => m.id === id);
    if (!mission || mission.completed) return;

    const devaluation = getDevaluation(id);
    const effectiveBaseXP = Math.max(Math.floor(mission.xp_reward * (1 - devaluation)), Math.floor(mission.xp_reward * 0.3));

    const isCriticalHit = Math.random() < 0.15;
    const streakMultiplier = Math.min(1 + (profile.streak * 0.1), 2.0);
    const hasMysteryBox = Math.random() < 0.1;

    let bonusXP = 0;
    if (isCriticalHit) bonusXP += effectiveBaseXP;
    bonusXP += Math.floor(effectiveBaseXP * (streakMultiplier - 1));

    const mysteryBoxReward = hasMysteryBox ? {
      type: 'xp_boost' as const, amount: Math.floor(Math.random() * 30 + 20),
      description: 'Аномалия данных!', icon: '⚡',
    } : null;
    if (mysteryBoxReward) bonusXP += mysteryBoxReward.amount;

    const totalXP = effectiveBaseXP + bonusXP;
    const coinsEarned = Math.floor(totalXP / 10);
    const newXP = profile.xp + totalXP;
    const leveledUp = newXP >= profile.xp_to_next;
    const newLevel = leveledUp ? profile.level + 1 : profile.level;
    const remainingXP = leveledUp ? newXP - profile.xp_to_next : newXP;
    const newXPToNext = leveledUp ? Math.floor(100 * Math.pow(1.25, newLevel - 1)) : profile.xp_to_next;

    await supabase.from("mission_completions").insert({ user_id: user.id, mission_id: id, xp_earned: effectiveBaseXP, bonus_xp: bonusXP });
    await supabase.from("profiles").update({
      xp: remainingXP, xp_to_next: newXPToNext, level: newLevel,
      total_missions_completed: profile.total_missions_completed + 1,
      energy: Math.min(profile.energy + 5, profile.max_energy),
      coins: profile.coins + coinsEarned,
    }).eq("user_id", user.id);

    if (isCriticalHit || mysteryBoxReward) {
      await supabase.from("rewards_log").insert({
        user_id: user.id, reward_type: isCriticalHit ? 'critical_hit' : 'mystery_box',
        xp_amount: bonusXP, coins_amount: coinsEarned,
        description: isCriticalHit ? 'Резонанс! x2 сжатие' : mysteryBoxReward?.description,
      });
    }

    const rewardResult = { baseXP: effectiveBaseXP, bonusXP, totalXP, isCriticalHit, mysteryBox: mysteryBoxReward, streakMultiplier, coinsEarned, leveledUp, newLevel: leveledUp ? newLevel : undefined };
    if (isCriticalHit || mysteryBoxReward || leveledUp) setReward(rewardResult);
    else toast.success(`+${totalXP} негэнтропии`, { description: mission.title, duration: 2000 });

    setMissions(prev => prev.map(m => m.id === id ? { ...m, completed: true } : m));
    setMissionCompletionCounts(prev => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
    await refetchProfile();
  }, [user, profile, missions, missionCompletionCounts, refetchProfile]);

  const handleMoodSubmit = useCallback(async (mood: number, energy: number, note: string) => {
    if (!user || !profile) return;
    await supabase.from("mood_entries").insert({ user_id: user.id, mood, energy_level: energy, note: note || null });
    await supabase.from("profiles").update({ xp: profile.xp + 15 }).eq("user_id", user.id);
    toast.success("+15 негэнтропии", { description: "Туман рассеивается" });
    await refetchProfile();
  }, [user, profile, refetchProfile]);

  const handleDreamSubmit = useCallback(async (title: string, description: string, lucidity: number) => {
    if (!user || !profile) return;
    await supabase.from("dream_entries").insert({ user_id: user.id, title, description: description || null, lucidity });
    await supabase.from("profiles").update({ xp: profile.xp + 25, total_dreams_logged: profile.total_dreams_logged + 1 }).eq("user_id", user.id);
    toast.success("+25 негэнтропии", { description: `Архив "${title}" распакован` });
    await refetchProfile();
  }, [user, profile, refetchProfile]);

  const handleCreateMission = useCallback(async (data: { title: string; description: string; category: string; icon: string; xp_reward: number }) => {
    if (!user) return;
    const { data: inserted } = await supabase.from("missions").insert({ ...data, user_id: user.id }).select().single();
    if (inserted) {
      setMissions(prev => [...prev, { ...inserted, completed: false }]);
      toast.success("Протокол активирован", { description: data.title });
    }
  }, [user]);

  const completedCount = missions.filter(m => m.completed).length;

  return (
    <div className="min-h-screen bg-background cyber-grid relative pb-20">
      <ParticleField />

      <AnimatePresence>
        {showOnboarding && <Onboarding onComplete={() => setShowOnboarding(false)} />}
      </AnimatePresence>

      <div className="relative z-10 max-w-2xl mx-auto px-4 py-6 space-y-4">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-primary text-glow-primary font-display tracking-tight">NEURO.LOG</h1>
            <p className="text-[10px] text-muted-foreground font-mono">персональный интерпретатор • v1.0</p>
          </div>
          <div className="flex items-center gap-1.5">
            <NavButton icon={<Heart className="w-4 h-4" />} onClick={() => navigate("/desires")} tooltip="Вектора" color="text-secondary" />
            {isAdmin && <NavButton icon={<Shield className="w-4 h-4" />} onClick={() => navigate("/admin")} tooltip="Админ" color="text-destructive" />}
          </div>
        </motion.div>

        {profile && <XPBar current={profile.xp} max={profile.xp_to_next} level={profile.level} displayName={profile.display_name} />}
        {profile && <StatsRow energy={profile.energy} maxEnergy={profile.max_energy} streak={profile.streak} totalMissions={profile.total_missions_completed} dreamsLogged={profile.total_dreams_logged} coins={profile.coins} />}

        {/* Insights */}
        <InsightsPanel />

        {/* Missions */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2"><span>⚡</span> Протоколы сжатия</h2>
            <span className="text-xs font-mono text-muted-foreground">{completedCount}/{missions.length}</span>
          </div>
          <div className="space-y-2">
            {missions.map((mission, i) => (
              <MissionCard key={mission.id} mission={mission} onComplete={completeMission} index={i} devaluation={getDevaluation(mission.id)} />
            ))}
          </div>
          <div className="mt-3">
            <CreateMission onSubmit={handleCreateMission} />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <MoodCheckin onSubmit={handleMoodSubmit} />
          <DreamJournal onSubmit={handleDreamSubmit} />
        </div>

        {achievements.length > 0 && <AchievementsList achievements={achievements} />}

        {/* Philosophy hint */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
          className="text-center py-6 space-y-1">
          <p className="text-[10px] text-muted-foreground/40 font-mono">
            ты — движок негэнтропии. сжимай хаос в ясность.
          </p>
          <p className="text-[9px] text-muted-foreground/20 font-mono">
            NEURO.LOG • персональный интерпретатор
          </p>
        </motion.div>
      </div>
      <RewardPopup reward={reward} onClose={() => setReward(null)} />
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

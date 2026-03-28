import { useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
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
import { toast } from "sonner";
import { LogOut, User, MessageCircle, Heart, Shield } from "lucide-react";

const DEFAULT_MISSIONS = [
  { title: 'Утренняя медитация', description: '10 минут тишины и осознанности', xp_reward: 30, category: 'habit', icon: '🧘' },
  { title: 'Записать сон', description: 'Зафиксируй что снилось сегодня', xp_reward: 25, category: 'dream', icon: '🌙' },
  { title: 'Чекин настроения', description: 'Как ты себя чувствуешь?', xp_reward: 15, category: 'mood', icon: '💫' },
  { title: 'Прогулка 30 мин', description: 'Выйди на свежий воздух', xp_reward: 35, category: 'health', icon: '🚶' },
  { title: 'Записать желание', description: 'Чего ты хочешь на самом деле?', xp_reward: 20, category: 'desire', icon: '✨' },
  { title: 'Холодный душ', description: 'Перезагрузи нервную систему', xp_reward: 40, category: 'health', icon: '🧊' },
];

const Index = () => {
  const { user, signOut } = useAuth();
  const { profile, refetch: refetchProfile } = useProfile();
  const navigate = useNavigate();
  const [missions, setMissions] = useState<(MissionData & { completed: boolean })[]>([]);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [reward, setReward] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!user) return;
    // Check admin
    supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin")
      .then(({ data }) => setIsAdmin(!!(data && data.length > 0)));
  }, [user]);

  // Fetch missions
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
      } else {
        const toInsert = DEFAULT_MISSIONS.map(m => ({ ...m, user_id: user.id }));
        const { data: inserted } = await supabase.from("missions").insert(toInsert).select();
        if (inserted) setMissions(inserted.map(m => ({ ...m, completed: false })));
      }
    };
    fetchMissions();
  }, [user]);

  // Fetch achievements
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

  const completeMission = useCallback(async (id: string) => {
    if (!user || !profile) return;
    const mission = missions.find(m => m.id === id);
    if (!mission || mission.completed) return;

    const isCriticalHit = Math.random() < 0.15;
    const streakMultiplier = Math.min(1 + (profile.streak * 0.1), 2.0);
    const hasMysteryBox = Math.random() < 0.1;

    let bonusXP = 0;
    if (isCriticalHit) bonusXP += mission.xp_reward;
    bonusXP += Math.floor(mission.xp_reward * (streakMultiplier - 1));

    const mysteryBoxReward = hasMysteryBox ? {
      type: 'xp_boost' as const, amount: Math.floor(Math.random() * 30 + 20),
      description: 'Бонус опыта!', icon: '⚡',
    } : null;
    if (mysteryBoxReward) bonusXP += mysteryBoxReward.amount;

    const totalXP = mission.xp_reward + bonusXP;
    const coinsEarned = Math.floor(totalXP / 10);
    const newXP = profile.xp + totalXP;
    const leveledUp = newXP >= profile.xp_to_next;
    const newLevel = leveledUp ? profile.level + 1 : profile.level;
    const remainingXP = leveledUp ? newXP - profile.xp_to_next : newXP;
    const newXPToNext = leveledUp ? Math.floor(100 * Math.pow(1.25, newLevel - 1)) : profile.xp_to_next;

    await supabase.from("mission_completions").insert({ user_id: user.id, mission_id: id, xp_earned: mission.xp_reward, bonus_xp: bonusXP });
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
        description: isCriticalHit ? 'Критический удар! 2x XP' : mysteryBoxReward?.description,
      });
    }

    const rewardResult = { baseXP: mission.xp_reward, bonusXP, totalXP, isCriticalHit, mysteryBox: mysteryBoxReward, streakMultiplier, coinsEarned, leveledUp, newLevel: leveledUp ? newLevel : undefined };
    if (isCriticalHit || mysteryBoxReward || leveledUp) setReward(rewardResult);
    else toast.success(`+${totalXP} XP`, { description: mission.title, duration: 2000 });

    setMissions(prev => prev.map(m => m.id === id ? { ...m, completed: true } : m));
    await refetchProfile();
  }, [user, profile, missions, refetchProfile]);

  const handleMoodSubmit = useCallback(async (mood: number, energy: number, note: string) => {
    if (!user || !profile) return;
    await supabase.from("mood_entries").insert({ user_id: user.id, mood, energy_level: energy, note: note || null });
    await supabase.from("profiles").update({ xp: profile.xp + 15 }).eq("user_id", user.id);
    toast.success("+15 XP", { description: "Чекин записан" });
    await refetchProfile();
  }, [user, profile, refetchProfile]);

  const handleDreamSubmit = useCallback(async (title: string, description: string, lucidity: number) => {
    if (!user || !profile) return;
    await supabase.from("dream_entries").insert({ user_id: user.id, title, description: description || null, lucidity });
    await supabase.from("profiles").update({ xp: profile.xp + 25, total_dreams_logged: profile.total_dreams_logged + 1 }).eq("user_id", user.id);
    toast.success("+25 XP", { description: `Сон "${title}" записан` });
    await refetchProfile();
  }, [user, profile, refetchProfile]);

  const handleCreateMission = useCallback(async (data: { title: string; description: string; category: string; icon: string; xp_reward: number }) => {
    if (!user) return;
    const { data: inserted } = await supabase.from("missions").insert({ ...data, user_id: user.id }).select().single();
    if (inserted) {
      setMissions(prev => [...prev, { ...inserted, completed: false }]);
      toast.success("Миссия создана!", { description: data.title });
    }
  }, [user]);

  const completedCount = missions.filter(m => m.completed).length;

  return (
    <div className="min-h-screen bg-background cyber-grid relative">
      <ParticleField />
      <div className="relative z-10 max-w-2xl mx-auto px-4 py-6 space-y-4">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-primary text-glow-primary font-display tracking-tight">NEURO.LOG</h1>
            <p className="text-[10px] text-muted-foreground font-mono">система оцифровки • v0.3</p>
          </div>
          <div className="flex items-center gap-1.5">
            <NavButton icon={<Heart className="w-4 h-4" />} onClick={() => navigate("/desires")} tooltip="Желания" color="text-secondary" />
            <NavButton icon={<MessageCircle className="w-4 h-4" />} onClick={() => navigate("/chat")} tooltip="Чат" color="text-accent" />
            <NavButton icon={<User className="w-4 h-4" />} onClick={() => navigate("/profile")} tooltip="Профиль" color="text-primary" />
            {isAdmin && <NavButton icon={<Shield className="w-4 h-4" />} onClick={() => navigate("/admin")} tooltip="Админ" color="text-destructive" />}
            <NavButton icon={<LogOut className="w-4 h-4" />} onClick={signOut} tooltip="Выход" color="text-muted-foreground" />
          </div>
        </motion.div>

        {profile && <XPBar current={profile.xp} max={profile.xp_to_next} level={profile.level} displayName={profile.display_name} />}
        {profile && <StatsRow energy={profile.energy} maxEnergy={profile.max_energy} streak={profile.streak} totalMissions={profile.total_missions_completed} dreamsLogged={profile.total_dreams_logged} coins={profile.coins} />}

        {/* Missions */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2"><span>⚡</span> Ежедневные миссии</h2>
            <span className="text-xs font-mono text-muted-foreground">{completedCount}/{missions.length}</span>
          </div>
          <div className="space-y-2">
            {missions.map((mission, i) => (
              <MissionCard key={mission.id} mission={mission} onComplete={completeMission} index={i} />
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

        <p className="text-center text-[10px] text-muted-foreground font-mono py-4">NEURO.LOG • стабилизация мета-мотивации</p>
      </div>
      <RewardPopup reward={reward} onClose={() => setReward(null)} />
    </div>
  );
};

const NavButton = ({ icon, onClick, tooltip, color }: { icon: React.ReactNode; onClick: () => void; tooltip: string; color: string }) => (
  <motion.button
    whileHover={{ scale: 1.1 }}
    whileTap={{ scale: 0.9 }}
    onClick={onClick}
    title={tooltip}
    className={`w-8 h-8 rounded-lg bg-muted/30 border border-border/30 flex items-center justify-center ${color} hover:bg-muted/50 transition-all`}
  >
    {icon}
  </motion.button>
);

export default Index;

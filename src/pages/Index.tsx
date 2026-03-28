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
import { toast } from "sonner";
import { LogOut, User, Plus } from "lucide-react";

const DEFAULT_MISSIONS: Omit<MissionData, 'id' | 'completed'>[] = [
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
  const [todayCompletions, setTodayCompletions] = useState<Set<string>>(new Set());
  const [achievements, setAchievements] = useState<any[]>([]);
  const [reward, setReward] = useState<any>(null);

  // Fetch missions
  useEffect(() => {
    if (!user) return;
    const fetchMissions = async () => {
      const { data } = await supabase.from("missions").select("*").eq("user_id", user.id).eq("is_active", true);
      if (data && data.length > 0) {
        // Get today's completions
        const today = new Date().toISOString().split('T')[0];
        const { data: completions } = await supabase
          .from("mission_completions")
          .select("mission_id")
          .eq("user_id", user.id)
          .gte("completed_at", today + "T00:00:00")
          .lte("completed_at", today + "T23:59:59");
        
        const completedIds = new Set((completions || []).map(c => c.mission_id));
        setTodayCompletions(completedIds);
        setMissions(data.map(m => ({ ...m, completed: completedIds.has(m.id) })));
      } else {
        // Seed default missions
        const toInsert = DEFAULT_MISSIONS.map(m => ({ ...m, user_id: user.id }));
        const { data: inserted } = await supabase.from("missions").insert(toInsert).select();
        if (inserted) {
          setMissions(inserted.map(m => ({ ...m, completed: false })));
        }
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
      
      const merged = (allAch || []).map(a => {
        const ua = userAchMap.get(a.id);
        return {
          id: a.id,
          title: a.title,
          description: a.description,
          icon: a.icon,
          maxProgress: a.max_progress,
          progress: ua?.progress || 0,
          unlocked: ua?.unlocked || false,
        };
      });
      setAchievements(merged);
    };
    fetchAchievements();
  }, [user]);

  const completeMission = useCallback(async (id: string) => {
    if (!user || !profile) return;
    
    // Variable reward calculation
    const mission = missions.find(m => m.id === id);
    if (!mission || mission.completed) return;

    const isCriticalHit = Math.random() < 0.15;
    const streakMultiplier = Math.min(1 + (profile.streak * 0.1), 2.0);
    const hasMysteryBox = Math.random() < 0.1;
    
    let bonusXP = 0;
    if (isCriticalHit) bonusXP += mission.xp_reward;
    bonusXP += Math.floor(mission.xp_reward * (streakMultiplier - 1));
    
    const mysteryBoxReward = hasMysteryBox ? {
      type: 'xp_boost' as const,
      amount: Math.floor(Math.random() * 30 + 20),
      description: 'Бонус опыта!',
      icon: '⚡',
    } : null;

    if (mysteryBoxReward?.type === 'xp_boost') bonusXP += mysteryBoxReward.amount;

    const totalXP = mission.xp_reward + bonusXP;
    const coinsEarned = Math.floor(totalXP / 10);

    const newXP = profile.xp + totalXP;
    const leveledUp = newXP >= profile.xp_to_next;
    const newLevel = leveledUp ? profile.level + 1 : profile.level;
    const remainingXP = leveledUp ? newXP - profile.xp_to_next : newXP;
    const newXPToNext = leveledUp ? Math.floor(100 * Math.pow(1.25, newLevel - 1)) : profile.xp_to_next;

    // Log completion
    await supabase.from("mission_completions").insert({
      user_id: user.id,
      mission_id: id,
      xp_earned: mission.xp_reward,
      bonus_xp: bonusXP,
    });

    // Update profile
    await supabase.from("profiles").update({
      xp: remainingXP,
      xp_to_next: newXPToNext,
      level: newLevel,
      total_missions_completed: profile.total_missions_completed + 1,
      energy: Math.min(profile.energy + 5, profile.max_energy),
      coins: profile.coins + coinsEarned,
    }).eq("user_id", user.id);

    // Show reward
    const rewardResult = {
      baseXP: mission.xp_reward,
      bonusXP,
      totalXP,
      isCriticalHit,
      mysteryBox: mysteryBoxReward,
      streakMultiplier,
      coinsEarned,
      leveledUp,
      newLevel: leveledUp ? newLevel : undefined,
    };

    if (isCriticalHit || mysteryBoxReward || leveledUp) {
      setReward(rewardResult);
    } else {
      toast.success(`+${totalXP} XP`, { description: mission.title, duration: 2000 });
    }

    // Update local state
    setMissions(prev => prev.map(m => m.id === id ? { ...m, completed: true } : m));
    await refetchProfile();
  }, [user, profile, missions, refetchProfile]);

  const handleMoodSubmit = useCallback(async (mood: number, energy: number, note: string) => {
    if (!user || !profile) return;
    await supabase.from("mood_entries").insert({
      user_id: user.id,
      mood,
      energy_level: energy,
      note: note || null,
    });
    await supabase.from("profiles").update({
      xp: profile.xp + 15,
      total_missions_completed: profile.total_missions_completed,
    }).eq("user_id", user.id);
    toast.success("+15 XP", { description: "Чекин записан", duration: 2000 });
    await refetchProfile();
  }, [user, profile, refetchProfile]);

  const handleDreamSubmit = useCallback(async (title: string, description: string, lucidity: number) => {
    if (!user || !profile) return;
    await supabase.from("dream_entries").insert({
      user_id: user.id,
      title,
      description: description || null,
      lucidity,
    });
    await supabase.from("profiles").update({
      xp: profile.xp + 25,
      total_dreams_logged: profile.total_dreams_logged + 1,
    }).eq("user_id", user.id);
    toast.success("+25 XP", { description: `Сон "${title}" записан`, duration: 2000 });
    await refetchProfile();
  }, [user, profile, refetchProfile]);

  const completedCount = missions.filter(m => m.completed).length;

  return (
    <div className="min-h-screen bg-background cyber-grid relative">
      <ParticleField />
      
      <div className="relative z-10 max-w-2xl mx-auto px-4 py-6 space-y-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-2xl font-bold text-primary text-glow-primary font-display tracking-tight">
              NEURO.LOG
            </h1>
            <p className="text-[10px] text-muted-foreground font-mono">
              система оцифровки • v0.2
            </p>
          </div>
          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate("/profile")}
              className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary hover:bg-primary/20 transition-all"
            >
              <User className="w-4 h-4" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={signOut}
              className="w-9 h-9 rounded-xl bg-muted/50 border border-border/50 flex items-center justify-center text-muted-foreground hover:text-foreground transition-all"
            >
              <LogOut className="w-4 h-4" />
            </motion.button>
          </div>
        </motion.div>

        {/* XP Bar */}
        {profile && (
          <XPBar
            current={profile.xp}
            max={profile.xp_to_next}
            level={profile.level}
            displayName={profile.display_name}
          />
        )}

        {/* Stats */}
        {profile && (
          <StatsRow
            energy={profile.energy}
            maxEnergy={profile.max_energy}
            streak={profile.streak}
            totalMissions={profile.total_missions_completed}
            dreamsLogged={profile.total_dreams_logged}
            coins={profile.coins}
          />
        )}

        {/* Missions */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <span>⚡</span> Ежедневные миссии
            </h2>
            <span className="text-xs font-mono text-muted-foreground">
              {completedCount}/{missions.length}
            </span>
          </div>
          <div className="space-y-2">
            {missions.map((mission, i) => (
              <MissionCard
                key={mission.id}
                mission={mission}
                onComplete={completeMission}
                index={i}
              />
            ))}
          </div>
        </div>

        {/* Mood + Dream */}
        <div className="grid md:grid-cols-2 gap-4">
          <MoodCheckin onSubmit={handleMoodSubmit} />
          <DreamJournal onSubmit={handleDreamSubmit} />
        </div>

        {/* Achievements */}
        {achievements.length > 0 && <AchievementsList achievements={achievements} />}

        {/* Footer */}
        <p className="text-center text-[10px] text-muted-foreground font-mono py-4">
          NEURO.LOG • стабилизация мета-мотивации
        </p>
      </div>

      {/* Reward Popup */}
      <RewardPopup reward={reward} onClose={() => setReward(null)} />
    </div>
  );
};

export default Index;

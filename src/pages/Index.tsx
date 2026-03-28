import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import XPBar from "@/components/XPBar";
import StatsRow from "@/components/StatsRow";
import MissionCard from "@/components/MissionCard";
import MoodCheckin from "@/components/MoodCheckin";
import DreamJournal from "@/components/DreamJournal";
import AchievementsList from "@/components/AchievementsList";
import { defaultStats, defaultMissions, defaultAchievements } from "@/lib/gameData";
import type { UserStats, Mission } from "@/lib/gameData";
import { toast } from "sonner";

const Index = () => {
  const [stats, setStats] = useState<UserStats>(defaultStats);
  const [missions, setMissions] = useState<Mission[]>(defaultMissions);
  const [achievements] = useState(defaultAchievements);

  const completeMission = useCallback((id: string) => {
    setMissions(prev => prev.map(m => m.id === id ? { ...m, completed: true } : m));
    const mission = missions.find(m => m.id === id);
    if (mission) {
      setStats(prev => {
        const newXp = prev.xp + mission.xpReward;
        const levelUp = newXp >= prev.xpToNext;
        return {
          ...prev,
          xp: levelUp ? newXp - prev.xpToNext : newXp,
          level: levelUp ? prev.level + 1 : prev.level,
          xpToNext: levelUp ? Math.floor(prev.xpToNext * 1.3) : prev.xpToNext,
          totalMissions: prev.totalMissions + 1,
          energy: Math.min(prev.energy + 5, prev.maxEnergy),
        };
      });
      toast.success(`+${mission.xpReward} XP`, {
        description: mission.title,
        duration: 2000,
      });
    }
  }, [missions]);

  const handleMoodSubmit = useCallback((mood: number, note: string) => {
    setStats(prev => ({ ...prev, xp: prev.xp + 15 }));
    toast.success("+15 XP", { description: "Чекин настроения записан", duration: 2000 });
  }, []);

  const handleDreamSubmit = useCallback((title: string) => {
    setStats(prev => ({
      ...prev,
      xp: prev.xp + 25,
      dreamsLogged: prev.dreamsLogged + 1,
    }));
    toast.success("+25 XP", { description: `Сон "${title}" записан`, duration: 2000 });
  }, []);

  const completedCount = missions.filter(m => m.completed).length;

  return (
    <div className="min-h-screen bg-background cyber-grid">
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-2"
        >
          <h1 className="text-2xl font-bold text-primary text-glow-primary font-display tracking-tight">
            NEURO.LOG
          </h1>
          <p className="text-xs text-muted-foreground font-mono mt-1">
            система оцифровки нейроинтерфейса • v0.1
          </p>
        </motion.div>

        {/* XP Bar */}
        <XPBar current={stats.xp} max={stats.xpToNext} level={stats.level} />

        {/* Stats */}
        <StatsRow
          energy={stats.energy}
          maxEnergy={stats.maxEnergy}
          streak={stats.streak}
          totalMissions={stats.totalMissions}
          dreamsLogged={stats.dreamsLogged}
        />

        {/* Daily Missions */}
        <div>
          <div className="flex items-center justify-between mb-2">
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

        {/* Mood + Dream side by side on larger screens */}
        <div className="grid md:grid-cols-2 gap-4">
          <MoodCheckin onSubmit={handleMoodSubmit} />
          <DreamJournal onSubmit={handleDreamSubmit} />
        </div>

        {/* Achievements */}
        <AchievementsList achievements={achievements} />

        {/* Footer */}
        <p className="text-center text-[10px] text-muted-foreground font-mono py-4">
          NEURO.LOG • стабилизация мета-мотивации
        </p>
      </div>
    </div>
  );
};

export default Index;

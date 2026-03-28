import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import ParticleField from "@/components/ParticleField";
import GlyphVisualizer from "@/components/GlyphVisualizer";
import InnerDrives from "@/components/InnerDrives";
import LifeOverview from "@/components/LifeOverview";
import StateRadar from "@/components/StateRadar";
import BottomNav from "@/components/BottomNav";
import { Info, X } from "lucide-react";
import { AnimatePresence } from "framer-motion";

const GlyphPage = () => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const [lifeBalance, setLifeBalance] = useState(50);
  const [showPageInfo, setShowPageInfo] = useState(false);

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
      const avgMood = moodData.length > 0 ? moodData.reduce((s, m) => s + m.mood, 0) / moodData.length : 0;
      const avgEnergy = moodData.length > 0 ? moodData.reduce((s, m) => s + m.energy_level, 0) / moodData.length : 0;
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

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-background cyber-grid relative pb-20">
      <ParticleField />
      <div className="relative z-10 max-w-2xl mx-auto px-4 py-6 space-y-4">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold text-foreground flex items-center gap-2">
                <span className="text-primary text-glow-primary">◈</span> Мой Глиф
              </h1>
              <p className="text-[10px] text-muted-foreground font-mono">
                визуальное отражение твоей активности
              </p>
            </div>
            <button onClick={() => setShowPageInfo(!showPageInfo)}
              className="w-8 h-8 rounded-lg bg-muted/20 border border-border/20 flex items-center justify-center text-muted-foreground/50 hover:text-primary transition-colors">
              <Info className="w-4 h-4" />
            </button>
          </div>
        </motion.div>

        {/* Page explanation */}
        <AnimatePresence>
          {showPageInfo && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
              className="glass-card rounded-2xl p-5 border border-primary/10 relative">
              <button onClick={() => setShowPageInfo(false)} className="absolute top-3 right-3 text-muted-foreground/30 hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
              <h3 className="text-sm font-semibold text-foreground mb-2">Что такое Глиф?</h3>
              <div className="space-y-2 text-[11px] text-muted-foreground leading-relaxed">
                <p>
                  <strong className="text-foreground">Глиф</strong> — это живой символ, который отражает твою активность. 
                  Представь его как аватар, который меняется в реальном времени: чем больше ты делаешь для себя, тем сложнее и ярче он становится.
                </p>
                <p>
                  🔵 <strong className="text-foreground">Кольцо</strong> вокруг — запас энергии. Полное кольцо = ты в отличной форме.
                </p>
                <p>
                  ✦ <strong className="text-foreground">Точки</strong> по кругу — серия активных дней подряд.
                </p>
                <p>
                  ◈ <strong className="text-foreground">Геометрия</strong> — чем выше уровень, тем больше граней и слоёв у фигуры.
                </p>
                <p className="text-primary/60 font-mono text-[10px] pt-1">
                  Цель: поддерживай глиф ярким через ежедневные привычки, записи настроения и снов.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <GlyphVisualizer
          level={profile.level} xp={profile.xp} xpToNext={profile.xp_to_next}
          energy={profile.energy} maxEnergy={profile.max_energy}
          streak={profile.streak} balance={lifeBalance}
          missionsCompleted={profile.total_missions_completed} dreamsLogged={profile.total_dreams_logged}
        />

        {/* Unified life overview */}
        <LifeOverview />

        <StateRadar />

        <InnerDrives />
      </div>
      <BottomNav />
    </div>
  );
};

export default GlyphPage;

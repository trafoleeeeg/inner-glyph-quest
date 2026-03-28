import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import ParticleField from "@/components/ParticleField";
import GlyphVisualizer from "@/components/GlyphVisualizer";
import InnerDrives from "@/components/InnerDrives";
import LifeBalanceChart from "@/components/LifeBalanceChart";
import FogOfWarMap from "@/components/FogOfWarMap";
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
                <span className="text-primary text-glow-primary">◈</span> Глиф и баланс
              </h1>
              <p className="text-[10px] text-muted-foreground font-mono">
                твоё состояние в цифрах и визуализации
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
              <h3 className="text-sm font-semibold text-foreground mb-2">Что здесь происходит?</h3>
              <div className="space-y-2 text-[11px] text-muted-foreground leading-relaxed">
                <p>
                  <strong className="text-foreground">Глиф</strong> — геометрическая фигура, которая отражает твою активность. 
                  Чем больше привычек выполняешь — тем сложнее и ярче она становится. Забросишь — потускнеет.
                </p>
                <p>
                  <strong className="text-foreground">Баланс сфер</strong> — радар из 6 направлений жизни (тело, разум, эмоции, связи, рост, сны). 
                  Показывает, где ты силён, а где стоит уделить внимание. Данные за последние 2 недели.
                </p>
                <p>
                  <strong className="text-foreground">Карта осознанности</strong> — визуализация того, насколько ты «видишь» каждую сферу. 
                  Чем больше записей — тем прозрачнее зона. Цель: открыть все шесть.
                </p>
                <p>
                  <strong className="text-foreground">Внутренние силы</strong> — части твоей личности (амбиции, покой, забота и т.д.). 
                  Настрой баланс между ними, чтобы понять, что для тебя важнее всего.
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

        {/* Merged section: Balance + Awareness */}
        <div className="space-y-1">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2 px-1">
            <span>⚖️</span> Баланс и осознанность
          </h2>
          <p className="text-[10px] text-muted-foreground px-1 mb-2">
            Два взгляда на одно и то же: <strong>баланс</strong> показывает силу каждой сферы, <strong>карта</strong> — насколько ты её отслеживаешь
          </p>
        </div>

        <LifeBalanceChart />
        <FogOfWarMap />

        <StateRadar />

        <InnerDrives />
      </div>
      <BottomNav />
    </div>
  );
};

export default GlyphPage;

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import ParticleField from "@/components/ParticleField";
import GlyphVisualizer from "@/components/GlyphVisualizer";
import LifeOverview from "@/components/LifeOverview";
import InnerDrives from "@/components/InnerDrives";
import BottomNav from "@/components/BottomNav";

const GlyphPage = () => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const [lifeBalance, setLifeBalance] = useState(50);

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
          <h1 className="text-lg font-bold text-foreground flex items-center gap-2">
            <span className="text-primary text-glow-primary">◈</span> Мой Глиф
          </h1>
          <p className="text-[10px] text-muted-foreground font-mono">
            визуальное отражение твоей активности
          </p>
        </motion.div>

        <GlyphVisualizer
          level={profile.level}
          energy={profile.energy} maxEnergy={profile.max_energy}
          streak={profile.streak}
        />

        {/* Life Overview integrated here */}
        <LifeOverview />

        <InnerDrives />
      </div>
      <BottomNav />
    </div>
  );
};

export default GlyphPage;
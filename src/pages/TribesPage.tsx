import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Users, Plus, X, LogIn, LogOut, Target, Crown } from "lucide-react";
import { toast } from "sonner";
import ParticleField from "@/components/ParticleField";
import BottomNav from "@/components/BottomNav";
import HeuristicsMarket from "@/components/HeuristicsMarket";

interface Tribe {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  color: string;
  creator_id: string;
  members_count: number;
  collective_xp: number;
  goal: string | null;
  is_public: boolean;
}

const TribesPage = () => {
  const { user } = useAuth();
  const [tribes, setTribes] = useState<Tribe[]>([]);
  const [myTribeIds, setMyTribeIds] = useState<Set<string>>(new Set());
  const [showCreate, setShowCreate] = useState(false);
  const [newTribe, setNewTribe] = useState({ name: "", description: "", icon: "🔥", goal: "" });
  const [selectedTribe, setSelectedTribe] = useState<Tribe | null>(null);
  const [tribeMembers, setTribeMembers] = useState<any[]>([]);

  const ICONS = ["🔥", "⚡", "🧠", "🌱", "💎", "🎯", "🦅", "🐉", "🌊", "☀️"];

  const fetchData = useCallback(async () => {
    if (!user) return;
    const [{ data: allTribes }, { data: memberships }] = await Promise.all([
      supabase.from("tribes").select("*").order("members_count", { ascending: false }),
      supabase.from("tribe_members").select("tribe_id").eq("user_id", user.id),
    ]);
    setTribes(allTribes || []);
    setMyTribeIds(new Set((memberships || []).map(m => m.tribe_id)));
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const createTribe = async () => {
    if (!user || !newTribe.name.trim()) return;
    const { data } = await supabase.from("tribes").insert({
      ...newTribe, creator_id: user.id,
    }).select().single();
    if (data) {
      await supabase.from("tribe_members").insert({ tribe_id: data.id, user_id: user.id, role: "creator" });
      toast.success("Племя создано!");
      setShowCreate(false);
      setNewTribe({ name: "", description: "", icon: "🔥", goal: "" });
      fetchData();
    }
  };

  const joinTribe = async (tribeId: string) => {
    if (!user) return;
    await supabase.from("tribe_members").insert({ tribe_id: tribeId, user_id: user.id });
    await supabase.from("tribes").update({ members_count: (tribes.find(t => t.id === tribeId)?.members_count || 0) + 1 }).eq("id", tribeId);
    toast.success("Вы вступили в племя");
    fetchData();
  };

  const leaveTribe = async (tribeId: string) => {
    if (!user) return;
    await supabase.from("tribe_members").delete().eq("tribe_id", tribeId).eq("user_id", user.id);
    await supabase.from("tribes").update({ members_count: Math.max((tribes.find(t => t.id === tribeId)?.members_count || 1) - 1, 0) }).eq("id", tribeId);
    toast.success("Вы покинули племя");
    setSelectedTribe(null);
    fetchData();
  };

  const selectTribe = async (tribe: Tribe) => {
    setSelectedTribe(tribe);
    const { data } = await supabase.from("tribe_members").select("user_id, role, joined_at").eq("tribe_id", tribe.id);
    if (data) {
      const userIds = data.map(m => m.user_id);
      const { data: profiles } = await supabase.from("public_profiles").select("user_id, display_name, avatar_url, level").in("user_id", userIds);
      const profileMap = new Map((profiles || []).map(p => [p.user_id, p]));
      setTribeMembers(data.map(m => ({ ...m, profile: profileMap.get(m.user_id) })));
    }
  };

  return (
    <div className="min-h-screen bg-background cyber-grid relative pb-20">
      <ParticleField />
      <div className="relative z-10 max-w-2xl mx-auto px-4 py-6 space-y-4">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" /> Племена
            </h1>
            <p className="text-[10px] text-muted-foreground font-mono">микро-сообщества с общими целями</p>
          </div>
          <motion.button whileTap={{ scale: 0.95 }} onClick={() => setShowCreate(!showCreate)}
            className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary hover:bg-primary/20 transition-colors">
            {showCreate ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          </motion.button>
        </motion.div>

        {/* Create Tribe */}
        <AnimatePresence>
          {showCreate && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <div className="glass-card rounded-2xl p-4 border border-primary/10 space-y-3">
                <input value={newTribe.name} onChange={e => setNewTribe(p => ({ ...p, name: e.target.value }))} placeholder="Название племени..."
                  className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground/50 outline-none" />
                <textarea value={newTribe.description} onChange={e => setNewTribe(p => ({ ...p, description: e.target.value }))} placeholder="Описание и миссия..."
                  className="w-full bg-transparent text-xs text-foreground/80 placeholder:text-muted-foreground/40 outline-none resize-none h-14" />
                <input value={newTribe.goal} onChange={e => setNewTribe(p => ({ ...p, goal: e.target.value }))} placeholder="Общая цель..."
                  className="w-full bg-transparent text-xs text-foreground/70 placeholder:text-muted-foreground/40 outline-none" />
                <div className="flex gap-1 flex-wrap">
                  {ICONS.map(ic => (
                    <button key={ic} onClick={() => setNewTribe(p => ({ ...p, icon: ic }))}
                      className={`w-8 h-8 rounded-lg text-base flex items-center justify-center transition-colors ${newTribe.icon === ic ? "bg-primary/20 ring-1 ring-primary/40" : "hover:bg-muted/30"}`}>
                      {ic}
                    </button>
                  ))}
                </div>
                <motion.button whileTap={{ scale: 0.95 }} onClick={createTribe}
                  className="w-full py-2 rounded-lg bg-primary/15 text-primary text-xs font-semibold hover:bg-primary/25 transition-colors">
                  Создать племя
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Selected Tribe Detail */}
        <AnimatePresence>
          {selectedTribe && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="glass-card rounded-2xl p-5 border border-primary/10">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{selectedTribe.icon}</span>
                  <div>
                    <h3 className="text-sm font-bold text-foreground">{selectedTribe.name}</h3>
                    <p className="text-[10px] text-muted-foreground font-mono">{selectedTribe.members_count} участников</p>
                  </div>
                </div>
                <button onClick={() => setSelectedTribe(null)} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
              </div>
              {selectedTribe.goal && (
                <div className="flex items-center gap-1.5 mb-3 p-2 rounded-lg bg-accent/5 border border-accent/10">
                  <Target className="w-3 h-3 text-accent" />
                  <p className="text-[10px] font-mono text-accent">{selectedTribe.goal}</p>
                </div>
              )}
              {selectedTribe.description && <p className="text-xs text-foreground/70 mb-3">{selectedTribe.description}</p>}
              <div className="space-y-1.5">
                {tribeMembers.map(m => (
                  <div key={m.user_id} className="flex items-center gap-2 p-2 rounded-lg bg-muted/10">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px]">
                      {m.profile?.avatar_url ? <img src={m.profile.avatar_url} className="w-6 h-6 rounded-full object-cover" /> : "👤"}
                    </div>
                    <span className="text-xs text-foreground flex-1">{m.profile?.display_name || "Нейронавт"}</span>
                    {m.role === "creator" && <Crown className="w-3 h-3 text-yellow-500" />}
                    <span className="text-[9px] font-mono text-muted-foreground">Lv.{m.profile?.level || 1}</span>
                  </div>
                ))}
              </div>
              {myTribeIds.has(selectedTribe.id) && (
                <motion.button whileTap={{ scale: 0.95 }} onClick={() => leaveTribe(selectedTribe.id)}
                  className="w-full mt-3 py-2 rounded-lg bg-destructive/10 text-destructive text-xs font-semibold hover:bg-destructive/20 transition-colors flex items-center justify-center gap-1.5">
                  <LogOut className="w-3 h-3" /> Покинуть племя
                </motion.button>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tribes List */}
        <div className="space-y-2">
          {tribes.map((tribe, i) => {
            const isMember = myTribeIds.has(tribe.id);
            return (
              <motion.div key={tribe.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className={`glass-card rounded-xl p-4 border cursor-pointer transition-colors ${isMember ? "border-primary/20" : "border-border/15 hover:border-primary/10"}`}
                onClick={() => selectTribe(tribe)}>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{tribe.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-semibold text-foreground truncate">{tribe.name}</p>
                      {isMember && <span className="text-[8px] font-mono text-primary bg-primary/10 px-1.5 py-0.5 rounded">участник</span>}
                    </div>
                    {tribe.goal && <p className="text-[10px] text-muted-foreground font-mono truncate mt-0.5">🎯 {tribe.goal}</p>}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-mono text-foreground">{tribe.members_count}</p>
                    <p className="text-[8px] text-muted-foreground font-mono">чел.</p>
                  </div>
                  {!isMember && (
                    <motion.button whileTap={{ scale: 0.9 }} onClick={e => { e.stopPropagation(); joinTribe(tribe.id); }}
                      className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary hover:bg-primary/20 transition-colors">
                      <LogIn className="w-3.5 h-3.5" />
                    </motion.button>
                  )}
                </div>
              </motion.div>
            );
          })}
          {tribes.length === 0 && (
            <div className="text-center py-12">
              <p className="text-sm text-muted-foreground">Племён пока нет</p>
              <p className="text-[10px] text-muted-foreground/50 font-mono mt-1">Создай первое!</p>
            </div>
          )}
        </div>

        {/* Heuristics Market */}
        <HeuristicsMarket />
      </div>
      <BottomNav />
    </div>
  );
};

export default TribesPage;

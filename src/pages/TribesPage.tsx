import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Users, Plus, X, LogIn, LogOut, Target, Crown, Trophy, TrendingUp, Flame, Swords, Award } from "lucide-react";
import { toast } from "sonner";
import ParticleField from "@/components/ParticleField";
import BottomNav from "@/components/BottomNav";
import HeuristicsMarket from "@/components/HeuristicsMarket";
import CommunityPulse from "@/components/CommunityPulse";

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

const RANK_BADGES = [
  { min: 0, label: "Новичок", color: "text-muted-foreground", bg: "bg-muted/20" },
  { min: 1000, label: "Бронза", color: "text-amber-600", bg: "bg-amber-500/10" },
  { min: 3000, label: "Серебро", color: "text-slate-400", bg: "bg-slate-400/10" },
  { min: 5000, label: "Золото", color: "text-yellow-500", bg: "bg-yellow-500/10" },
  { min: 8000, label: "Платина", color: "text-cyan-400", bg: "bg-cyan-400/10" },
  { min: 12000, label: "Легенда", color: "text-purple-400", bg: "bg-purple-400/10" },
];

const getRank = (xp: number) => {
  for (let i = RANK_BADGES.length - 1; i >= 0; i--) {
    if (xp >= RANK_BADGES[i].min) return RANK_BADGES[i];
  }
  return RANK_BADGES[0];
};

const TribesPage = () => {
  const { user } = useAuth();
  const [tribes, setTribes] = useState<Tribe[]>([]);
  const [myTribeIds, setMyTribeIds] = useState<Set<string>>(new Set());
  const [showCreate, setShowCreate] = useState(false);
  const [newTribe, setNewTribe] = useState({ name: "", description: "", icon: "🔥", goal: "" });
  const [selectedTribe, setSelectedTribe] = useState<Tribe | null>(null);
  const [tribeMembers, setTribeMembers] = useState<any[]>([]);
  const [view, setView] = useState<"all" | "mine" | "ranking">("all");
  const [challenges, setChallenges] = useState<any[]>([]);
  const [showNewChallenge, setShowNewChallenge] = useState(false);
  const [newChallengeTitle, setNewChallengeTitle] = useState("");

  const ICONS = ["🔥", "⚡", "🧠", "🌱", "💎", "🎯", "🦅", "🐉", "🌊", "☀️"];

  const fetchData = useCallback(async () => {
    if (!user) return;
    const [{ data: allTribes }, { data: memberships }] = await Promise.all([
      supabase.from("tribes").select("*").order("collective_xp", { ascending: false }),
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
    const [{ data: members }, { data: tribeChallenges }] = await Promise.all([
      supabase.from("tribe_members").select("user_id, role, joined_at").eq("tribe_id", tribe.id),
      supabase.from("tribe_challenges").select("*").eq("tribe_id", tribe.id).eq("is_active", true).order("created_at", { ascending: false }),
    ]);
    if (members) {
      const userIds = members.map(m => m.user_id);
      const { data: profiles } = await supabase.from("public_profiles").select("user_id, display_name, avatar_url, level").in("user_id", userIds);
      const profileMap = new Map((profiles || []).map(p => [p.user_id, p]));
      setTribeMembers(members.map(m => ({ ...m, profile: profileMap.get(m.user_id) })));
    }
    setChallenges(tribeChallenges || []);
  };

  const createChallenge = async () => {
    if (!user || !selectedTribe || !newChallengeTitle.trim()) return;
    const { data } = await supabase.from("tribe_challenges").insert({
      tribe_id: selectedTribe.id,
      title: newChallengeTitle.trim(),
      created_by: user.id,
    }).select().single();
    if (data) {
      // Auto-join
      await supabase.from("tribe_challenge_participants").insert({
        challenge_id: data.id,
        user_id: user.id,
      });
      setChallenges(prev => [data, ...prev]);
      setNewChallengeTitle("");
      setShowNewChallenge(false);
      toast.success("Вызов создан! 🏆");
    }
  };

  const joinChallenge = async (challengeId: string) => {
    if (!user) return;
    await supabase.from("tribe_challenge_participants").insert({
      challenge_id: challengeId,
      user_id: user.id,
    });
    toast.success("Вы приняли вызов!");
  };

  const displayTribes = view === "mine" ? tribes.filter(t => myTribeIds.has(t.id)) : tribes;
  const maxXp = Math.max(...tribes.map(t => t.collective_xp), 1);

  return (
    <div className="min-h-screen bg-background cyber-grid relative pb-20">
      <ParticleField />
      <div className="relative z-10 max-w-2xl mx-auto px-4 py-6 space-y-4">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" /> Племена
            </h1>
            <p className="text-[10px] text-muted-foreground font-mono">сообщества с общими целями</p>
          </div>
          <motion.button whileTap={{ scale: 0.95 }} onClick={() => setShowCreate(!showCreate)}
            className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary hover:bg-primary/20 transition-colors">
            {showCreate ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          </motion.button>
        </motion.div>

        {/* View tabs */}
        <div className="flex gap-1.5">
          {([
            { id: "all" as const, label: "Все", icon: Users },
            { id: "mine" as const, label: "Мои", icon: Flame },
            { id: "ranking" as const, label: "Рейтинг", icon: Trophy },
          ]).map(tab => (
            <motion.button key={tab.id} whileTap={{ scale: 0.95 }} onClick={() => setView(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-mono transition-all ${
                view === tab.id ? "bg-primary/15 text-primary border border-primary/25" : "text-muted-foreground hover:text-foreground bg-muted/10 border border-transparent"
              }`}>
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </motion.button>
          ))}
        </div>

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
              
              {/* Rank badge */}
              <div className="flex items-center gap-2 mb-3">
                {(() => {
                  const rank = getRank(selectedTribe.collective_xp);
                  return (
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${rank.bg} ${rank.color}`}>
                      <Trophy className="w-3 h-3 inline mr-1" />{rank.label} • {selectedTribe.collective_xp.toLocaleString()} XP
                    </span>
                  );
                })()}
              </div>

              {selectedTribe.goal && (
                <div className="flex items-center gap-1.5 mb-3 p-2 rounded-lg bg-accent/5 border border-accent/10">
                  <Target className="w-3 h-3 text-accent" />
                  <p className="text-[10px] font-mono text-accent">{selectedTribe.goal}</p>
                </div>
              )}
              {selectedTribe.description && <p className="text-xs text-foreground/70 mb-3">{selectedTribe.description}</p>}
              
              {/* Challenges section */}
              {myTribeIds.has(selectedTribe.id) && (
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <Swords className="w-3.5 h-3.5 text-primary" /> Вызовы
                    </h4>
                    <button onClick={() => setShowNewChallenge(!showNewChallenge)} className="text-[10px] text-primary hover:underline">
                      {showNewChallenge ? "Отмена" : "+ Создать"}
                    </button>
                  </div>
                  {showNewChallenge && (
                    <div className="flex gap-2 mb-2">
                      <input value={newChallengeTitle} onChange={e => setNewChallengeTitle(e.target.value)}
                        placeholder="Кто больше привычек за неделю?"
                        className="flex-1 bg-muted/10 rounded-lg px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/40 outline-none border border-border/20" />
                      <motion.button whileTap={{ scale: 0.95 }} onClick={createChallenge}
                        className="px-3 py-2 rounded-lg bg-primary/15 text-primary text-xs font-semibold">Go</motion.button>
                    </div>
                  )}
                  {challenges.length > 0 ? challenges.map(ch => (
                    <div key={ch.id} className="p-2.5 rounded-lg bg-muted/10 border border-border/10 mb-1.5 flex items-center gap-2">
                      <Award className="w-4 h-4 text-primary shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-foreground truncate">{ch.title}</p>
                        <p className="text-[9px] text-muted-foreground font-mono">
                          до {new Date(ch.end_date).toLocaleDateString("ru-RU", { day: "numeric", month: "short" })}
                        </p>
                      </div>
                      <motion.button whileTap={{ scale: 0.9 }} onClick={() => joinChallenge(ch.id)}
                        className="text-[10px] px-2 py-1 rounded bg-primary/10 text-primary font-semibold hover:bg-primary/20">
                        Принять
                      </motion.button>
                    </div>
                  )) : (
                    <p className="text-[10px] text-muted-foreground/50 text-center py-2">Пока нет активных вызовов</p>
                  )}
                </div>
              )}

              <div className="space-y-1.5">
                {tribeMembers.map(m => (
                  <div key={m.user_id} className="flex items-center gap-2 p-2 rounded-lg bg-muted/10">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px]">
                      {m.profile?.avatar_url ? <img src={m.profile.avatar_url} className="w-6 h-6 rounded-full object-cover" /> : "👤"}
                    </div>
                    <span className="text-xs text-foreground flex-1">{m.profile?.display_name || "Участник"}</span>
                    {m.role === "creator" && <Crown className="w-3 h-3 text-yellow-500" />}
                    <span className="text-[9px] font-mono text-muted-foreground">Lv.{m.profile?.level || 1}</span>
                  </div>
                ))}
              </div>
              {myTribeIds.has(selectedTribe.id) ? (
                <motion.button whileTap={{ scale: 0.95 }} onClick={() => leaveTribe(selectedTribe.id)}
                  className="w-full mt-3 py-2 rounded-lg bg-destructive/10 text-destructive text-xs font-semibold hover:bg-destructive/20 transition-colors flex items-center justify-center gap-1.5">
                  <LogOut className="w-3 h-3" /> Покинуть
                </motion.button>
              ) : (
                <motion.button whileTap={{ scale: 0.95 }} onClick={() => joinTribe(selectedTribe.id)}
                  className="w-full mt-3 py-2 rounded-lg bg-primary/15 text-primary text-xs font-semibold hover:bg-primary/25 transition-colors flex items-center justify-center gap-1.5">
                  <LogIn className="w-3 h-3" /> Вступить
                </motion.button>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Ranking View */}
        {view === "ranking" ? (
          <div className="space-y-2">
            <div className="glass-card rounded-2xl p-4 border border-accent/10 mb-2">
              <h3 className="text-xs font-semibold text-foreground flex items-center gap-2 mb-3">
                <Trophy className="w-4 h-4 text-accent" /> Рейтинг племён по опыту
              </h3>
              {tribes.map((tribe, i) => {
                const rank = getRank(tribe.collective_xp);
                const barWidth = (tribe.collective_xp / maxXp) * 100;
                return (
                  <motion.div key={tribe.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center gap-3 py-2 cursor-pointer hover:bg-muted/10 rounded-lg px-2 -mx-2 transition-colors"
                    onClick={() => selectTribe(tribe)}>
                    <span className={`text-xs font-mono w-5 text-center font-bold ${i < 3 ? "text-accent" : "text-muted-foreground/40"}`}>
                      {i + 1}
                    </span>
                    <span className="text-lg">{tribe.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-foreground truncate">{tribe.name}</span>
                        <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded ${rank.bg} ${rank.color}`}>{rank.label}</span>
                      </div>
                      <div className="h-1.5 bg-muted/30 rounded-full mt-1 overflow-hidden">
                        <motion.div className="h-full rounded-full bg-primary/40" initial={{ width: 0 }}
                          animate={{ width: `${barWidth}%` }} transition={{ duration: 0.8, delay: i * 0.1 }} />
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[10px] font-mono text-primary font-bold">{tribe.collective_xp.toLocaleString()}</p>
                      <p className="text-[8px] text-muted-foreground font-mono">{tribe.members_count} чел.</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        ) : (
          /* Tribes List */
          <div className="space-y-2">
            {displayTribes.map((tribe, i) => {
              const isMember = myTribeIds.has(tribe.id);
              const rank = getRank(tribe.collective_xp);
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
                        <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded ${rank.bg} ${rank.color}`}>{rank.label}</span>
                      </div>
                      {tribe.goal && <p className="text-[10px] text-muted-foreground font-mono truncate mt-0.5">🎯 {tribe.goal}</p>}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-mono text-foreground flex items-center gap-1">
                        <TrendingUp className="w-3 h-3 text-accent" /> {tribe.collective_xp.toLocaleString()}
                      </p>
                      <p className="text-[8px] text-muted-foreground font-mono">{tribe.members_count} чел.</p>
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
            {displayTribes.length === 0 && (
              <div className="text-center py-12">
                <p className="text-sm text-muted-foreground">{view === "mine" ? "Вы ещё не вступили в племя" : "Племён пока нет"}</p>
                <p className="text-[10px] text-muted-foreground/50 font-mono mt-1">{view === "mine" ? "Присоединитесь к сообществу!" : "Создайте первое!"}</p>
              </div>
            )}
          </div>
        )}

        {/* Community Pulse */}
        <CommunityPulse />

        {/* Heuristics Market */}
        <HeuristicsMarket />
      </div>
      <BottomNav />
    </div>
  );
};

export default TribesPage;

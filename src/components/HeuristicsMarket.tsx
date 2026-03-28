import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Package, ThumbsUp, Plus, X, Share2 } from "lucide-react";
import { toast } from "sonner";

interface Heuristic {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  category: string;
  tags: string[];
  upvotes: number;
  downloads: number;
  is_public: boolean;
  created_at: string;
}

const CATEGORIES = [
  { id: "habit", label: "Привычки", emoji: "⚡" },
  { id: "mindset", label: "Мышление", emoji: "🧠" },
  { id: "health", label: "Здоровье", emoji: "🧘" },
  { id: "social", label: "Социум", emoji: "👥" },
  { id: "productivity", label: "Продуктивность", emoji: "🎯" },
];

const HeuristicsMarket = () => {
  const { user } = useAuth();
  const [heuristics, setHeuristics] = useState<Heuristic[]>([]);
  const [myHeuristics, setMyHeuristics] = useState<Heuristic[]>([]);
  const [upvoted, setUpvoted] = useState<Set<string>>(new Set());
  const [showCreate, setShowCreate] = useState(false);
  const [tab, setTab] = useState<"market" | "mine">("market");
  const [newH, setNewH] = useState({ title: "", description: "", category: "habit" });

  const fetchData = useCallback(async () => {
    if (!user) return;
    const [{ data: pub }, { data: mine }, { data: votes }] = await Promise.all([
      supabase.from("heuristics").select("*").eq("is_public", true).order("upvotes", { ascending: false }).limit(50),
      supabase.from("heuristics").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("heuristic_upvotes").select("heuristic_id").eq("user_id", user.id),
    ]);
    setHeuristics(pub || []);
    setMyHeuristics(mine || []);
    setUpvoted(new Set((votes || []).map(v => v.heuristic_id)));
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const createHeuristic = async () => {
    if (!user || !newH.title.trim()) return;
    await supabase.from("heuristics").insert({ ...newH, user_id: user.id });
    setNewH({ title: "", description: "", category: "habit" });
    setShowCreate(false);
    toast.success("Эвристика создана");
    fetchData();
  };

  const toggleUpvote = async (id: string) => {
    if (!user) return;
    if (upvoted.has(id)) {
      await supabase.from("heuristic_upvotes").delete().eq("heuristic_id", id).eq("user_id", user.id);
      setUpvoted(prev => { const s = new Set(prev); s.delete(id); return s; });
      setHeuristics(prev => prev.map(h => h.id === id ? { ...h, upvotes: h.upvotes - 1 } : h));
    } else {
      await supabase.from("heuristic_upvotes").insert({ heuristic_id: id, user_id: user.id });
      setUpvoted(prev => new Set(prev).add(id));
      setHeuristics(prev => prev.map(h => h.id === id ? { ...h, upvotes: h.upvotes + 1 } : h));
    }
  };

  const publishHeuristic = async (id: string) => {
    await supabase.from("heuristics").update({ is_public: true }).eq("id", id);
    toast.success("Эвристика опубликована");
    fetchData();
  };

  return (
    <div className="glass-card rounded-2xl p-5 border border-primary/10">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Package className="w-4 h-4 text-primary" />
          Экономика эвристик
        </h3>
        <motion.button whileTap={{ scale: 0.95 }} onClick={() => setShowCreate(!showCreate)}
          className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary hover:bg-primary/20 transition-colors">
          {showCreate ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
        </motion.button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-3">
        {(["market", "mine"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-3 py-1 rounded-lg text-[11px] font-mono transition-colors ${tab === t ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground"}`}>
            {t === "market" ? "🏪 Маркет" : "📦 Мои"}
          </button>
        ))}
      </div>

      {/* Create form */}
      <AnimatePresence>
        {showCreate && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mb-3">
            <div className="p-3 rounded-xl bg-muted/20 border border-border/20 space-y-2">
              <input value={newH.title} onChange={e => setNewH(p => ({ ...p, title: e.target.value }))} placeholder="Название паттерна..."
                className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground/50 outline-none" />
              <textarea value={newH.description} onChange={e => setNewH(p => ({ ...p, description: e.target.value }))} placeholder="Описание: что делать, когда и зачем..."
                className="w-full bg-transparent text-xs text-foreground/80 placeholder:text-muted-foreground/40 outline-none resize-none h-16" />
              <div className="flex gap-1 flex-wrap">
                {CATEGORIES.map(c => (
                  <button key={c.id} onClick={() => setNewH(p => ({ ...p, category: c.id }))}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors ${newH.category === c.id ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground"}`}>
                    {c.emoji} {c.label}
                  </button>
                ))}
              </div>
              <motion.button whileTap={{ scale: 0.95 }} onClick={createHeuristic}
                className="w-full py-2 rounded-lg bg-primary/15 text-primary text-xs font-semibold hover:bg-primary/25 transition-colors">
                Создать эвристику
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* List */}
      <div className="space-y-2 max-h-80 overflow-y-auto">
        {(tab === "market" ? heuristics : myHeuristics).map((h, i) => {
          const cat = CATEGORIES.find(c => c.id === h.category);
          return (
            <motion.div key={h.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
              className="p-3 rounded-xl bg-muted/10 border border-border/15 hover:border-primary/20 transition-colors">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-foreground truncate">{h.title}</p>
                  {h.description && <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">{h.description}</p>}
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-[9px] font-mono text-muted-foreground/60">{cat?.emoji} {cat?.label}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {tab === "mine" && !h.is_public && (
                    <motion.button whileTap={{ scale: 0.9 }} onClick={() => publishHeuristic(h.id)}
                      className="w-7 h-7 rounded-lg bg-accent/10 flex items-center justify-center text-accent hover:bg-accent/20 transition-colors" title="Опубликовать">
                      <Share2 className="w-3 h-3" />
                    </motion.button>
                  )}
                  <motion.button whileTap={{ scale: 0.9 }} onClick={() => toggleUpvote(h.id)}
                    className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-mono transition-colors ${upvoted.has(h.id) ? "bg-primary/20 text-primary" : "bg-muted/20 text-muted-foreground hover:text-foreground"}`}>
                    <ThumbsUp className="w-3 h-3" /> {h.upvotes}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          );
        })}
        {(tab === "market" ? heuristics : myHeuristics).length === 0 && (
          <p className="text-[11px] text-muted-foreground/50 font-mono text-center py-6">
            {tab === "market" ? "Пока нет публичных эвристик" : "Создай свою первую эвристику"}
          </p>
        )}
      </div>
    </div>
  );
};

export default HeuristicsMarket;

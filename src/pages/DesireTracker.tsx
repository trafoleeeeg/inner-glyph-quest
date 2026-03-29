import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Star, Check, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface Desire {
  id: string;
  title: string;
  description: string | null;
  priority: number;
  is_fulfilled: boolean;
  created_at: string;
}

const DesireTracker = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [desires, setDesires] = useState<Desire[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState(3);

  useEffect(() => {
    if (!user) return;
    supabase.from("desires").select("*").eq("user_id", user.id).order("created_at", { ascending: false })
      .then(({ data }) => setDesires(data || []));
  }, [user]);

  const addDesire = async () => {
    if (!user || !title.trim()) return;
    const { data } = await supabase.from("desires").insert({
      user_id: user.id, title: title.trim(),
      description: description.trim() || null, priority,
    }).select().single();
    if (data) {
      setDesires(prev => [data, ...prev]);
      setTitle(""); setDescription(""); setPriority(3); setShowAdd(false);
      toast.success("+20 XP", { description: "Цель добавлена" });
      await supabase.rpc('award_activity_xp', { p_amount: 20, p_activity: 'desire' });
    }
  };

  const toggleFulfill = async (id: string, current: boolean) => {
    await supabase.from("desires").update({
      is_fulfilled: !current, fulfilled_at: !current ? new Date().toISOString() : null,
    }).eq("id", id);
    setDesires(prev => prev.map(d => d.id === id ? { ...d, is_fulfilled: !current } : d));
    if (!current) toast.success("🎯 Цель достигнута!", { duration: 3000 });
  };

  const deleteDesire = async (id: string) => {
    await supabase.from("desires").delete().eq("id", id);
    setDesires(prev => prev.filter(d => d.id !== id));
  };

  const priorityColors = ['', 'text-muted-foreground', 'text-accent', 'text-energy', 'text-streak', 'text-destructive'];

  return (
    <div className="min-h-screen bg-background relative">
      
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => navigate("/")}
            className="w-9 h-9 rounded-xl bg-muted/50 border border-border/50 flex items-center justify-center text-muted-foreground hover:text-foreground transition-all">
            <ArrowLeft className="w-4 h-4" />
          </motion.button>
          <div>
            <h1 className="text-lg font-bold text-foreground">🎯 Мои цели</h1>
            <p className="text-[10px] text-muted-foreground font-mono">к чему ты стремишься?</p>
          </div>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setShowAdd(!showAdd)}
            className="ml-auto w-9 h-9 rounded-xl bg-secondary/20 border border-secondary/30 flex items-center justify-center text-secondary hover:bg-secondary/30 transition-all">
            <Plus className="w-4 h-4" />
          </motion.button>
        </motion.div>

        {showAdd && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
            className="glass-card rounded-2xl p-5 border border-secondary/10">
            <input placeholder="Моя цель..." value={title} onChange={e => setTitle(e.target.value)}
              className="w-full bg-muted/30 border border-border/50 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground mb-3 focus:outline-none focus:border-secondary/50" />
            <textarea placeholder="Подробности (опционально)" value={description} onChange={e => setDescription(e.target.value)}
              className="w-full bg-muted/30 border border-border/50 rounded-xl p-3 text-sm text-foreground placeholder:text-muted-foreground resize-none h-16 mb-3 focus:outline-none focus:border-secondary/50" />
            <div className="mb-3">
              <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider mb-2">Важность</p>
              <div className="flex gap-1">
                {[1,2,3,4,5].map(p => (
                  <motion.button key={p} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => setPriority(p)}
                    className={`flex-1 py-2 rounded-lg transition-all ${p <= priority ? 'bg-secondary/20 border border-secondary/30' : 'bg-muted/30 border border-transparent'}`}>
                    <Star className={`w-4 h-4 mx-auto ${p <= priority ? 'text-secondary' : 'text-muted-foreground/30'}`} />
                  </motion.button>
                ))}
              </div>
            </div>
            <motion.button onClick={addDesire} disabled={!title.trim()} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              className="w-full bg-gradient-to-r from-secondary/20 to-dream/20 text-secondary border border-secondary/20 rounded-xl py-2.5 text-sm font-semibold transition-all disabled:opacity-30">
              Добавить цель
            </motion.button>
          </motion.div>
        )}

        <div className="space-y-2">
          {desires.map((d, i) => (
            <motion.div key={d.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`glass-card rounded-xl p-4 border transition-all ${d.is_fulfilled ? 'border-accent/20 opacity-60' : 'border-secondary/10'}`}>
              <div className="flex items-center gap-3">
                <motion.button whileTap={{ scale: 0.8 }} onClick={() => toggleFulfill(d.id, d.is_fulfilled)}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${d.is_fulfilled ? 'bg-accent/20 border border-accent/30' : 'bg-muted/50 border border-border/50'}`}>
                  {d.is_fulfilled ? <Check className="w-4 h-4 text-accent" /> : <span className="text-sm">🎯</span>}
                </motion.button>
                <div className="flex-1 min-w-0">
                  <h3 className={`text-sm font-semibold ${d.is_fulfilled ? 'line-through text-muted-foreground' : 'text-foreground'}`}>{d.title}</h3>
                  {d.description && <p className="text-xs text-muted-foreground truncate">{d.description}</p>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <div className="flex gap-0.5">
                    {[1,2,3,4,5].map(p => (
                      <Star key={p} className={`w-3 h-3 ${p <= d.priority ? priorityColors[d.priority] : 'text-muted-foreground/10'}`} />
                    ))}
                  </div>
                  <button onClick={() => deleteDesire(d.id)} className="text-muted-foreground/30 hover:text-destructive transition-colors">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
          {desires.length === 0 && (
            <div className="text-center py-12 text-muted-foreground text-sm">
              <p className="text-3xl mb-2">🎯</p>
              <p>Добавь свою первую цель</p>
              <p className="text-[10px] font-mono mt-1 text-muted-foreground/50">
                цель = направление роста
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DesireTracker;

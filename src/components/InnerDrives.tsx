import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, Scale, Heart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface Drive {
  id: string;
  name: string;
  icon: string;
  color: string;
  strength: number;
  description: string | null;
}

const DRIVE_PRESETS = [
  { name: "Достигатор", icon: "🎯", color: "primary", description: "Карьера, цели, результаты" },
  { name: "Гедонист", icon: "🎉", color: "energy", description: "Удовольствие, отдых, свобода" },
  { name: "Мыслитель", icon: "🧠", color: "secondary", description: "Знание, анализ, глубина" },
  { name: "Хранитель", icon: "🛡️", color: "accent", description: "Безопасность, стабильность" },
  { name: "Творец", icon: "🎨", color: "dream", description: "Креативность, самовыражение" },
  { name: "Аскет", icon: "🧘", color: "streak", description: "Дисциплина, контроль, чистота" },
];

const colorMap: Record<string, string> = {
  primary: "hsl(180, 100%, 50%)",
  energy: "hsl(45, 100%, 55%)",
  secondary: "hsl(260, 80%, 60%)",
  accent: "hsl(140, 70%, 50%)",
  dream: "hsl(270, 80%, 65%)",
  streak: "hsl(25, 95%, 55%)",
};

const InnerDrives = () => {
  const { user } = useAuth();
  const [drives, setDrives] = useState<Drive[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchDrives = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from("inner_drives").select("*").eq("user_id", user.id).order("created_at");
    setDrives((data as Drive[]) || []);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchDrives(); }, [fetchDrives]);

  const addDrive = async (preset: typeof DRIVE_PRESETS[0]) => {
    if (!user) return;
    const { error } = await supabase.from("inner_drives").insert({
      user_id: user.id, name: preset.name, icon: preset.icon, color: preset.color, description: preset.description, strength: 50,
    });
    if (!error) {
      toast.success(`«${preset.name}» добавлен`);
      fetchDrives();
      setShowAdd(false);
    }
  };

  const updateStrength = async (id: string, strength: number) => {
    await supabase.from("inner_drives").update({ strength, updated_at: new Date().toISOString() }).eq("id", id);
    setDrives(prev => prev.map(d => d.id === id ? { ...d, strength } : d));
  };

  const removeDrive = async (id: string) => {
    await supabase.from("inner_drives").delete().eq("id", id);
    setDrives(prev => prev.filter(d => d.id !== id));
    toast.success("Сторона убрана");
  };

  const balanceScore = drives.length >= 2
    ? (() => {
        const avg = drives.reduce((s, d) => s + d.strength, 0) / drives.length;
        const variance = drives.reduce((s, d) => s + Math.pow(d.strength - avg, 2), 0) / drives.length;
        return Math.round((1 - Math.min(variance / 2500, 1)) * 100);
      })()
    : 0;

  const dominantDrive = drives.length > 0 ? drives.reduce((a, b) => a.strength > b.strength ? a : b) : null;
  const weakestDrive = drives.length > 0 ? drives.reduce((a, b) => a.strength < b.strength ? a : b) : null;
  const imbalanced = dominantDrive && weakestDrive && (dominantDrive.strength - weakestDrive.strength) > 40;

  if (loading) {
    return (
      <div className="glass-card rounded-2xl p-6 border border-secondary/10">
        <div className="flex justify-center py-8">
          <div className="w-6 h-6 border-2 border-secondary/30 border-t-secondary rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-2xl p-5 border border-secondary/10">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Heart className="w-4 h-4 text-secondary" /> Стороны личности
          </h3>
          <p className="text-[10px] text-muted-foreground font-mono mt-0.5">
            найди баланс между своими внутренними сторонами
          </p>
        </div>
        {drives.length >= 2 && (
          <div className="text-right">
            <div className="flex items-center gap-1">
              <Scale className="w-3 h-3 text-secondary" />
              <p className="text-xl font-bold font-mono text-secondary">{balanceScore}%</p>
            </div>
            <p className="text-[9px] text-muted-foreground font-mono">гармония</p>
          </div>
        )}
      </div>

      {drives.length === 0 ? (
        <div className="text-center py-6">
          <p className="text-xs text-muted-foreground mb-3">
            Добавь свои внутренние стороны — части тебя, которые тянут в разные стороны
          </p>
          <motion.button whileTap={{ scale: 0.95 }} onClick={() => setShowAdd(true)}
            className="px-4 py-2 rounded-xl bg-secondary/20 text-secondary text-xs font-mono border border-secondary/20 hover:bg-secondary/30 transition-colors">
            <Plus className="w-3 h-3 inline mr-1" /> Добавить
          </motion.button>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {drives.map((drive, i) => (
              <motion.div key={drive.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className="group">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{drive.icon}</span>
                    <span className="text-xs font-semibold text-foreground">{drive.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono" style={{ color: colorMap[drive.color] || colorMap.primary }}>{drive.strength}%</span>
                    <button onClick={() => removeDrive(drive.id)} className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground/30 hover:text-destructive">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                <input type="range" min={0} max={100} value={drive.strength}
                  onChange={e => updateStrength(drive.id, Number(e.target.value))}
                  className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, ${colorMap[drive.color] || colorMap.primary} 0%, ${colorMap[drive.color] || colorMap.primary} ${drive.strength}%, hsl(220, 15%, 18%) ${drive.strength}%, hsl(220, 15%, 18%) 100%)`,
                  }}
                />
                {drive.description && <p className="text-[9px] text-muted-foreground/50 font-mono mt-0.5">{drive.description}</p>}
              </motion.div>
            ))}
          </div>

          {imbalanced && dominantDrive && weakestDrive && (
            <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
              className="mt-3 p-3 rounded-xl bg-destructive/5 border border-destructive/10">
              <p className="text-[10px] text-destructive/80 font-mono">
                ⚠ Перекос: «{dominantDrive.name}» ({dominantDrive.strength}%) доминирует над «{weakestDrive.name}» ({weakestDrive.strength}%). Уделите внимание балансу.
              </p>
            </motion.div>
          )}

          {balanceScore > 70 && drives.length >= 2 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-3 p-3 rounded-xl bg-accent/5 border border-accent/10">
              <p className="text-[10px] text-accent/80 font-mono">✦ Отличная гармония: {balanceScore}%. Баланс сторон личности на высоте!</p>
            </motion.div>
          )}

          {drives.length < 6 && (
            <motion.button whileTap={{ scale: 0.95 }} onClick={() => setShowAdd(true)}
              className="mt-3 w-full py-2 rounded-xl border border-dashed border-secondary/20 text-xs font-mono text-muted-foreground hover:text-secondary hover:border-secondary/40 transition-colors">
              <Plus className="w-3 h-3 inline mr-1" /> Ещё сторона
            </motion.button>
          )}
        </>
      )}

      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
            className="mt-3 p-3 rounded-xl bg-muted/30 border border-secondary/10 space-y-2">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs font-semibold text-foreground">Выбери сторону</p>
              <button onClick={() => setShowAdd(false)} className="text-muted-foreground hover:text-foreground"><X className="w-3.5 h-3.5" /></button>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {DRIVE_PRESETS.filter(p => !drives.some(d => d.name === p.name)).map(preset => (
                <motion.button key={preset.name} whileTap={{ scale: 0.95 }} onClick={() => addDrive(preset)}
                  className="flex items-center gap-2 p-2.5 rounded-xl bg-muted/20 border border-border/30 hover:border-secondary/30 transition-colors text-left">
                  <span className="text-lg">{preset.icon}</span>
                  <div>
                    <p className="text-xs font-semibold text-foreground">{preset.name}</p>
                    <p className="text-[9px] text-muted-foreground">{preset.description}</p>
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default InnerDrives;

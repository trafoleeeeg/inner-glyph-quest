import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X } from "lucide-react";

const CATEGORIES = [
  { value: 'habit', label: 'Ритуал', icon: '🔄' },
  { value: 'health', label: 'Каркас', icon: '💪' },
  { value: 'mood', label: 'Сканер', icon: '📡' },
  { value: 'dream', label: 'Синхр.', icon: '🌙' },
  { value: 'desire', label: 'Вектор', icon: '✨' },
  { value: 'custom', label: 'Своё', icon: '⚡' },
];

interface CreateMissionProps {
  onSubmit: (data: { title: string; description: string; category: string; icon: string; xp_reward: number }) => void;
}

const CreateMission = ({ onSubmit }: CreateMissionProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("habit");
  const [icon, setIcon] = useState("⚡");
  const [xpReward, setXpReward] = useState(20);

  const handleSubmit = () => {
    if (!title.trim()) return;
    onSubmit({ title: title.trim(), description: description.trim(), category, icon, xp_reward: xpReward });
    setTitle(""); setDescription(""); setCategory("habit"); setIcon("⚡"); setXpReward(20);
    setIsOpen(false);
  };

  const xpOptions = [10, 15, 20, 25, 30, 35, 40, 50];
  const iconOptions = ['⚡', '🧘', '💪', '📖', '🎯', '🧊', '🏃', '✍️', '🧠', '💧', '🌅', '📝'];

  return (
    <div>
      <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setIsOpen(!isOpen)}
        className="w-full glass-card rounded-xl p-3 border border-dashed border-primary/20 flex items-center justify-center gap-2 text-primary/60 hover:text-primary hover:border-primary/40 transition-all">
        {isOpen ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
        <span className="text-sm font-semibold">{isOpen ? 'Отмена' : 'Создать протокол'}</span>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-2">
            <div className="glass-card rounded-2xl p-5 border border-primary/10 space-y-3">
              <input placeholder="Название протокола" value={title} onChange={e => setTitle(e.target.value)}
                className="w-full bg-muted/30 border border-border/50 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50" />
              <input placeholder="Описание (опционально)" value={description} onChange={e => setDescription(e.target.value)}
                className="w-full bg-muted/30 border border-border/50 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50" />

              <div>
                <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider mb-2">Тип</p>
                <div className="grid grid-cols-3 gap-1">
                  {CATEGORIES.map(c => (
                    <button key={c.value} onClick={() => { setCategory(c.value); setIcon(c.icon); }}
                      className={`py-2 px-2 rounded-lg text-xs font-semibold transition-all ${
                        category === c.value ? 'bg-primary/20 text-primary border border-primary/30' : 'bg-muted/30 text-muted-foreground hover:bg-muted/50 border border-transparent'
                      }`}>{c.icon} {c.label}</button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider mb-2">Иконка</p>
                <div className="flex flex-wrap gap-1">
                  {iconOptions.map(ic => (
                    <button key={ic} onClick={() => setIcon(ic)}
                      className={`w-9 h-9 rounded-lg text-lg flex items-center justify-center transition-all ${
                        icon === ic ? 'bg-primary/20 border border-primary/30' : 'bg-muted/30 hover:bg-muted/50 border border-transparent'
                      }`}>{ic}</button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider mb-2">Негэнтропия</p>
                <div className="flex flex-wrap gap-1">
                  {xpOptions.map(xp => (
                    <button key={xp} onClick={() => setXpReward(xp)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                        xpReward === xp ? 'bg-accent/20 text-accent border border-accent/30' : 'bg-muted/30 text-muted-foreground hover:bg-muted/50 border border-transparent'
                      }`}>{xp}</button>
                  ))}
                </div>
              </div>

              <motion.button onClick={handleSubmit} disabled={!title.trim()} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                className="w-full bg-gradient-to-r from-primary/20 to-accent/20 text-primary border border-primary/20 rounded-xl py-2.5 text-sm font-semibold transition-all disabled:opacity-30">
                Активировать протокол
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CreateMission;

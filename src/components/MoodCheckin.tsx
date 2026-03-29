import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const moods = [
  { emoji: '😫', label: 'Плохо', value: 1, color: 'text-destructive' },
  { emoji: '😕', label: 'Так себе', value: 2, color: 'text-streak' },
  { emoji: '😐', label: 'Нормально', value: 3, color: 'text-muted-foreground' },
  { emoji: '😊', label: 'Хорошо', value: 4, color: 'text-primary' },
  { emoji: '🔥', label: 'Отлично', value: 5, color: 'text-primary' },
];

const energyLevels = [
  { emoji: '🪫', label: '1', value: 1 },
  { emoji: '🔋', label: '2', value: 2 },
  { emoji: '⚡', label: '3', value: 3 },
  { emoji: '💥', label: '4', value: 4 },
  { emoji: '🚀', label: '5', value: 5 },
];

interface MoodCheckinProps {
  onSubmit: (mood: number, energy: number, note: string) => void;
}

const MoodCheckin = ({ onSubmit }: MoodCheckinProps) => {
  const [selectedMood, setSelectedMood] = useState<number | null>(null);
  const [selectedEnergy, setSelectedEnergy] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (selectedMood !== null && selectedEnergy !== null) {
      onSubmit(selectedMood, selectedEnergy, note);
      setSubmitted(true);
    }
  };

  if (submitted) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="glass-card rounded-2xl p-6 border border-accent/20 text-center">
        <motion.span className="text-4xl block mb-2" animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 0.5 }}>✓</motion.span>
        <p className="text-accent text-sm font-semibold">Настроение записано</p>
        <p className="text-xs text-muted-foreground mt-1 font-mono">+15 XP</p>
      </motion.div>
    );
  }

  return (
    <div className="glass-card rounded-2xl p-5">
      <h3 className="text-sm font-semibold mb-1 flex items-center gap-2">
        Как ты сейчас?
      </h3>
      <p className="text-[9px] text-muted-foreground/60 font-mono mb-3 leading-relaxed">
        Данные → паттерны → точные рекомендации
      </p>
      
      <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider mb-2">Настроение</p>
      <div className="flex justify-between mb-4 gap-1">
        {moods.map((m) => (
          <motion.button key={m.value} onClick={() => setSelectedMood(m.value)}
            className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all flex-1 ${
              selectedMood === m.value ? 'bg-primary/10 border border-primary/30' : 'hover:bg-muted/50 border border-transparent'
            }`} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.9 }}>
            <span className="text-xl">{m.emoji}</span>
            <span className="text-[9px] text-muted-foreground font-mono">{m.label}</span>
          </motion.button>
        ))}
      </div>

      <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider mb-2">Энергия</p>
      <div className="flex justify-between mb-4 gap-1">
        {energyLevels.map((e) => (
          <motion.button key={e.value} onClick={() => setSelectedEnergy(e.value)}
            className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all flex-1 ${
              selectedEnergy === e.value ? 'bg-primary/15 border border-primary/30' : 'hover:bg-muted/50 border border-transparent'
            }`} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.9 }}>
            <span className="text-xl">{e.emoji}</span>
            <span className="text-[9px] text-muted-foreground font-mono">{e.label}</span>
          </motion.button>
        ))}
      </div>

      <AnimatePresence>
        {selectedMood !== null && selectedEnergy !== null && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
            <textarea placeholder="Что повлияло? (опционально)" value={note} onChange={(e) => setNote(e.target.value)}
              className="w-full bg-muted/30 border border-border/50 rounded-xl p-3 text-sm text-foreground placeholder:text-muted-foreground resize-none h-16 mb-3 focus:outline-none focus:border-energy/50 transition-all" />
            <motion.button onClick={handleSubmit} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              className="w-full bg-primary text-primary-foreground rounded-xl py-2.5 text-sm font-semibold transition-all">
              Записать настроение
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MoodCheckin;

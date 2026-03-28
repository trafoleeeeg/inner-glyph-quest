import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const moods = [
  { emoji: '😫', label: 'Тяжело', value: 1 },
  { emoji: '😕', label: 'Так себе', value: 2 },
  { emoji: '😐', label: 'Норм', value: 3 },
  { emoji: '😊', label: 'Хорошо', value: 4 },
  { emoji: '🔥', label: 'Огонь', value: 5 },
];

interface MoodCheckinProps {
  onSubmit: (mood: number, note: string) => void;
}

const MoodCheckin = ({ onSubmit }: MoodCheckinProps) => {
  const [selected, setSelected] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (selected !== null) {
      onSubmit(selected, note);
      setSubmitted(true);
    }
  };

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass rounded-lg p-6 border border-accent/20 text-center"
      >
        <p className="text-accent text-lg font-semibold">✓ Записано</p>
        <p className="text-xs text-muted-foreground mt-1 font-mono">+15 XP</p>
      </motion.div>
    );
  }

  return (
    <div className="glass rounded-lg p-4 border border-energy/20">
      <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
        <span className="text-energy">💫</span> Как ты сейчас?
      </h3>
      <div className="flex justify-between mb-3">
        {moods.map((m) => (
          <motion.button
            key={m.value}
            onClick={() => setSelected(m.value)}
            className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-all ${
              selected === m.value
                ? 'bg-energy/20 border border-energy/40'
                : 'hover:bg-muted'
            }`}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <span className="text-2xl">{m.emoji}</span>
            <span className="text-[10px] text-muted-foreground font-mono">{m.label}</span>
          </motion.button>
        ))}
      </div>
      <AnimatePresence>
        {selected !== null && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <textarea
              placeholder="Что повлияло на настроение? (опционально)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full bg-muted border border-border rounded-lg p-2 text-sm text-foreground placeholder:text-muted-foreground resize-none h-16 mb-2 focus:outline-none focus:border-energy/50"
            />
            <button
              onClick={handleSubmit}
              className="w-full bg-energy/20 hover:bg-energy/30 text-energy border border-energy/30 rounded-lg py-2 text-sm font-semibold transition-all"
            >
              Записать +15 XP
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MoodCheckin;

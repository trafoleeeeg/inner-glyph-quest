import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Moon, Plus, X, Star } from "lucide-react";

interface DreamJournalProps {
  onSubmit: (title: string, description: string, lucidity: number) => void;
}

const DreamJournal = ({ onSubmit }: DreamJournalProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [lucidity, setLucidity] = useState(1);

  const handleSubmit = () => {
    if (title.trim()) {
      onSubmit(title, description, lucidity);
      setTitle(""); setDescription(""); setLucidity(1); setIsOpen(false);
    }
  };

  return (
    <div className="glass-card rounded-2xl border border-dream/10 overflow-hidden">
      <button onClick={() => setIsOpen(!isOpen)}
        className="w-full p-5 flex items-center justify-between hover:bg-dream/5 transition-colors">
        <div className="flex items-center gap-2">
          <Moon className="w-4 h-4 text-dream" />
          <span className="text-sm font-semibold">Дневник снов</span>
        </div>
        <motion.div animate={{ rotate: isOpen ? 45 : 0 }}>
          {isOpen ? <X className="w-4 h-4 text-muted-foreground" /> : <Plus className="w-4 h-4 text-dream" />}
        </motion.div>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="px-5 pb-5">
            <p className="text-[10px] text-muted-foreground font-mono mb-2">
              Записывай сны — мозг обрабатывает важное во время сна.
            </p>
            <input placeholder="Что тебе приснилось?" value={title} onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-muted/30 border border-border/50 rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground mb-3 focus:outline-none focus:border-dream/50 transition-all" />
            <textarea placeholder="Опиши подробности сна..." value={description} onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-muted/30 border border-border/50 rounded-xl p-3 text-sm text-foreground placeholder:text-muted-foreground resize-none h-24 mb-3 focus:outline-none focus:border-dream/50 transition-all" />
            
            <div className="mb-3">
              <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider mb-2">Яркость сна</p>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((l) => (
                  <motion.button key={l} onClick={() => setLucidity(l)} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                    className={`flex-1 py-2 rounded-lg transition-all ${
                      l <= lucidity ? 'bg-dream/20 border border-dream/30' : 'bg-muted/30 border border-transparent'
                    }`}>
                    <Star className={`w-4 h-4 mx-auto ${l <= lucidity ? 'text-dream' : 'text-muted-foreground/30'}`} />
                  </motion.button>
                ))}
              </div>
            </div>

            <motion.button onClick={handleSubmit} disabled={!title.trim()} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              className="w-full bg-accent text-accent-foreground rounded-xl py-2.5 text-sm font-semibold transition-all disabled:opacity-30 disabled:cursor-not-allowed">
              Записать сон
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DreamJournal;

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
    <div className="py-4 border-b border-border">
      <button onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Moon className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-semibold text-foreground">Дневник снов</span>
        </div>
        <motion.div animate={{ rotate: isOpen ? 45 : 0 }}>
          {isOpen ? <X className="w-4 h-4 text-muted-foreground" /> : <Plus className="w-4 h-4 text-muted-foreground" />}
        </motion.div>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }}
            className="mt-3">
            <p className="text-[10px] text-muted-foreground font-mono mb-2">
              Записывай сны — мозг обрабатывает важное во время сна.
            </p>
            <input placeholder="Что тебе приснилось?" value={title} onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground mb-3 focus:outline-none focus:border-foreground/20" />
            <textarea placeholder="Подробности..." value={description} onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-muted border border-border rounded-xl p-3 text-sm text-foreground placeholder:text-muted-foreground resize-none h-20 mb-3 focus:outline-none focus:border-foreground/20" />
            
            <div className="mb-3">
              <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider mb-2">Яркость</p>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((l) => (
                  <button key={l} onClick={() => setLucidity(l)}
                    className={`flex-1 py-2 rounded-lg transition-all ${
                      l <= lucidity ? 'bg-muted border border-foreground/20' : 'bg-transparent border border-transparent'
                    }`}>
                    <Star className={`w-4 h-4 mx-auto ${l <= lucidity ? 'text-foreground' : 'text-muted-foreground/30'}`} />
                  </button>
                ))}
              </div>
            </div>

            <button onClick={handleSubmit} disabled={!title.trim()}
              className="w-full bg-foreground text-background rounded-xl py-2.5 text-sm font-semibold disabled:opacity-30 disabled:cursor-not-allowed">
              Записать сон
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DreamJournal;

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Moon, Plus, X } from "lucide-react";

interface DreamJournalProps {
  onSubmit: (title: string, description: string) => void;
}

const DreamJournal = ({ onSubmit }: DreamJournalProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = () => {
    if (title.trim()) {
      onSubmit(title, description);
      setTitle("");
      setDescription("");
      setIsOpen(false);
    }
  };

  return (
    <div className="glass rounded-lg border border-dream/20 overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-4 flex items-center justify-between hover:bg-dream/5 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Moon className="w-4 h-4 text-dream" />
          <span className="text-sm font-semibold">Журнал снов</span>
        </div>
        {isOpen ? <X className="w-4 h-4 text-muted-foreground" /> : <Plus className="w-4 h-4 text-dream" />}
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-4 pb-4"
          >
            <input
              placeholder="Название сна..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-muted border border-border rounded-lg p-2 text-sm text-foreground placeholder:text-muted-foreground mb-2 focus:outline-none focus:border-dream/50"
            />
            <textarea
              placeholder="Опиши что снилось..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-muted border border-border rounded-lg p-2 text-sm text-foreground placeholder:text-muted-foreground resize-none h-20 mb-2 focus:outline-none focus:border-dream/50"
            />
            <button
              onClick={handleSubmit}
              disabled={!title.trim()}
              className="w-full bg-dream/20 hover:bg-dream/30 text-dream border border-dream/30 rounded-lg py-2 text-sm font-semibold transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Записать сон +25 XP
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DreamJournal;

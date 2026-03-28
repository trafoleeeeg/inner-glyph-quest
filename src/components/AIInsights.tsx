import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Brain, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

const AIInsights = () => {
  const [insight, setInsight] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchInsight = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-insights");
      if (error) throw error;
      setInsight(data.insight);
    } catch (e: any) {
      toast.error("Не удалось получить инсайт", { description: e.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card rounded-2xl p-5 border border-secondary/10">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Brain className="w-4 h-4 text-secondary" />
          AI-анализ паттернов
        </h3>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={fetchInsight}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary/10 text-secondary text-[11px] font-semibold hover:bg-secondary/20 transition-colors disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
          {loading ? "Анализ..." : "Запросить"}
        </motion.button>
      </div>

      <AnimatePresence mode="wait">
        {insight ? (
          <motion.div
            key="insight"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-xs text-foreground/80 leading-relaxed whitespace-pre-line font-mono"
          >
            {insight}
          </motion.div>
        ) : (
          <motion.p
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-[11px] text-muted-foreground font-mono"
          >
            Нажми «Запросить» — AI проанализирует твои паттерны за 2 недели и даст рекомендации по балансу.
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AIInsights;

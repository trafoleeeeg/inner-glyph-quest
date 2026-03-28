import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Slider } from "@/components/ui/slider";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface DailyCheckinProps {
  onComplete: () => void;
  streak: number;
}

const MOOD_LABELS = ["😫", "😔", "😐", "🙂", "😊"];
const MOOD_TEXTS = ["Тяжело", "Не очень", "Нормально", "Хорошо", "Отлично"];

const DailyCheckin = ({ onComplete, streak }: DailyCheckinProps) => {
  const { user } = useAuth();
  const [mood, setMood] = useState(3);
  const [submitted, setSubmitted] = useState(false);
  const [xpEarned, setXpEarned] = useState(0);

  const handleSubmit = async () => {
    if (!user || submitted) return;
    setSubmitted(true);
    setXpEarned(15);

    try {
      await supabase.rpc("submit_mood_checkin", {
        p_mood: mood,
        p_energy: mood,
        p_note: `Утренний чекин: ${MOOD_TEXTS[mood - 1]}`,
      });
    } catch (e) {
      // silent - XP still shows
    }

    setTimeout(onComplete, 2200);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-xl"
    >
      <motion.div
        initial={{ scale: 0.9, y: 30 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: "spring", damping: 20 }}
        className="w-full max-w-sm mx-4 text-center space-y-6"
      >
        <AnimatePresence mode="wait">
          {!submitted ? (
            <motion.div key="input" exit={{ opacity: 0, y: -20 }} className="space-y-6">
              {/* Greeting */}
              <div>
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-muted-foreground text-sm"
                >
                  {streak > 0
                    ? `🔥 ${streak} ${streak === 1 ? "день" : streak < 5 ? "дня" : "дней"} подряд`
                    : "Начни серию сегодня"}
                </motion.p>
                <motion.h2
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="text-2xl font-bold text-foreground mt-2"
                >
                  Как ты сегодня?
                </motion.h2>
              </div>

              {/* Mood emoji */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
                className="text-7xl"
              >
                {MOOD_LABELS[mood - 1]}
              </motion.div>

              <p className="text-sm font-medium text-foreground">{MOOD_TEXTS[mood - 1]}</p>

              {/* Slider */}
              <div className="px-4">
                <Slider
                  value={[mood]}
                  onValueChange={(v) => setMood(v[0])}
                  min={1}
                  max={5}
                  step={1}
                />
                <div className="flex justify-between mt-1.5 text-[9px] text-muted-foreground font-mono">
                  <span>тяжело</span>
                  <span>отлично</span>
                </div>
              </div>

              {/* Submit */}
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleSubmit}
                className="w-full py-3.5 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity"
              >
                Отметить настроение
              </motion.button>

              <button
                onClick={onComplete}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Пропустить
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="result"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", damping: 15 }}
              className="space-y-4"
            >
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 0.5 }}
                className="text-6xl"
              >
                ✅
              </motion.div>
              <h3 className="text-xl font-bold text-foreground">Отлично!</h3>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20"
              >
                <span className="text-primary font-bold font-mono">+{xpEarned} XP</span>
                {streak > 0 && (
                  <span className="text-xs text-muted-foreground">
                    🔥 Серия сохранена
                  </span>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};

export default DailyCheckin;

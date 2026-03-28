import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

const CAT_IMAGES: Record<string, string> = {
  sleeping: "/animations/cat-sleeping.png",
  sad: "/animations/cat-sad.png",
  neutral: "/animations/cat-neutral.png",
  happy: "/animations/cat-happy.png",
  ecstatic: "/animations/cat-ecstatic.png",
  eating: "/animations/cat-eating.png",
};

const PHRASES: Record<string, string[]> = {
  sleeping: ["Zzz... 💤", "Тише, я сплю...", "Мур-р-р... 😴"],
  sad: ["Мне грустно... 😿", "Давай что-нибудь сделаем?", "Я скучаю по тебе..."],
  neutral: ["Мяу! 🐱", "Привет!", "Чем займёмся?", "Я тут!"],
  happy: ["Мур-р-р! 😻", "Ты молодец!", "Так держать! ✨", "Люблю тебя! 💕"],
  ecstatic: ["МЯЯЯУ!!! 🎉", "Ты невероятный!", "Лучший день! 🌟", "Я горжусь тобой!"],
  eating: ["Ням-ням! 😋", "Вкусняшка!", "Спасибо за еду! 🍖"],
};

const LEVEL_ACCESSORIES: Record<number, { emoji: string; label: string }> = {
  3: { emoji: "🎀", label: "Бантик" },
  5: { emoji: "🔔", label: "Колокольчик" },
  8: { emoji: "👑", label: "Корона" },
};

interface CompanionProps {
  energy?: number;
  maxEnergy?: number;
  streak?: number;
  level?: number;
  justFed?: boolean;
  totalMissions?: number;
}

const Companion = ({ energy = 50, maxEnergy = 100, streak = 0, level = 1, justFed = false }: CompanionProps) => {
  const [phrase, setPhrase] = useState("");
  const [showPhrase, setShowPhrase] = useState(false);

  const energyPercent = maxEnergy > 0 ? energy / maxEnergy : 0.5;

  const moodKey = useMemo(() => {
    if (justFed) return "eating";
    if (energyPercent <= 0.1) return "sleeping";
    if (energyPercent <= 0.3) return "sad";
    if (energyPercent <= 0.6) return "neutral";
    if (energyPercent <= 0.85) return "happy";
    return "ecstatic";
  }, [energyPercent, justFed]);

  const accessory = useMemo(() => {
    let best: { emoji: string; label: string } | null = null;
    for (const [lvl, acc] of Object.entries(LEVEL_ACCESSORIES)) {
      if (level >= Number(lvl)) best = acc;
    }
    return best;
  }, [level]);

  useEffect(() => {
    const pick = () => {
      const list = PHRASES[moodKey] || PHRASES.neutral;
      setPhrase(list[Math.floor(Math.random() * list.length)]);
      setShowPhrase(true);
      setTimeout(() => setShowPhrase(false), 3000);
    };
    pick();
    const interval = setInterval(pick, 8000);
    return () => clearInterval(interval);
  }, [moodKey]);

  const catSize = Math.min(120 + level * 4, 160);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-2xl p-5 border border-border/30 relative overflow-hidden"
    >
      <AnimatePresence>
        {(moodKey === "ecstatic" || moodKey === "eating") && (
          <>
            {[...Array(5)].map((_, i) => (
              <motion.span
                key={`heart-${i}`}
                initial={{ opacity: 0, y: 0, x: 40 + i * 30 }}
                animate={{ opacity: [0, 1, 0], y: -60, x: 40 + i * 30 + Math.sin(i) * 20 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 2, delay: i * 0.3, repeat: Infinity, repeatDelay: 3 }}
                className="absolute text-lg pointer-events-none"
              >
                {moodKey === "eating" ? "🍖" : "💕"}
              </motion.span>
            ))}
          </>
        )}
      </AnimatePresence>

      <div className="flex items-center gap-4">
        <div className="relative flex-shrink-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={moodKey}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.4 }}
              className="relative"
            >
              <motion.img
                src={CAT_IMAGES[moodKey]}
                alt="Котёнок-компаньон"
                style={{ width: catSize, height: catSize }}
                className="object-contain drop-shadow-lg"
                animate={moodKey === "sleeping"
                  ? { scale: [1, 1.03, 1], opacity: [0.9, 1, 0.9] }
                  : { scale: [1, 1.02, 1] }
                }
                transition={{ duration: moodKey === "sleeping" ? 3 : 2, repeat: Infinity, ease: "easeInOut" }}
              />
              {accessory && (
                <motion.div
                  className="absolute -top-1 -right-1 text-xl"
                  animate={{ rotate: [-5, 5, -5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  {accessory.emoji}
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-foreground">Котёнок</span>
            <span className="text-[10px] font-mono text-muted-foreground">Ур. {level}</span>
            {accessory && (
              <span className="text-[9px] bg-accent/10 text-accent px-1.5 py-0.5 rounded-full">
                {accessory.label}
              </span>
            )}
          </div>

          <AnimatePresence>
            {showPhrase && (
              <motion.div
                initial={{ opacity: 0, y: 5, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -5, scale: 0.9 }}
                className="bg-muted/50 rounded-xl px-3 py-1.5 text-xs text-foreground border border-border/20 inline-block"
              >
                {phrase}
              </motion.div>
            )}
          </AnimatePresence>

          <div>
            <div className="flex items-center justify-between text-[9px] font-mono mb-1">
              <span className="text-muted-foreground">Энергия</span>
              <span className="text-muted-foreground">{energy}/{maxEnergy}</span>
            </div>
            <div className="h-2 bg-muted/30 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${energyPercent * 100}%` }}
                transition={{ duration: 0.8 }}
                style={{
                  background: energyPercent > 0.6
                    ? "linear-gradient(90deg, hsl(var(--primary)), hsl(var(--accent)))"
                    : energyPercent > 0.3
                    ? "hsl(var(--secondary))"
                    : "hsl(var(--destructive))",
                }}
              />
            </div>
          </div>

          {streak > 0 && (
            <div className="flex items-center gap-1 text-[10px] font-mono text-accent">
              <span>🔥</span> {streak} {streak === 1 ? "день" : streak < 5 ? "дня" : "дней"} подряд
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default Companion;

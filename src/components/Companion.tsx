import { useMemo } from "react";
import { motion } from "framer-motion";

interface CompanionProps {
  level: number;
  energy: number;
  maxEnergy: number;
  streak: number;
  totalMissions: number;
}

const MOODS = {
  dead: { emoji: "😴", bg: "bg-muted/30", border: "border-muted/20", label: "Спит...", color: "text-muted-foreground" },
  sad: { emoji: "😢", bg: "bg-destructive/5", border: "border-destructive/15", label: "Грустит", color: "text-destructive" },
  neutral: { emoji: "😐", bg: "bg-muted/20", border: "border-border/30", label: "В норме", color: "text-muted-foreground" },
  happy: { emoji: "😊", bg: "bg-primary/5", border: "border-primary/15", label: "Доволен", color: "text-primary" },
  ecstatic: { emoji: "🤩", bg: "bg-accent/10", border: "border-accent/20", label: "Счастлив!", color: "text-accent" },
};

const PHRASES = {
  dead: [
    "Я так долго тебя ждал... 💤",
    "Вернулся? Я уже засыпал...",
    "Давай начнём заново, я скучал!",
  ],
  sad: [
    "Покорми меня привычками! 🥺",
    "Мне грустно без дел...",
    "Давай сделаем хоть одну привычку?",
  ],
  neutral: [
    "Привет! Давай что-нибудь сделаем 💪",
    "Неплохо, но можно лучше!",
    "Ещё пара привычек — и я улыбнусь!",
  ],
  happy: [
    "Мы молодцы сегодня! 🎉",
    "Так держать, мне нравится!",
    "Чувствую, как расту! 🌱",
  ],
  ecstatic: [
    "Мы невероятная команда! 🏆",
    "Ничего себе, какая серия! 🔥",
    "Я горжусь нами! Продолжаем! ✨",
  ],
};

const EVOLUTION = [
  { minLevel: 1, size: "text-5xl", name: "Малыш" },
  { minLevel: 3, size: "text-6xl", name: "Подросток" },
  { minLevel: 5, size: "text-7xl", name: "Взрослый" },
  { minLevel: 8, size: "text-8xl", name: "Мастер" },
  { minLevel: 12, size: "text-9xl", name: "Легенда" },
];

const Companion = ({ level, energy, maxEnergy, streak, totalMissions }: CompanionProps) => {
  const healthPercent = energy / maxEnergy;

  const moodKey = useMemo(() => {
    if (streak === 0 && healthPercent < 0.3) return "dead";
    if (streak === 0 || healthPercent < 0.3) return "sad";
    if (streak >= 5 && healthPercent > 0.7) return "ecstatic";
    if (streak >= 2 || healthPercent > 0.5) return "happy";
    return "neutral";
  }, [streak, healthPercent]);

  const mood = MOODS[moodKey];
  const evolution = useMemo(() => {
    return [...EVOLUTION].reverse().find(e => level >= e.minLevel) || EVOLUTION[0];
  }, [level]);

  const phrase = useMemo(() => {
    const list = PHRASES[moodKey];
    return list[Math.floor(Math.random() * list.length)];
  }, [moodKey]);

  const bounceAnimation = moodKey === "ecstatic"
    ? { y: [0, -8, 0], scale: [1, 1.05, 1] }
    : moodKey === "happy"
    ? { y: [0, -4, 0] }
    : moodKey === "dead"
    ? { opacity: [0.4, 0.6, 0.4] }
    : moodKey === "sad"
    ? { rotate: [-2, 2, -2] }
    : { scale: [1, 1.02, 1] };

  return (
    <div className={`rounded-2xl p-4 border ${mood.border} ${mood.bg} relative overflow-hidden`}>
      <div className="flex items-center gap-4">
        {/* Pet */}
        <motion.div
          className="flex-shrink-0 flex items-center justify-center"
          animate={bounceAnimation}
          transition={{ duration: moodKey === "ecstatic" ? 1.2 : 2.5, repeat: Infinity, ease: "easeInOut" }}
          style={{ filter: moodKey === "dead" ? "grayscale(0.8)" : "none" }}
        >
          <span className={evolution.size}>{mood.emoji}</span>
        </motion.div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-xs font-semibold ${mood.color}`}>{mood.label}</span>
            <span className="text-[9px] font-mono text-muted-foreground/60">ур. {level} • {evolution.name}</span>
          </div>

          {/* Speech bubble */}
          <div className="bg-background/60 rounded-xl px-3 py-2 mb-2 relative">
            <div className="absolute -left-1 top-2.5 w-2 h-2 bg-background/60 rotate-45" />
            <p className="text-xs text-foreground/80 leading-relaxed">{phrase}</p>
          </div>

          {/* Energy bar */}
          <div className="flex items-center gap-2">
            <span className="text-[9px] text-muted-foreground font-mono">❤️ {energy}/{maxEnergy}</span>
            <div className="flex-1 h-1.5 bg-muted/30 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{
                  background: healthPercent > 0.5
                    ? "hsl(var(--primary))"
                    : healthPercent > 0.3
                    ? "hsl(var(--accent))"
                    : "hsl(var(--destructive))",
                }}
                initial={{ width: 0 }}
                animate={{ width: `${healthPercent * 100}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </div>
            {streak > 0 && (
              <span className="text-[9px] text-muted-foreground font-mono">🔥 {streak}д</span>
            )}
          </div>
        </div>
      </div>

      {/* Level progress dots */}
      <div className="flex items-center gap-1 mt-3 justify-center">
        {EVOLUTION.map((e, i) => (
          <div
            key={i}
            className={`w-1.5 h-1.5 rounded-full transition-all ${
              level >= e.minLevel ? "bg-primary" : "bg-muted/40"
            }`}
          />
        ))}
        <span className="text-[8px] text-muted-foreground/50 font-mono ml-1.5">
          {level < 12 ? `до «${[...EVOLUTION].reverse().find(e => level < e.minLevel)?.name}» — ур. ${[...EVOLUTION].reverse().find(e => level < e.minLevel)?.minLevel}` : "максимальный уровень!"}
        </span>
      </div>
    </div>
  );
};

export default Companion;

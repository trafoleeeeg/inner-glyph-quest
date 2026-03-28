import { useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface CompanionProps {
  level: number;
  energy: number;
  maxEnergy: number;
  streak: number;
  totalMissions: number;
  justFed?: boolean;
}

const MOODS = {
  dead: { label: "Спит...", color: "text-muted-foreground" },
  sad: { label: "Грустит", color: "text-destructive" },
  neutral: { label: "В норме", color: "text-muted-foreground" },
  happy: { label: "Доволен", color: "text-primary" },
  ecstatic: { label: "Счастлив!", color: "text-accent" },
};

const PHRASES = {
  dead: ["Я так долго тебя ждал... 💤", "Вернулся? Я уже засыпал...", "Давай начнём заново, я скучал!"],
  sad: ["Покорми меня привычками! 🥺", "Мне грустно без дел...", "Давай сделаем хоть одну привычку?"],
  neutral: ["Привет! Давай что-нибудь сделаем 💪", "Неплохо, но можно лучше!", "Ещё пара привычек — и я улыбнусь!"],
  happy: ["Мы молодцы сегодня! 🎉", "Так держать, мне нравится!", "Чувствую, как расту! 🌱"],
  ecstatic: ["Мы невероятная команда! 🏆", "Ничего себе, какая серия! 🔥", "Я горжусь нами! Продолжаем! ✨"],
};

const EVOLUTION = [
  { minLevel: 1, name: "Малыш", scale: 0.85 },
  { minLevel: 3, name: "Подросток", scale: 1 },
  { minLevel: 5, name: "Взрослый", scale: 1.1 },
  { minLevel: 8, name: "Мастер", scale: 1.2 },
  { minLevel: 12, name: "Легенда", scale: 1.3 },
];

/* ─── Animated SVG Cat ─── */
const CatCharacter = ({ mood, evolution, justFed }: { mood: string; evolution: typeof EVOLUTION[0]; justFed: boolean }) => {
  const [blinkOpen, setBlinkOpen] = useState(true);

  // Blink every 3-5 seconds unless sleeping
  useEffect(() => {
    if (mood === "dead") return;
    const interval = setInterval(() => {
      setBlinkOpen(false);
      setTimeout(() => setBlinkOpen(true), 150);
    }, 3000 + Math.random() * 2000);
    return () => clearInterval(interval);
  }, [mood]);

  const isSleeping = mood === "dead";
  const isSad = mood === "sad";
  const isHappy = mood === "happy" || mood === "ecstatic";
  const isEcstatic = mood === "ecstatic";

  // Body color based on mood
  const bodyColor = isSleeping ? "hsl(var(--muted-foreground))" 
    : isSad ? "hsl(var(--muted-foreground))" 
    : "hsl(var(--primary))";
  const bodyLightColor = isSleeping ? "hsl(var(--muted))"
    : isSad ? "hsl(var(--muted))"
    : "hsl(var(--primary) / 0.6)";

  return (
    <motion.div
      style={{ transform: `scale(${evolution.scale})` }}
      className="relative w-24 h-24 flex items-center justify-center"
    >
      <svg viewBox="0 0 120 120" className="w-full h-full" style={{ filter: isSleeping ? "saturate(0.3)" : "none" }}>
        {/* Tail */}
        <motion.path
          d="M 85 85 Q 105 75 110 55 Q 115 40 105 35"
          fill="none"
          stroke={bodyColor}
          strokeWidth="5"
          strokeLinecap="round"
          animate={
            isEcstatic ? { d: ["M 85 85 Q 105 75 110 55 Q 115 40 105 35", "M 85 85 Q 110 80 115 55 Q 118 35 100 30", "M 85 85 Q 105 75 110 55 Q 115 40 105 35"] }
            : isHappy ? { d: ["M 85 85 Q 105 75 110 55 Q 115 40 105 35", "M 85 85 Q 108 78 112 55 Q 116 38 103 33", "M 85 85 Q 105 75 110 55 Q 115 40 105 35"] }
            : isSleeping ? {} 
            : { d: ["M 85 85 Q 105 75 110 55 Q 115 40 105 35", "M 85 85 Q 106 76 111 56 Q 116 41 106 36", "M 85 85 Q 105 75 110 55 Q 115 40 105 35"] }
          }
          transition={{ duration: isEcstatic ? 0.4 : isHappy ? 0.8 : 2, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Body */}
        <motion.ellipse
          cx="58" cy="80" rx="28" ry="22"
          fill={bodyColor}
          animate={isSleeping 
            ? { ry: [22, 23, 22], opacity: [0.6, 0.8, 0.6] } 
            : isEcstatic 
            ? { cy: [80, 74, 80] }
            : { ry: [22, 22.5, 22] }
          }
          transition={{ duration: isSleeping ? 3 : isEcstatic ? 0.5 : 2, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Belly */}
        <ellipse cx="58" cy="83" rx="18" ry="14" fill={bodyLightColor} opacity="0.5" />

        {/* Head */}
        <motion.circle
          cx="58" cy="50" r="22"
          fill={bodyColor}
          animate={isEcstatic ? { cy: [50, 44, 50] } : isSad ? { cy: [50, 51, 50] } : {}}
          transition={{ duration: isEcstatic ? 0.5 : 2, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Left Ear */}
        <motion.polygon
          points="38,35 30,12 48,28"
          fill={bodyColor}
          animate={
            isHappy ? { points: ["38,35 30,12 48,28", "38,33 28,10 48,26", "38,35 30,12 48,28"] }
            : isSad ? { points: ["38,35 30,12 48,28", "40,35 34,16 48,30", "38,35 30,12 48,28"] }
            : {}
          }
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        />
        <polygon points="40,33 34,18 47,30" fill={bodyLightColor} opacity="0.6" />

        {/* Right Ear */}
        <motion.polygon
          points="78,35 86,12 68,28"
          fill={bodyColor}
          animate={
            isHappy ? { points: ["78,35 86,12 68,28", "78,33 88,10 68,26", "78,35 86,12 68,28"] }
            : isSad ? { points: ["78,35 86,12 68,28", "76,35 82,16 68,30", "78,35 86,12 68,28"] }
            : {}
          }
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
        />
        <polygon points="76,33 82,18 69,30" fill={bodyLightColor} opacity="0.6" />

        {/* Eyes */}
        {isSleeping ? (
          <>
            {/* Closed eyes - sleeping */}
            <path d="M 47 48 Q 50 51 53 48" stroke={bodyLightColor} strokeWidth="2" fill="none" strokeLinecap="round" />
            <path d="M 63 48 Q 66 51 69 48" stroke={bodyLightColor} strokeWidth="2" fill="none" strokeLinecap="round" />
          </>
        ) : (
          <>
            {/* Open/blinking eyes */}
            <motion.ellipse cx="50" cy="48" rx={blinkOpen ? 4 : 4} ry={blinkOpen ? 4.5 : 0.5} fill="hsl(var(--background))" />
            <motion.ellipse cx="66" cy="48" rx={blinkOpen ? 4 : 4} ry={blinkOpen ? 4.5 : 0.5} fill="hsl(var(--background))" />
            {blinkOpen && (
              <>
                {/* Pupils */}
                <motion.circle cx="50" cy="48" r="2.5" fill="hsl(var(--foreground))"
                  animate={isEcstatic ? { r: [2.5, 3, 2.5] } : {}}
                  transition={{ duration: 0.5, repeat: Infinity }}
                />
                <motion.circle cx="66" cy="48" r="2.5" fill="hsl(var(--foreground))"
                  animate={isEcstatic ? { r: [2.5, 3, 2.5] } : {}}
                  transition={{ duration: 0.5, repeat: Infinity }}
                />
                {/* Eye sparkle */}
                <circle cx="52" cy="46.5" r="1" fill="hsl(var(--background))" opacity="0.8" />
                <circle cx="68" cy="46.5" r="1" fill="hsl(var(--background))" opacity="0.8" />
                {/* Star eyes for ecstatic */}
                {isEcstatic && (
                  <>
                    <motion.text x="47" y="51" fontSize="6" textAnchor="middle"
                      animate={{ opacity: [1, 0.5, 1], scale: [1, 1.2, 1] }}
                      transition={{ duration: 0.6, repeat: Infinity }}>⭐</motion.text>
                    <motion.text x="63" y="51" fontSize="6" textAnchor="middle"
                      animate={{ opacity: [1, 0.5, 1], scale: [1, 1.2, 1] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: 0.3 }}>⭐</motion.text>
                  </>
                )}
              </>
            )}
          </>
        )}

        {/* Nose */}
        <polygon points="58,53 56,56 60,56" fill="hsl(var(--destructive) / 0.6)" />

        {/* Mouth */}
        {isHappy || isEcstatic ? (
          <path d="M 53 58 Q 58 63 63 58" stroke={bodyLightColor} strokeWidth="1.5" fill="none" strokeLinecap="round" />
        ) : isSad ? (
          <path d="M 53 60 Q 58 57 63 60" stroke={bodyLightColor} strokeWidth="1.5" fill="none" strokeLinecap="round" />
        ) : (
          <path d="M 55 58 L 61 58" stroke={bodyLightColor} strokeWidth="1.5" strokeLinecap="round" />
        )}

        {/* Whiskers */}
        <line x1="35" y1="52" x2="46" y2="54" stroke={bodyLightColor} strokeWidth="1" opacity="0.5" />
        <line x1="35" y1="56" x2="46" y2="56" stroke={bodyLightColor} strokeWidth="1" opacity="0.5" />
        <line x1="70" y1="54" x2="81" y2="52" stroke={bodyLightColor} strokeWidth="1" opacity="0.5" />
        <line x1="70" y1="56" x2="81" y2="56" stroke={bodyLightColor} strokeWidth="1" opacity="0.5" />

        {/* Front paws */}
        <ellipse cx="44" cy="96" rx="7" ry="5" fill={bodyColor} />
        <ellipse cx="72" cy="96" rx="7" ry="5" fill={bodyColor} />
        {/* Paw pads */}
        <circle cx="42" cy="97" r="1.5" fill={bodyLightColor} opacity="0.4" />
        <circle cx="46" cy="97" r="1.5" fill={bodyLightColor} opacity="0.4" />
        <circle cx="70" cy="97" r="1.5" fill={bodyLightColor} opacity="0.4" />
        <circle cx="74" cy="97" r="1.5" fill={bodyLightColor} opacity="0.4" />

        {/* Level accessories */}
        {evolution.minLevel >= 3 && (
          /* Bow tie */
          <g>
            <polygon points="54,68 58,72 62,68" fill="hsl(var(--accent))" opacity="0.8" />
            <polygon points="54,76 58,72 62,76" fill="hsl(var(--accent))" opacity="0.8" />
            <circle cx="58" cy="72" r="2" fill="hsl(var(--accent))" />
          </g>
        )}
        {evolution.minLevel >= 8 && (
          /* Crown */
          <g>
            <polygon points="43,14 48,6 53,12 58,2 63,12 68,6 73,14" fill="hsl(var(--accent))" opacity="0.9" />
            <rect x="43" y="14" width="30" height="4" rx="1" fill="hsl(var(--accent))" opacity="0.9" />
            <circle cx="53" cy="10" r="1.5" fill="hsl(var(--background))" opacity="0.6" />
            <circle cx="58" cy="6" r="1.5" fill="hsl(var(--background))" opacity="0.6" />
            <circle cx="63" cy="10" r="1.5" fill="hsl(var(--background))" opacity="0.6" />
          </g>
        )}
      </svg>

      {/* Z-z-z for sleeping */}
      {isSleeping && (
        <div className="absolute -top-1 right-0">
          <motion.span className="text-lg text-muted-foreground/50"
            animate={{ opacity: [0, 1, 0], y: [0, -10, -20] }}
            transition={{ duration: 2.5, repeat: Infinity }}>
            💤
          </motion.span>
        </div>
      )}

      {/* Hearts when fed */}
      <AnimatePresence>
        {justFed && (
          <>
            {[0, 1, 2].map(i => (
              <motion.span
                key={i}
                className="absolute text-sm"
                style={{ left: `${30 + i * 20}%`, top: "10%" }}
                initial={{ opacity: 0, y: 0, scale: 0 }}
                animate={{ opacity: [0, 1, 0], y: -30, scale: [0, 1.2, 0.8] }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.5, delay: i * 0.3, ease: "easeOut" }}
              >
                ❤️
              </motion.span>
            ))}
          </>
        )}
      </AnimatePresence>

      {/* Sparkles for ecstatic */}
      {isEcstatic && (
        <div className="absolute inset-0 pointer-events-none">
          {[0, 1, 2, 3].map(i => (
            <motion.span
              key={i}
              className="absolute text-xs"
              style={{ left: `${10 + i * 25}%`, top: `${20 + (i % 2) * 40}%` }}
              animate={{ opacity: [0, 1, 0], scale: [0.5, 1.2, 0.5], rotate: [0, 180, 360] }}
              transition={{ duration: 1.5, delay: i * 0.4, repeat: Infinity }}
            >
              ✨
            </motion.span>
          ))}
        </div>
      )}

      {/* Tear for sad */}
      {isSad && (
        <motion.span className="absolute text-[10px]" style={{ left: "58%", top: "38%" }}
          animate={{ opacity: [0, 1, 0], y: [0, 12, 24] }}
          transition={{ duration: 2, repeat: Infinity, delay: 1 }}>
          💧
        </motion.span>
      )}
    </motion.div>
  );
};

const Companion = ({ level, energy, maxEnergy, streak, totalMissions, justFed = false }: CompanionProps) => {
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
    if (justFed) return "Ням-ням! Спасибо! 😋❤️";
    const list = PHRASES[moodKey];
    return list[Math.floor(Math.random() * list.length)];
  }, [moodKey, justFed]);

  return (
    <div className="rounded-2xl p-4 border border-border/30 bg-card/50 relative overflow-hidden">
      <div className="flex items-center gap-4">
        {/* Animated Cat */}
        <CatCharacter mood={moodKey} evolution={evolution} justFed={justFed} />

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

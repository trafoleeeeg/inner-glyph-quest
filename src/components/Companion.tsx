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

/* ─── Fluffy Kawaii Cat ─── */
const CatCharacter = ({ mood, evolution, justFed }: { mood: string; evolution: typeof EVOLUTION[0]; justFed: boolean }) => {
  const [blinkOpen, setBlinkOpen] = useState(true);

  useEffect(() => {
    if (mood === "dead") return;
    const interval = setInterval(() => {
      setBlinkOpen(false);
      setTimeout(() => setBlinkOpen(true), 180);
    }, 3500 + Math.random() * 2000);
    return () => clearInterval(interval);
  }, [mood]);

  const isSleeping = mood === "dead";
  const isSad = mood === "sad";
  const isHappy = mood === "happy" || mood === "ecstatic";
  const isEcstatic = mood === "ecstatic";

  // Warm peachy/orange palette
  const fur = isSleeping ? "#c4b5a0" : "#f4a460";
  const furLight = isSleeping ? "#d9ccbc" : "#fcc88a";
  const furDark = isSleeping ? "#a89880" : "#e08830";
  const blush = isHappy ? "rgba(255,120,140,0.5)" : "rgba(255,150,160,0.25)";
  const noseColor = "#ff8fa0";
  const eyeWhite = "#fff";
  const pupil = "#3a2a1a";
  const eyeShine = "#fff";
  const innerEar = "#ffb8c6";
  const pawPad = "#ffb0bb";

  return (
    <motion.div
      style={{ transform: `scale(${evolution.scale})` }}
      className="relative w-28 h-28 flex items-center justify-center"
    >
      <svg viewBox="0 0 140 140" className="w-full h-full" style={{ filter: isSleeping ? "saturate(0.4) brightness(0.9)" : "none" }}>
        <defs>
          {/* Fur texture filter */}
          <filter id="fur-soft">
            <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="4" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="1.5" />
          </filter>
          {/* Soft glow */}
          <filter id="soft-glow">
            <feGaussianBlur stdDeviation="1.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          {/* Radial gradient for body roundness */}
          <radialGradient id="body-grad" cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor={furLight} />
            <stop offset="100%" stopColor={fur} />
          </radialGradient>
          <radialGradient id="head-grad" cx="45%" cy="35%" r="65%">
            <stop offset="0%" stopColor={furLight} />
            <stop offset="100%" stopColor={fur} />
          </radialGradient>
          <radialGradient id="belly-grad" cx="50%" cy="40%" r="50%">
            <stop offset="0%" stopColor="#fff5e6" />
            <stop offset="100%" stopColor={furLight} stopOpacity="0.6" />
          </radialGradient>
        </defs>

        {/* Fluffy Tail */}
        <motion.path
          d="M 100 95 Q 120 80 125 60 Q 128 45 122 38 Q 118 33 114 36 Q 110 42 112 55 Q 114 68 105 82"
          fill={fur}
          stroke={furDark}
          strokeWidth="0.5"
          opacity="0.9"
          animate={
            isEcstatic ? { d: ["M 100 95 Q 120 80 125 60 Q 128 45 122 38 Q 118 33 114 36 Q 110 42 112 55 Q 114 68 105 82", "M 100 95 Q 125 85 130 60 Q 133 40 125 33 Q 120 28 116 32 Q 112 38 115 55 Q 118 72 105 82", "M 100 95 Q 120 80 125 60 Q 128 45 122 38 Q 118 33 114 36 Q 110 42 112 55 Q 114 68 105 82"] }
            : isHappy ? { d: ["M 100 95 Q 120 80 125 60 Q 128 45 122 38 Q 118 33 114 36 Q 110 42 112 55 Q 114 68 105 82", "M 100 95 Q 122 82 126 62 Q 129 46 123 39 Q 119 34 115 37 Q 111 43 113 56 Q 115 69 105 82", "M 100 95 Q 120 80 125 60 Q 128 45 122 38 Q 118 33 114 36 Q 110 42 112 55 Q 114 68 105 82"] }
            : { d: ["M 100 95 Q 120 80 125 60 Q 128 45 122 38 Q 118 33 114 36 Q 110 42 112 55 Q 114 68 105 82", "M 100 95 Q 121 81 125 61 Q 128 46 122 39 Q 118 34 114 37 Q 110 43 112 56 Q 114 69 105 82", "M 100 95 Q 120 80 125 60 Q 128 45 122 38 Q 118 33 114 36 Q 110 42 112 55 Q 114 68 105 82"] }
          }
          transition={{ duration: isEcstatic ? 0.5 : isHappy ? 1 : 3, repeat: Infinity, ease: "easeInOut" }}
        />
        {/* Tail fur tufts */}
        <circle cx="122" cy="40" r="4" fill={furLight} opacity="0.5" />
        <circle cx="125" cy="52" r="3" fill={furLight} opacity="0.4" />

        {/* Body — big fluffy oval */}
        <motion.ellipse
          cx="68" cy="92" rx="32" ry="26"
          fill="url(#body-grad)"
          stroke={furDark}
          strokeWidth="0.3"
          animate={isSleeping
            ? { ry: [26, 27.5, 26], opacity: [0.7, 0.85, 0.7] }
            : isEcstatic
            ? { cy: [92, 87, 92] }
            : { ry: [26, 26.8, 26] }
          }
          transition={{ duration: isSleeping ? 3.5 : isEcstatic ? 0.6 : 2.5, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Belly patch */}
        <ellipse cx="68" cy="96" rx="20" ry="17" fill="url(#belly-grad)" opacity="0.7" />

        {/* Fur tufts on body */}
        <ellipse cx="42" cy="85" rx="5" ry="3" fill={furLight} opacity="0.4" transform="rotate(-20 42 85)" />
        <ellipse cx="94" cy="85" rx="5" ry="3" fill={furLight} opacity="0.4" transform="rotate(20 94 85)" />
        <ellipse cx="50" cy="78" rx="3" ry="2" fill={furLight} opacity="0.3" transform="rotate(-15 50 78)" />
        <ellipse cx="86" cy="78" rx="3" ry="2" fill={furLight} opacity="0.3" transform="rotate(15 86 78)" />

        {/* HEAD — big round kawaii head */}
        <motion.circle
          cx="68" cy="52" r="28"
          fill="url(#head-grad)"
          stroke={furDark}
          strokeWidth="0.3"
          animate={isEcstatic ? { cy: [52, 47, 52] } : isSad ? { cy: [52, 53, 52] } : {}}
          transition={{ duration: isEcstatic ? 0.6 : 2.5, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Fur tufts on head (fluffy cheeks) */}
        <ellipse cx="42" cy="58" rx="6" ry="4" fill={furLight} opacity="0.5" transform="rotate(-10 42 58)" />
        <ellipse cx="94" cy="58" rx="6" ry="4" fill={furLight} opacity="0.5" transform="rotate(10 94 58)" />
        <ellipse cx="68" cy="28" rx="4" ry="3" fill={furLight} opacity="0.4" />

        {/* Left Ear */}
        <motion.path
          d="M 46 34 Q 38 8 30 14 Q 24 18 42 38"
          fill={fur}
          stroke={furDark}
          strokeWidth="0.3"
          animate={
            isHappy ? { d: ["M 46 34 Q 38 8 30 14 Q 24 18 42 38", "M 46 32 Q 36 6 28 12 Q 22 16 42 36", "M 46 34 Q 38 8 30 14 Q 24 18 42 38"] }
            : isSad ? { d: ["M 46 34 Q 38 8 30 14 Q 24 18 42 38", "M 46 36 Q 40 14 34 18 Q 28 22 42 40", "M 46 34 Q 38 8 30 14 Q 24 18 42 38"] }
            : {}
          }
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
        <path d="M 44 35 Q 38 16 33 19 Q 30 22 43 37" fill={innerEar} opacity="0.6" />

        {/* Right Ear */}
        <motion.path
          d="M 90 34 Q 98 8 106 14 Q 112 18 94 38"
          fill={fur}
          stroke={furDark}
          strokeWidth="0.3"
          animate={
            isHappy ? { d: ["M 90 34 Q 98 8 106 14 Q 112 18 94 38", "M 90 32 Q 100 6 108 12 Q 114 16 94 36", "M 90 34 Q 98 8 106 14 Q 112 18 94 38"] }
            : isSad ? { d: ["M 90 34 Q 98 8 106 14 Q 112 18 94 38", "M 90 36 Q 96 14 102 18 Q 108 22 94 40", "M 90 34 Q 98 8 106 14 Q 112 18 94 38"] }
            : {}
          }
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
        />
        <path d="M 92 35 Q 98 16 103 19 Q 106 22 93 37" fill={innerEar} opacity="0.6" />

        {/* Ear fur tufts */}
        <ellipse cx="40" cy="30" rx="3" ry="2" fill={furLight} opacity="0.4" transform="rotate(-30 40 30)" />
        <ellipse cx="96" cy="30" rx="3" ry="2" fill={furLight} opacity="0.4" transform="rotate(30 96 30)" />

        {/* EYES */}
        {isSleeping ? (
          <>
            <path d="M 54 50 Q 58 54 62 50" stroke={furDark} strokeWidth="2" fill="none" strokeLinecap="round" />
            <path d="M 74 50 Q 78 54 82 50" stroke={furDark} strokeWidth="2" fill="none" strokeLinecap="round" />
          </>
        ) : (
          <>
            {/* Eye whites */}
            <motion.ellipse cx="58" cy="50" rx={blinkOpen ? 7 : 7} ry={blinkOpen ? 8 : 1} fill={eyeWhite} filter="url(#soft-glow)" />
            <motion.ellipse cx="78" cy="50" rx={blinkOpen ? 7 : 7} ry={blinkOpen ? 8 : 1} fill={eyeWhite} filter="url(#soft-glow)" />
            {blinkOpen && (
              <>
                {/* Pupils — big kawaii style */}
                <motion.circle cx="58" cy="51" r="4.5" fill={pupil}
                  animate={isEcstatic ? { r: [4.5, 5, 4.5] } : {}}
                  transition={{ duration: 0.6, repeat: Infinity }}
                />
                <motion.circle cx="78" cy="51" r="4.5" fill={pupil}
                  animate={isEcstatic ? { r: [4.5, 5, 4.5] } : {}}
                  transition={{ duration: 0.6, repeat: Infinity }}
                />
                {/* Eye shine — double highlight for kawaii look */}
                <circle cx="56" cy="48" r="2.2" fill={eyeShine} opacity="0.9" />
                <circle cx="60" cy="53" r="1.2" fill={eyeShine} opacity="0.6" />
                <circle cx="76" cy="48" r="2.2" fill={eyeShine} opacity="0.9" />
                <circle cx="80" cy="53" r="1.2" fill={eyeShine} opacity="0.6" />
                {/* Star eyes for ecstatic */}
                {isEcstatic && (
                  <>
                    <motion.text x="58" y="54" fontSize="8" textAnchor="middle" fill="#ffd700"
                      animate={{ opacity: [1, 0.5, 1], scale: [1, 1.3, 1] }}
                      transition={{ duration: 0.5, repeat: Infinity }}>★</motion.text>
                    <motion.text x="78" y="54" fontSize="8" textAnchor="middle" fill="#ffd700"
                      animate={{ opacity: [1, 0.5, 1], scale: [1, 1.3, 1] }}
                      transition={{ duration: 0.5, repeat: Infinity, delay: 0.2 }}>★</motion.text>
                  </>
                )}
              </>
            )}
          </>
        )}

        {/* Blush cheeks */}
        <motion.circle cx="47" cy="58" r="5" fill={blush}
          animate={isHappy ? { r: [5, 6, 5], opacity: [0.5, 0.7, 0.5] } : {}}
          transition={{ duration: 2, repeat: Infinity }}
        />
        <motion.circle cx="89" cy="58" r="5" fill={blush}
          animate={isHappy ? { r: [5, 6, 5], opacity: [0.5, 0.7, 0.5] } : {}}
          transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
        />

        {/* Nose — tiny heart shape */}
        <path d="M 68 58 C 66 56 63 57 63 59 C 63 61 68 64 68 64 C 68 64 73 61 73 59 C 73 57 70 56 68 58Z" fill={noseColor} />

        {/* Mouth */}
        {isHappy || isEcstatic ? (
          <path d="M 62 64 Q 65 68 68 65 Q 71 68 74 64" stroke={furDark} strokeWidth="1.2" fill="none" strokeLinecap="round" />
        ) : isSad ? (
          <path d="M 63 67 Q 68 64 73 67" stroke={furDark} strokeWidth="1.2" fill="none" strokeLinecap="round" />
        ) : (
          <>
            <path d="M 64 65 Q 68 67 72 65" stroke={furDark} strokeWidth="1" fill="none" strokeLinecap="round" />
          </>
        )}

        {/* Whiskers — soft, slightly curved */}
        <line x1="30" y1="56" x2="50" y2="59" stroke={furDark} strokeWidth="0.6" opacity="0.3" />
        <line x1="28" y1="60" x2="50" y2="61" stroke={furDark} strokeWidth="0.6" opacity="0.3" />
        <line x1="30" y1="64" x2="50" y2="63" stroke={furDark} strokeWidth="0.6" opacity="0.3" />
        <line x1="86" y1="59" x2="106" y2="56" stroke={furDark} strokeWidth="0.6" opacity="0.3" />
        <line x1="86" y1="61" x2="108" y2="60" stroke={furDark} strokeWidth="0.6" opacity="0.3" />
        <line x1="86" y1="63" x2="106" y2="64" stroke={furDark} strokeWidth="0.6" opacity="0.3" />

        {/* Front paws — rounded with paw pads */}
        <ellipse cx="52" cy="112" rx="10" ry="7" fill={fur} stroke={furDark} strokeWidth="0.3" />
        <ellipse cx="84" cy="112" rx="10" ry="7" fill={fur} stroke={furDark} strokeWidth="0.3" />
        {/* Paw pad details */}
        <ellipse cx="52" cy="114" rx="5" ry="3.5" fill={pawPad} opacity="0.5" />
        <circle cx="48" cy="111" r="1.8" fill={pawPad} opacity="0.4" />
        <circle cx="52" cy="110" r="1.8" fill={pawPad} opacity="0.4" />
        <circle cx="56" cy="111" r="1.8" fill={pawPad} opacity="0.4" />
        <ellipse cx="84" cy="114" rx="5" ry="3.5" fill={pawPad} opacity="0.5" />
        <circle cx="80" cy="111" r="1.8" fill={pawPad} opacity="0.4" />
        <circle cx="84" cy="110" r="1.8" fill={pawPad} opacity="0.4" />
        <circle cx="88" cy="111" r="1.8" fill={pawPad} opacity="0.4" />

        {/* Belly patch on front */}
        <ellipse cx="68" cy="105" rx="12" ry="6" fill="#fff5e6" opacity="0.4" />

        {/* Level accessories */}
        {evolution.minLevel >= 3 && (
          <g>
            {/* Cute bow tie */}
            <path d="M 60 76 L 68 80 L 76 76 L 68 78 Z" fill="#ff7eb3" opacity="0.8" />
            <path d="M 60 84 L 68 80 L 76 84 L 68 82 Z" fill="#ff7eb3" opacity="0.8" />
            <circle cx="68" cy="80" r="2.5" fill="#ff5c8d" />
          </g>
        )}
        {evolution.minLevel >= 5 && evolution.minLevel < 8 && (
          <g>
            {/* Little bell collar */}
            <path d="M 50 74 Q 68 78 86 74" stroke="#ffcc00" strokeWidth="1.5" fill="none" />
            <circle cx="68" cy="77" r="3" fill="#ffcc00" />
            <circle cx="68" cy="77" r="1.5" fill="#ff9900" />
          </g>
        )}
        {evolution.minLevel >= 8 && (
          <g>
            {/* Crown */}
            <polygon points="50,18 56,8 62,14 68,2 74,14 80,8 86,18" fill="#ffd700" stroke="#e6b800" strokeWidth="0.5" />
            <rect x="50" y="18" width="36" height="5" rx="1.5" fill="#ffd700" stroke="#e6b800" strokeWidth="0.5" />
            {/* Gems */}
            <circle cx="60" cy="12" r="2" fill="#ff6b8a" />
            <circle cx="68" cy="6" r="2.2" fill="#7be0ff" />
            <circle cx="76" cy="12" r="2" fill="#b388ff" />
          </g>
        )}
      </svg>

      {/* Z-z-z for sleeping */}
      {isSleeping && (
        <div className="absolute -top-2 right-0">
          <motion.span className="text-xl text-muted-foreground/40"
            animate={{ opacity: [0, 1, 0], y: [0, -12, -24] }}
            transition={{ duration: 3, repeat: Infinity }}>
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
                className="absolute text-lg"
                style={{ left: `${25 + i * 22}%`, top: "5%" }}
                initial={{ opacity: 0, y: 0, scale: 0 }}
                animate={{ opacity: [0, 1, 0], y: -35, scale: [0, 1.3, 0.9] }}
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
              className="absolute text-sm"
              style={{ left: `${8 + i * 24}%`, top: `${15 + (i % 2) * 45}%` }}
              animate={{ opacity: [0, 1, 0], scale: [0.5, 1.3, 0.5], rotate: [0, 180, 360] }}
              transition={{ duration: 1.8, delay: i * 0.4, repeat: Infinity }}
            >
              ✨
            </motion.span>
          ))}
        </div>
      )}

      {/* Tear for sad */}
      {isSad && (
        <motion.span className="absolute text-xs" style={{ left: "60%", top: "35%" }}
          animate={{ opacity: [0, 1, 0], y: [0, 14, 28] }}
          transition={{ duration: 2.5, repeat: Infinity, delay: 1 }}>
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
        <CatCharacter mood={moodKey} evolution={evolution} justFed={justFed} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-xs font-semibold ${mood.color}`}>{mood.label}</span>
            <span className="text-[9px] font-mono text-muted-foreground/60">ур. {level} • {evolution.name}</span>
          </div>

          <div className="bg-background/60 rounded-xl px-3 py-2 mb-2 relative">
            <div className="absolute -left-1 top-2.5 w-2 h-2 bg-background/60 rotate-45" />
            <p className="text-xs text-foreground/80 leading-relaxed">{phrase}</p>
          </div>

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

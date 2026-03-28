import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

const CONTEXTUAL_PHRASES: Record<string, { condition: (props: CompanionProps) => boolean; phrases: string[] }[]> = {
  idle: [
    { condition: (p) => (p.streak || 0) >= 7, phrases: ["Мы лучшая команда! 🏆", "7+ дней! Невероятно!", "Горжусь тобой! 🌟"] },
    { condition: (p) => (p.streak || 0) >= 3, phrases: ["Серия растёт! 🔥", "Так держать!", "Мы на верном пути! 💪"] },
    { condition: (p) => ((p.energy || 0) / (p.maxEnergy || 100)) < 0.2, phrases: ["Я устал... 😴", "Давай отдохнём?", "Нужна подзарядка..."] },
    { condition: (p) => ((p.energy || 0) / (p.maxEnergy || 100)) < 0.4, phrases: ["Мне скучно...", "Давай что-нибудь сделаем?", "Хочу играть! 🐾"] },
    { condition: () => true, phrases: ["Мяу! 🐱", "Привет!", "Чем займёмся?", "Я тут!", "Мур-р-р 😻"] },
  ],
  fed: [
    { condition: () => true, phrases: ["Ура! Мне лучше! 😻", "Вкусняшка! +5 энергии!", "Спасибо! 🍖✨", "Ням-ням! 😋"] },
  ],
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
  const [tapped, setTapped] = useState(false);

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

  const props: CompanionProps = { energy, maxEnergy, streak, level, justFed };

  const pickPhrase = useCallback(() => {
    const state = justFed ? "fed" : "idle";
    const options = CONTEXTUAL_PHRASES[state];
    for (const opt of options) {
      if (opt.condition(props)) {
        setPhrase(opt.phrases[Math.floor(Math.random() * opt.phrases.length)]);
        setShowPhrase(true);
        setTimeout(() => setShowPhrase(false), 3500);
        return;
      }
    }
  }, [moodKey, justFed, props]);

  useEffect(() => {
    pickPhrase();
    const interval = setInterval(pickPhrase, 10000);
    return () => clearInterval(interval);
  }, [pickPhrase]);

  const handleTap = () => {
    setTapped(true);
    setPhrase("Мур-р-р! 😻💕");
    setShowPhrase(true);
    setTimeout(() => { setShowPhrase(false); setTapped(false); }, 2000);
  };

  const catScale = Math.min(1 + level * 0.02, 1.3);

  // Eye state
  const eyeVariant = moodKey === "sleeping" ? "closed" : moodKey === "sad" ? "sad" : "open";
  // Body color based on mood
  const bodyColor = moodKey === "sad" ? "hsl(var(--muted-foreground))" : 
                    moodKey === "sleeping" ? "hsl(var(--muted-foreground) / 0.7)" :
                    "hsl(30 70% 65%)"; // warm orange for happy states
  const cheekColor = moodKey === "happy" || moodKey === "ecstatic" || moodKey === "eating" ? "hsl(0 70% 75% / 0.5)" : "transparent";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-2xl p-5 border border-border/30 relative overflow-hidden"
    >
      {/* Floating particles for ecstatic/eating */}
      <AnimatePresence>
        {(moodKey === "ecstatic" || moodKey === "eating") && (
          <>
            {[...Array(5)].map((_, i) => (
              <motion.span
                key={`p-${i}`}
                initial={{ opacity: 0, y: 0, x: 30 + i * 25 }}
                animate={{ opacity: [0, 1, 0], y: -50, x: 30 + i * 25 + Math.sin(i) * 15 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 2, delay: i * 0.4, repeat: Infinity, repeatDelay: 3 }}
                className="absolute text-sm pointer-events-none"
              >
                {moodKey === "eating" ? "🍖" : "✨"}
              </motion.span>
            ))}
          </>
        )}
      </AnimatePresence>

      <div className="flex items-center gap-4">
        {/* Cat SVG Character */}
        <motion.div
          className="relative flex-shrink-0 cursor-pointer"
          onClick={handleTap}
          whileTap={{ scale: 1.1 }}
          animate={tapped ? { rotate: [0, -5, 5, -3, 0] } : {}}
          transition={{ duration: 0.4 }}
        >
          <motion.svg
            width="100" height="100" viewBox="0 0 120 120"
            style={{ transform: `scale(${catScale})` }}
            animate={moodKey === "sleeping"
              ? { y: [0, 2, 0] }
              : { y: [0, -3, 0] }
            }
            transition={{ duration: moodKey === "sleeping" ? 3 : 2, repeat: Infinity, ease: "easeInOut" }}
          >
            {/* Tail */}
            <motion.path
              d="M 85 85 Q 105 70 100 50"
              fill="none"
              stroke={bodyColor}
              strokeWidth="5"
              strokeLinecap="round"
              animate={{ d: ["M 85 85 Q 105 70 100 50", "M 85 85 Q 110 80 105 55", "M 85 85 Q 105 70 100 50"] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            />

            {/* Body */}
            <motion.ellipse
              cx="55" cy="78" rx="30" ry="25"
              fill={bodyColor}
              animate={{ ry: [25, 26, 25] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            />

            {/* Head */}
            <circle cx="55" cy="48" r="24" fill={bodyColor} />

            {/* Left ear */}
            <polygon points="36,30 28,10 44,25" fill={bodyColor} />
            <polygon points="38,28 32,14 43,26" fill="hsl(0 60% 80% / 0.4)" />

            {/* Right ear */}
            <polygon points="74,30 82,10 66,25" fill={bodyColor} />
            <polygon points="72,28 78,14 67,26" fill="hsl(0 60% 80% / 0.4)" />

            {/* Eyes */}
            {eyeVariant === "open" && (
              <>
                {/* Left eye */}
                <motion.ellipse cx="45" cy="46" rx="5" ry="5.5" fill="hsl(var(--foreground))"
                  animate={{ ry: [5.5, 0.5, 5.5] }}
                  transition={{ duration: 0.15, repeat: Infinity, repeatDelay: 4 }}
                />
                <circle cx="43" cy="44" r="1.5" fill="white" />
                {/* Right eye */}
                <motion.ellipse cx="65" cy="46" rx="5" ry="5.5" fill="hsl(var(--foreground))"
                  animate={{ ry: [5.5, 0.5, 5.5] }}
                  transition={{ duration: 0.15, repeat: Infinity, repeatDelay: 4 }}
                />
                <circle cx="63" cy="44" r="1.5" fill="white" />
              </>
            )}
            {eyeVariant === "closed" && (
              <>
                <path d="M 40 46 Q 45 49 50 46" stroke="hsl(var(--foreground))" strokeWidth="2" fill="none" strokeLinecap="round" />
                <path d="M 60 46 Q 65 49 70 46" stroke="hsl(var(--foreground))" strokeWidth="2" fill="none" strokeLinecap="round" />
              </>
            )}
            {eyeVariant === "sad" && (
              <>
                <ellipse cx="45" cy="48" rx="4" ry="4.5" fill="hsl(var(--foreground))" />
                <circle cx="43.5" cy="46.5" r="1.2" fill="white" />
                <ellipse cx="65" cy="48" rx="4" ry="4.5" fill="hsl(var(--foreground))" />
                <circle cx="63.5" cy="46.5" r="1.2" fill="white" />
                {/* Sad eyebrows */}
                <line x1="38" y1="39" x2="48" y2="41" stroke="hsl(var(--foreground))" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="72" y1="39" x2="62" y2="41" stroke="hsl(var(--foreground))" strokeWidth="1.5" strokeLinecap="round" />
              </>
            )}

            {/* Nose */}
            <ellipse cx="55" cy="53" rx="2" ry="1.5" fill="hsl(350 60% 55%)" />

            {/* Mouth */}
            {moodKey === "happy" || moodKey === "ecstatic" || moodKey === "eating" ? (
              <path d="M 50 56 Q 55 61 60 56" stroke="hsl(var(--foreground))" strokeWidth="1.5" fill="none" strokeLinecap="round" />
            ) : (
              <path d="M 52 57 Q 55 58 58 57" stroke="hsl(var(--foreground))" strokeWidth="1" fill="none" strokeLinecap="round" />
            )}

            {/* Cheeks (blush when happy) */}
            <circle cx="37" cy="53" r="5" fill={cheekColor} />
            <circle cx="73" cy="53" r="5" fill={cheekColor} />

            {/* Whiskers */}
            <line x1="30" y1="50" x2="40" y2="52" stroke="hsl(var(--foreground) / 0.3)" strokeWidth="0.8" />
            <line x1="30" y1="55" x2="40" y2="55" stroke="hsl(var(--foreground) / 0.3)" strokeWidth="0.8" />
            <line x1="70" y1="52" x2="80" y2="50" stroke="hsl(var(--foreground) / 0.3)" strokeWidth="0.8" />
            <line x1="70" y1="55" x2="80" y2="55" stroke="hsl(var(--foreground) / 0.3)" strokeWidth="0.8" />

            {/* Paws */}
            <ellipse cx="38" cy="98" rx="10" ry="6" fill={bodyColor} />
            <ellipse cx="72" cy="98" rx="10" ry="6" fill={bodyColor} />
            
            {/* Paw details */}
            <circle cx="34" cy="97" r="2" fill="hsl(0 60% 80% / 0.3)" />
            <circle cx="38" cy="95" r="2" fill="hsl(0 60% 80% / 0.3)" />
            <circle cx="42" cy="97" r="2" fill="hsl(0 60% 80% / 0.3)" />

            {/* Sleeping Zzz */}
            {moodKey === "sleeping" && (
              <motion.text
                x="80" y="30" fontSize="12" fill="hsl(var(--muted-foreground))"
                animate={{ opacity: [0, 1, 0], y: [30, 20] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                💤
              </motion.text>
            )}
          </motion.svg>

          {/* Accessory overlay */}
          {accessory && (
            <motion.div
              className="absolute -top-1 -right-1 text-lg"
              animate={{ rotate: [-5, 5, -5] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              {accessory.emoji}
            </motion.div>
          )}
        </motion.div>

        {/* Info */}
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

          <p className="text-[9px] text-muted-foreground/50 font-mono">
            Нажми на котёнка 👆
          </p>
        </div>
      </div>
    </motion.div>
  );
};

export default Companion;

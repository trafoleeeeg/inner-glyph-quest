import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

interface StreakBadgesProps {
  streak: number;
  longestStreak: number;
}

const BADGES = [
  { days: 3, icon: "🔥", title: "Первый огонь", desc: "3 дня подряд", color: "from-orange-500/20 to-red-500/20", border: "border-orange-500/30" },
  { days: 7, icon: "⚡", title: "Неделя силы", desc: "7 дней подряд", color: "from-yellow-500/20 to-orange-500/20", border: "border-yellow-500/30" },
  { days: 14, icon: "💎", title: "Несгибаемый", desc: "14 дней подряд", color: "from-blue-500/20 to-cyan-500/20", border: "border-blue-500/30" },
  { days: 30, icon: "👑", title: "Легенда", desc: "30 дней подряд", color: "from-purple-500/20 to-pink-500/20", border: "border-purple-500/30" },
];

const StreakBadges = ({ streak, longestStreak }: StreakBadgesProps) => {
  const [newBadge, setNewBadge] = useState<typeof BADGES[0] | null>(null);
  const maxStreak = Math.max(streak, longestStreak);

  useEffect(() => {
    const shownKey = `neuro_streak_badge_shown_${streak}`;
    const badge = BADGES.find(b => b.days === streak);
    if (badge && !localStorage.getItem(shownKey)) {
      setNewBadge(badge);
      localStorage.setItem(shownKey, "1");
    }
  }, [streak]);

  const earned = BADGES.filter(b => maxStreak >= b.days);
  const next = BADGES.find(b => maxStreak < b.days);

  if (earned.length === 0 && !next) return null;

  return (
    <>
      {/* New badge popup */}
      <AnimatePresence>
        {newBadge && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
            onClick={() => setNewBadge(null)}
          >
            <motion.div
              initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0 }} transition={{ type: "spring", damping: 12 }}
              className="glass-card rounded-3xl p-8 max-w-xs text-center border border-accent/20"
              onClick={e => e.stopPropagation()}
            >
              <motion.div
                animate={{ scale: [1, 1.3, 1], rotate: [0, 10, -10, 0] }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="text-6xl mb-4"
              >
                {newBadge.icon}
              </motion.div>
              <motion.h2 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                className="text-lg font-bold text-foreground mb-1">{newBadge.title}</motion.h2>
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
                className="text-xs text-muted-foreground mb-1">{newBadge.desc}</motion.p>
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
                className="text-xs text-accent font-mono">🔥 {streak} дней подряд!</motion.p>
              <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
                onClick={() => setNewBadge(null)}
                className="mt-4 px-6 py-2 rounded-xl bg-primary/20 text-primary text-sm font-medium hover:bg-primary/30 transition-all">
                Круто!
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Inline badges display */}
      <div className="glass-card rounded-xl p-3 border border-border/30">
        <p className="text-[10px] font-mono text-muted-foreground mb-2 uppercase tracking-wider">Награды за серию</p>
        <div className="flex items-center gap-2">
          {BADGES.map(badge => {
            const isEarned = maxStreak >= badge.days;
            return (
              <motion.div
                key={badge.days}
                whileHover={isEarned ? { scale: 1.1 } : {}}
                className={`flex-1 text-center p-2 rounded-xl border transition-all ${
                  isEarned
                    ? `bg-gradient-to-br ${badge.color} ${badge.border}`
                    : "bg-muted/10 border-border/10 opacity-30"
                }`}
              >
                <span className={`text-xl ${isEarned ? "" : "grayscale"}`}>{badge.icon}</span>
                <p className="text-[8px] font-mono mt-1 text-muted-foreground">{badge.days}д</p>
              </motion.div>
            );
          })}
        </div>
        {next && (
          <p className="text-[9px] text-muted-foreground font-mono mt-2 text-center">
            До «{next.title}» — ещё {next.days - streak} {next.days - streak === 1 ? "день" : next.days - streak < 5 ? "дня" : "дней"}
          </p>
        )}
      </div>
    </>
  );
};

export default StreakBadges;

import { motion } from "framer-motion";

interface XPBarProps {
  current: number;
  max: number;
  level: number;
  displayName?: string;
}

const LEVEL_TITLES: Record<number, string> = {
  1: "Новичок",
  2: "Пробуждённый",
  3: "Исследователь",
  4: "Адепт",
  5: "Мастер",
  6: "Мудрец",
  7: "Архитектор",
  8: "Провидец",
  9: "Нейромант",
  10: "Трансцендент",
};

const XPBar = ({ current, max, level, displayName }: XPBarProps) => {
  const percentage = Math.min((current / max) * 100, 100);
  const title = LEVEL_TITLES[level] || LEVEL_TITLES[10];

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-2xl p-5 gradient-border shimmer"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          {/* Level orb */}
          <motion.div
            className="relative w-12 h-12 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center overflow-hidden"
            animate={{ boxShadow: ['0 0 15px hsl(180 100% 50% / 0.2)', '0 0 25px hsl(180 100% 50% / 0.4)', '0 0 15px hsl(180 100% 50% / 0.2)'] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <span className="text-primary font-mono font-bold text-lg relative z-10">{level}</span>
            <div className="absolute inset-0 bg-gradient-to-t from-primary/10 to-transparent" />
          </motion.div>
          <div>
            <p className="text-sm font-semibold text-foreground">{displayName || 'Нейронавт'}</p>
            <p className="text-xs text-primary font-mono">{title}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="font-mono text-sm text-primary font-bold">
            {current} <span className="text-muted-foreground">/ {max}</span>
          </p>
          <p className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">XP</p>
        </div>
      </div>
      
      <div className="relative h-3 bg-muted/50 rounded-full overflow-hidden">
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          style={{
            background: 'linear-gradient(90deg, hsl(180 100% 50%), hsl(160 80% 55%), hsl(140 70% 50%))',
            boxShadow: '0 0 15px hsl(180 100% 50% / 0.5), 0 0 30px hsl(180 100% 50% / 0.2)',
          }}
        />
        {/* Shimmer on progress */}
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full opacity-30"
          style={{ width: `${percentage}%` }}
          animate={{ backgroundPosition: ['200% 0', '-200% 0'] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        >
          <div className="w-full h-full" style={{
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
            backgroundSize: '50% 100%',
          }} />
        </motion.div>
      </div>
    </motion.div>
  );
};

export default XPBar;

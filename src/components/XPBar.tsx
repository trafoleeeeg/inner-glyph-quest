import { motion } from "framer-motion";

interface XPBarProps {
  current: number;
  max: number;
  level: number;
}

const XPBar = ({ current, max, level }: XPBarProps) => {
  const percentage = (current / max) * 100;

  return (
    <div className="glass rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/20 border border-primary/30 flex items-center justify-center glow-primary">
            <span className="text-primary font-mono font-bold text-sm">{level}</span>
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-mono uppercase tracking-wider">Уровень</p>
            <p className="text-sm font-semibold text-foreground">Исследователь</p>
          </div>
        </div>
        <p className="font-mono text-sm text-primary">
          {current} / {max} XP
        </p>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          style={{ boxShadow: '0 0 10px hsl(180 100% 50% / 0.5)' }}
        />
      </div>
    </div>
  );
};

export default XPBar;

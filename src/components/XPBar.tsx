import { motion } from "framer-motion";

interface XPBarProps {
  current: number;
  max: number;
  level: number;
  displayName?: string;
}

const LEVEL_TITLES: Record<number, string> = {
  1: "Новичок", 2: "Исследователь", 3: "Практик", 4: "Стратег", 5: "Наставник",
  6: "Архитектор", 7: "Мастер", 8: "Эксперт", 9: "Гуру", 10: "Легенда",
};

const XPBar = ({ current, max, level, displayName }: XPBarProps) => {
  const percentage = Math.min((current / max) * 100, 100);
  const title = LEVEL_TITLES[level] || LEVEL_TITLES[10];

  return (
    <div className="py-4 border-b border-border">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-base font-semibold text-foreground">{displayName || 'Пользователь'}</p>
          <p className="text-xs text-muted-foreground">{title} · Уровень {level}</p>
        </div>
        <div className="text-right">
          <p className="font-mono text-sm text-foreground font-bold">
            {current}<span className="text-muted-foreground">/{max}</span>
          </p>
          <p className="text-[10px] text-muted-foreground font-mono">XP</p>
        </div>
      </div>

      <div className="relative h-1 bg-muted rounded-full overflow-hidden">
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full bg-foreground"
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
    </div>
  );
};

export default XPBar;
